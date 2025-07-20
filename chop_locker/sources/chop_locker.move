module chop_locker::chop_locker {
    
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::clock::{Self, Clock};
    // use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use std::string::{String};
    // use sui::tx_context::{Self, TxContext};
    // use sui::transfer;
    // use sui::math;
    // use sui::config;

    // Error codes
    // const ENotAdmin: u64 = 0;
    const ELockPeriodNotEnded: u64 = 1;
    const ENoTokensLocked: u64 = 2;
    const EInsufficientRewards: u64 = 3;

    // const EZeroTotalStaked: u64 = 1;
    // const EZeroRewardPool: u64 = 2;
    // const EZeroEmissionPeriods: u64 = 3;
    // const EZeroRewardPeriod: u64 = 4;
    const PoolAlreadyExists: u64 = 5;
    // const DECIMAL_SCALE: u64 = 1_000_000_000; // 9 decimals for token balances
    // const APY_SCALE: u64 = 1_000_000; // 6 decimals for APY precision
    // const MAX_APY: u64 = 50_000_000; // 50% APY cap
    // const DAYS_PER_YEAR: u64 = 365;

    // const EZeroStakedBalance: u64 = 5;
    // const EArithmeticOverflow: u64 = 6;
    // const MAX_U128: u128 = 340_282_366_920_938_463_463_374_607_431_768_211_455;

    /// Admin capability to fund rewards
    public struct ChopLockerAdmin has key { id: UID }

    public struct PoolAdmin has key { 
        id: UID,
        poolAddy: address,
        token_type: String
    }

    public struct PoolDirectory has key {
        id: UID,
        token_types: vector<String>
    }

    /// Staking pool configuration (owned by admin)
    public struct PoolConfig<phantom T0> has key {
        id: UID,
        total_staked: u64, // Total tokens staked across all users
        reward_balance: Balance<T0>, // Balance for paying rewards,
        token_type: String,
        active_lockers: u64
    }

    /// User-specific lock object (owned by user)
    public struct Lock<phantom T0> has key, store {
        id: UID,
        staked: Balance<T0>,
        start_time: u64, // Timestamp when tokens were locked
        end_time: u64,
        locked_in_apy: u64,
        token_type: String,
        rewards_locked: Balance<T0>,
        pool_config: address
    }

    /// Initialize the contract
    fun init(ctx: &mut TxContext) {

        // Create AdminCap and transfer to sender
        let admin_cap = ChopLockerAdmin { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        let pool_directory = PoolDirectory {
            id: object::new(ctx),
            token_types: vector::empty()
        };
        transfer::share_object(pool_directory);

        // Transfer TreasuryCap to sender
        // transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    }

    public fun new_pool_config<T0>(pool_directory: &mut PoolDirectory, coin: Coin<T0>, token_type: String, ctx: &mut TxContext) {
        assert!(!pool_directory.token_types.contains(&token_type), PoolAlreadyExists);
        let balance = coin::into_balance(coin);
        let poolId = object::new(ctx);
        let poolAddy = object::uid_to_address(&poolId);
        let pool_config = PoolConfig<T0> {
            id: poolId,
            // lock_period: lock_period, //30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
            total_staked: 0,
            reward_balance: balance,
            token_type: token_type,
            active_lockers: 0
        };
        let pool_admin = PoolAdmin {
            id: object::new(ctx),
            poolAddy: poolAddy,
            token_type: token_type
        };
        vector::insert(&mut pool_directory.token_types, token_type, 0);
        transfer::transfer(pool_admin, tx_context::sender(ctx));
        transfer::share_object(pool_config);
    }

    /// Calculate dynamic APY based on total staked tokens
    public fun calculate_apy<T0>(config: &mut PoolConfig<T0>, si: u64, d: u64): u64 {
        let tst = config.total_staked;
        if (tst > 0) {
            let rps = config.reward_balance.value();
            let tep = 365;
            let rpa = rps / tep;
            let mx =  ((100*d)/(90)) + 50;
            let apy = ((1000*si)/ tst) * ((100*rpa) / tep) * mx * tep; 
            apy/1000000000 //with 10^4 on end
        } else {
            180000 // = 18%
        }
}

        // let base_apy = config.base_apy;

        // Example dynamic APY formula: APY = base_apy / (1 + total_staked / scaling_factor)
        // Higher total_staked -> lower APY
        // let scaling_factor = 1000000000; // Adjust based on token decimals (e.g., 1B for 9 decimals)
        // if (total_staked == 0) {
        //     config.current_apy = config.base_apy;
        //     base_apy // Return base APY if no tokens staked
        // } else {
        //     let denominator = 1 + (total_staked as u128) / (scaling_factor as u128);
        //     let dynamic_apy = (base_apy as u128) / denominator;
        //     config.current_apy = (dynamic_apy as u64);
        //     (dynamic_apy as u64)
        // }
    // }

    /// Admin funds the reward pool by minting tokens
    public entry fun fund_rewards_override<T0>(
        _: &ChopLockerAdmin,
        config: &mut PoolConfig<T0>,
        amount: u64,
        reward_coins: Coin<T0>,
        ctx: &mut TxContext
    ) {
        balance::join(&mut config.reward_balance, coin::into_balance(reward_coins));
    }

    public entry fun fund_rewards<T0>(
        poolAdmin: &PoolAdmin,
        config: &mut PoolConfig<T0>,
        amount: u64,
        reward_coins: Coin<T0>,
        ctx: &mut TxContext
    ) {
        assert!(poolAdmin.poolAddy == object::uid_to_address(&config.id), 6);
        balance::join(&mut config.reward_balance, coin::into_balance(reward_coins));
    }

    /// User locks tokens to start earning rewards
    public entry fun lock_tokens<T0>(
        config: &mut PoolConfig<T0>,
        tokens: Coin<T0>,
        clock: &Clock,
        ms_locked: u64,
        token_type: String,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&tokens);
        assert!(amount > 0, ENoTokensLocked);

        // Update total staked
        let days = (ms_locked / 86400000) + 1;
        let mut apy = 0;
        if(config.reward_balance.value() > 0){
            apy = calculate_apy(config, tokens.balance().value(),  days);
        };
        
        let current_time = clock::timestamp_ms(clock);

        config.total_staked = config.total_staked + amount;

        let days_calc = (1000*days / 365); //+ 3
        let apy_and_days_calc = (days_calc * apy)/100; //+ 6 - 2 = + 4
        let reward_amount_tmp = (tokens.balance().value() / 1000) * apy_and_days_calc; // -3
        //= +4
        let reward_amount = reward_amount_tmp / 10000;
        let newBalance: Balance<T0>;
        if(config.reward_balance.value() > 0){
            newBalance = withdraw_from_balance(&mut config.reward_balance, reward_amount, ctx);
        }else{
            newBalance = balance::zero();
        };

        let lock = Lock {
            id: object::new(ctx),
            staked: coin::into_balance(tokens),
            start_time: current_time,
            end_time: current_time + ms_locked,
            locked_in_apy: apy,
            token_type: token_type,
            rewards_locked: newBalance,
            pool_config: object::uid_to_address(&config.id)
        };
        config.active_lockers = config.active_lockers + 1;
        transfer::transfer(lock, tx_context::sender(ctx));
    }

    fun withdraw_from_balance<T0>(balance_obj: &mut Balance<T0>, amount: u64, ctx: &mut TxContext): Balance<T0> {
        assert!(balance::value(balance_obj) >= amount, EInsufficientRewards);
        let withdrawn_balance = balance::split(balance_obj, amount);
        withdrawn_balance
    }

    /// Calculate rewards based on dynamic APY and time locked
    // public fun calculate_rewards<T0>(
    //     lock: &Lock<T0>,
    //     config: &mut PoolConfig<T0>,
    //     clock: &Clock
    // ): u64 {
    //     let current_time = clock::timestamp_ms(clock);
    //     let time_locked_ms = current_time - lock.start_time;
    //     let staked_amount = balance::value(&lock.staked);

    //     // Use dynamic APY
    //     let apy = calculate_apy(config);

    //     // Simple interest: (principal * APY * time) / (100 * 365.25 * 24 * 3600 * 1000)
    //     let apy = (apy as u128);
    //     let time_locked_ms = (time_locked_ms as u128);
    //     let staked_amount = (staked_amount as u128);
    //     let seconds_per_year = 36525 * 24 * 3600 * 1000 / 100; // 365.25 days in milliseconds

    //     let rewards = (staked_amount * apy * time_locked_ms) / (10000 * (seconds_per_year as u128));
    //     (rewards as u64)
    // }

    /// User claims rewards
    // public entry fun claim_rewards<T0>(
    //     lock: &mut Lock<T0>,
    //     config: &mut PoolConfig<T0>,
    //     clock: &Clock,
    //     ctx: &mut TxContext
    // ) {
    //     let rewards_amount = calculate_rewards(lock, config, clock);
    //     assert!(rewards_amount > 0, ENoTokensLocked);
    //     assert!(balance::value(&config.reward_balance) >= rewards_amount, EInsufficientRewards);

    //     // Pay rewards
    //     let rewards = coin::take(&mut config.reward_balance, rewards_amount, ctx);
    //     transfer::public_transfer(rewards, tx_context::sender(ctx));

    //     // Update start_time to reset reward calculation
    //     lock.start_time = clock::timestamp_ms(clock);
    // }

    /// User withdraws staked tokens after lock period
    public entry fun withdraw_tokens<T0>(
        lock: Lock<T0>,
        config: &mut PoolConfig<T0>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= lock.end_time, ELockPeriodNotEnded);

        let Lock<T0> { 
            id, 
            staked, 
            start_time: _,
            end_time: _,
            locked_in_apy: _,
            token_type: _,
            rewards_locked,
            pool_config: _
            } = lock; // needs to be done like this so we get the uid to delete
        let amount = balance::value(&staked);
        object::delete(id);

        // Update total staked
        config.total_staked = config.total_staked - amount;

        // Return staked tokens
        let tokens = coin::from_balance(staked, ctx);
        let rewards = coin::from_balance(rewards_locked, ctx);
        config.active_lockers = config.active_lockers - 1;
        transfer::public_transfer(tokens, tx_context::sender(ctx));
        transfer::public_transfer(rewards, tx_context::sender(ctx));
    }

    /// Helper function to get current dynamic APY
    // public fun get_apy<T0>(config: &mut PoolConfig<T0>): u64 {
    //     calculate_apy(config)
    // }

    // Helper function to get lock period
    // public fun get_lock_period<T0>(config: &PoolConfig<T0>): u64 {
    //     config.lock_period
    // }


    // public fun calculate_apy<T>(staked_balance: &Balance<T>, total_staked: u64, reward_pool: &Balance<T>, lock_duration: u64): u64 {
    //     assert!(balance::value(reward_pool) > 0, EZeroRewardPool);
    //     let reward_period = 1;
    //     let total_emission_periods = 365;
    //     let s_i = balance::value(staked_balance); // User’s staked amount (9 decimals)
    //     let rps = balance::value(reward_pool); // Reward pool size (9 decimals)
    //     let rpa = rps / total_emission_periods; // Reward per period (9 decimals)

        

        // let m_x = if (lock_duration == 14) { 500_000 } // 0.5 * APY_SCALE
        // else if (lock_duration == 30) { 1_000_000 } // 1 * APY_SCALE
        // else if (lock_duration == 90) { 2_000_000 } // 2 * APY_SCALE
        // else if (lock_duration == 180) { 3_000_000 } // 3 * APY_SCALE
        // else if (lock_duration == 365) { 5_000_000 } // 5 * APY_SCALE
        // else { 1_000_000 + ((4_000_000 * lock_duration) / DAYS_PER_YEAR) }; // Continuous: 1 + 4 * (X / 365)

        // let m_x = (((100*lock_duration)/(90)) + 50)*1000; // 500_00 = .5

        // let apy: u64;
        // if (total_staked == 0) {
        //     // First staker: use default APY
        //     let base_apy = (rpa / total_emission_periods) * m_x / DECIMAL_SCALE * DAYS_PER_YEAR * 100;
        //     apy = if (base_apy > MAX_APY) { MAX_APY } else { base_apy };
        // } else {
            // Calculate APY: (S_i / TST) * (RPA / TEP) * M(X) * (365 / P) * 100
        //     let s_i_scaled = (s_i as u128) * (APY_SCALE as u128); // Scale for precision
        //     let tst_scaled = (total_staked as u128);
        //     let rpa_scaled = (rpa as u128) * (APY_SCALE as u128);
        //     let tep_scaled = (total_emission_periods as u128);
        //     let m_x_scaled = (m_x as u128);
        //     let days_per_year_scaled = (DAYS_PER_YEAR as u128) * (APY_SCALE as u128);
        //     let reward_period_scaled = (reward_period as u128);
        //     let apy_1 = ((s_i_scaled / (tst_scaled*100000)) * (rpa_scaled / (tep_scaled*100000)));
        //     let apy_scaled = apy_1 * m_x_scaled * days_per_year_scaled * 100 / reward_period_scaled;
        //     apy = if (apy_scaled > (MAX_APY as u128)) { (apy_scaled as u64) } else { (apy_scaled as u64) };
        // // };

        // APY = (S_i / TST) * (RPA / TEP) * M(X) * (365 / P) * 100
        // let s_i_scaled = (s_i as u128); // No premature scaling
        // let tst_scaled = (total_staked as u128);
        // let rpa_scaled = (rpa as u128);
        // let tep_scaled = (total_emission_periods as u128);
        // let m_x_scaled = (m_x as u128);
        // let days_per_year_scaled = (DAYS_PER_YEAR as u128);
        // let reward_period_scaled = (reward_period as u128);

        // // Reorder to divide early and reduce magnitude
        // let step1: u128 = s_i_scaled / tst_scaled;// S_i / TST
        // assert!(step1 <= MAX_U128, EArithmeticOverflow);
        // let step2: u128 = rpa_scaled / tep_scaled; // RPA / TEP
        // assert!(step2 <= MAX_U128, EArithmeticOverflow);
        // let step3: u128 = (step1 * step2) / (DECIMAL_SCALE as u128); // (S_i / TST) * (RPA / TEP)
        // assert!(step3 <= MAX_U128, EArithmeticOverflow);
        // let step4: u128 = step3 * m_x_scaled; // * M(X)
        // assert!(step4 <= MAX_U128, EArithmeticOverflow);
        // let step5: u128 = step4 * days_per_year_scaled; // * 365
        // assert!(step5 <= MAX_U128 / (reward_period_scaled * 100), EArithmeticOverflow);
        // let step6: u128 = step5 / reward_period_scaled; // / P
        // assert!(step6 <= MAX_U128 / 100, EArithmeticOverflow);
        // let apy_scaled: u128 = step6 * 100; // * 100
        // apy = if (apy_scaled > (MAX_APY as u128)) { MAX_APY } else { (apy_scaled as u64) };
        // };
        // apy
        // }
    }