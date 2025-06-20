module chop_locker::chop_locker {
    
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::math;
    use sui::config;

    /// Error codes
    const ENotAdmin: u64 = 0;
    const ELockPeriodNotEnded: u64 = 1;
    const ENoTokensLocked: u64 = 2;
    const EInsufficientRewards: u64 = 3;

    /// Admin capability to fund rewards
    public struct ChopLockerAdmin has key { id: UID }

    /// Staking pool configuration (owned by admin)
    public struct PoolConfig<phantom T0> has key {
        id: UID,
        base_apy: u64, // Base APY in basis points (e.g., 1000 = 10.00%)
        current_apy: u64,
        lock_period: u64, // Lock period in milliseconds
        total_staked: u64, // Total tokens staked across all users
        reward_balance: Balance<T0>, // Balance for paying rewards
    }

    /// User-specific lock object (owned by user)
    public struct Lock<phantom T0> has key, store {
        id: UID,
        staked: Balance<T0>,
        start_time: u64, // Timestamp when tokens were locked
        locked_in_apy: u64
    }

    /// Initialize the contract
    fun init(ctx: &mut TxContext) {

        // Create AdminCap and transfer to sender
        let admin_cap = ChopLockerAdmin { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        // Transfer TreasuryCap to sender
        // transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    }

    public fun new_pool_config<T0>(_admin: &ChopLockerAdmin, coin: Coin<T0>, base_apy: u64, lock_period: u64, ctx: &mut TxContext) {
        let balance = coin::into_balance(coin);
                let pool_config = PoolConfig<T0> {
            id: object::new(ctx),
            base_apy: base_apy, // 1000 = Initial base APY: 10.00%
            current_apy: base_apy,
            lock_period: lock_period, //30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
            total_staked: 0,
            reward_balance: balance,
        };
        transfer::transfer(pool_config, tx_context::sender(ctx));
    }

    /// Calculate dynamic APY based on total staked tokens
    public fun calculate_apy<T0>(config: &mut PoolConfig<T0>): u64 {
        let total_staked = config.total_staked;
        let base_apy = config.base_apy;

        // Example dynamic APY formula: APY = base_apy / (1 + total_staked / scaling_factor)
        // Higher total_staked -> lower APY
        let scaling_factor = 1000000000; // Adjust based on token decimals (e.g., 1B for 9 decimals)
        if (total_staked == 0) {
            config.current_apy = config.base_apy;
            base_apy // Return base APY if no tokens staked
        } else {
            let denominator = 1 + (total_staked as u128) / (scaling_factor as u128);
            let dynamic_apy = (base_apy as u128) / denominator;
            config.current_apy = (dynamic_apy as u64);
            (dynamic_apy as u64)
        }
    }

    /// Admin funds the reward pool by minting tokens
    public entry fun fund_rewards<T0>(
        _: &ChopLockerAdmin,
        treasury: &mut TreasuryCap<T0>,
        config: &mut PoolConfig<T0>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let reward_coins = coin::mint(treasury, amount, ctx);
        balance::join(&mut config.reward_balance, coin::into_balance(reward_coins));
    }

    /// User locks tokens to start earning rewards
    public entry fun lock_tokens<T0>(
        config: &mut PoolConfig<T0>,
        tokens: Coin<T0>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&tokens);
        assert!(amount > 0, ENoTokensLocked);

        // Update total staked
        config.total_staked = config.total_staked + amount;

        let apy = calculate_apy(config);

        let lock = Lock {
            id: object::new(ctx),
            staked: coin::into_balance(tokens),
            start_time: clock::timestamp_ms(clock),
            locked_in_apy: apy
        };
        transfer::transfer(lock, tx_context::sender(ctx));
    }

    /// Calculate rewards based on dynamic APY and time locked
    public fun calculate_rewards<T0>(
        lock: &Lock<T0>,
        config: &mut PoolConfig<T0>,
        clock: &Clock
    ): u64 {
        let current_time = clock::timestamp_ms(clock);
        let time_locked_ms = current_time - lock.start_time;
        let staked_amount = balance::value(&lock.staked);

        // Use dynamic APY
        let apy = calculate_apy(config);

        // Simple interest: (principal * APY * time) / (100 * 365.25 * 24 * 3600 * 1000)
        let apy = (apy as u128);
        let time_locked_ms = (time_locked_ms as u128);
        let staked_amount = (staked_amount as u128);
        let seconds_per_year = 36525 * 24 * 3600 * 1000 / 100; // 365.25 days in milliseconds

        let rewards = (staked_amount * apy * time_locked_ms) / (10000 * (seconds_per_year as u128));
        (rewards as u64)
    }

    /// User claims rewards
    public entry fun claim_rewards<T0>(
        lock: &mut Lock<T0>,
        config: &mut PoolConfig<T0>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let rewards_amount = calculate_rewards(lock, config, clock);
        assert!(rewards_amount > 0, ENoTokensLocked);
        assert!(balance::value(&config.reward_balance) >= rewards_amount, EInsufficientRewards);

        // Pay rewards
        let rewards = coin::take(&mut config.reward_balance, rewards_amount, ctx);
        transfer::public_transfer(rewards, tx_context::sender(ctx));

        // Update start_time to reset reward calculation
        lock.start_time = clock::timestamp_ms(clock);
    }

    /// User withdraws staked tokens after lock period
    public entry fun withdraw_tokens<T0>(
        lock: Lock<T0>,
        config: &mut PoolConfig<T0>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= lock.start_time + config.lock_period, ELockPeriodNotEnded);

        let Lock<T0> { 
            id, 
            staked, 
            start_time: _,
            locked_in_apy: _
            } = lock; // needs to be done like this so we get the uid to delete
        let amount = balance::value(&staked);
        object::delete(id);

        // Update total staked
        config.total_staked = config.total_staked - amount;

        // Return staked tokens
        let tokens = coin::from_balance(staked, ctx);
        transfer::public_transfer(tokens, tx_context::sender(ctx));
    }

    /// Helper function to get current dynamic APY
    public fun get_apy<T0>(config: &mut PoolConfig<T0>): u64 {
        calculate_apy(config)
    }

    /// Helper function to get lock period
    public fun get_lock_period<T0>(config: &PoolConfig<T0>): u64 {
        config.lock_period
    }
}