module chop_locker::chop_locker {

    use sui::clock::{Self, Clock};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use std::string::{String};

    const ELockPeriodNotEnded: u64 = 1;
    const ENoTokensLocked: u64 = 2;
    const EPoolAlreadyExists: u64 = 5;
    const EInvalidDuration: u64 = 10;
    const EInsufficientPool: u64 = 11;
    const EZeroAmount: u64 = 12;

    const MIN_APY: u64 = 1_000_000_000;
    const MAX_DAYS: u64 = 365;
    const MIN_DAYS: u64 = 1;
    const SCALING_FACTOR: u128 = 1_000_000_000;

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

    public struct PoolConfig<phantom T0> has key {
        id: UID,
        total_staked: u64,
        total_rewards_added_by_admin: u64,
        reward_balance: Balance<T0>,
        token_type: String,
        active_lockers: u64,
        total_weighted_stake: u64,
        maxAPY: u64
    }

    public struct Lock<phantom T0> has key, store {
        id: UID,
        staked: Balance<T0>,
        start_time: u64,
        end_time: u64,
        locked_in_apy: u64,
        token_type: String,
        rewards_locked: Balance<T0>,
        pool_config: address,
        pool_size_at_creation: u64,
        adjusted_reward_rate: u64,
    }

    fun init(ctx: &mut TxContext) {
        let admin_cap = ChopLockerAdmin { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        let pool_directory = PoolDirectory {
            id: object::new(ctx),
            token_types: vector[]
        };
        transfer::share_object(pool_directory);
    }

    public fun new_pool_config<T0>(
        pool_directory: &mut PoolDirectory,
        coin: Coin<T0>,
        token_type: String,
        maxAPY: u64,
        ctx: &mut TxContext
    ) {
        assert!(!pool_directory.token_types.contains(&token_type), EPoolAlreadyExists);
        let coinVal = coin.value();
        let balance = coin::into_balance(coin);
        let poolId = object::new(ctx);
        let poolAddy = object::uid_to_address(&poolId);
        let pool_config = PoolConfig<T0> {
            id: poolId,
            total_staked: 0,
            reward_balance: balance,
            token_type: token_type,
            active_lockers: 0,
            total_rewards_added_by_admin: coinVal,
            total_weighted_stake: 0,
            maxAPY: maxAPY
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

    fun calculate_apy(duration: u64, maxAPY: u64): u64 {
        let duration_minus_one = if (duration > MIN_DAYS) { duration - 1 } else { 0 };
        let apy_range = maxAPY - MIN_APY;
        let apy_increment = (apy_range * duration_minus_one) / (MAX_DAYS - 1);
        MIN_APY + apy_increment
    }

    fun calculate_base_reward_rate(duration: u64, apy: u64): u64 {
        (apy * duration) / MAX_DAYS
    }

    fun calculate_depletion_factor(remaining_pool: u64, total_pool: u64): u64 {
        if (remaining_pool == 0 || total_pool == 0) return 0;
        let ratio = ((remaining_pool as u128) * (SCALING_FACTOR / 10)) / (total_pool as u128);
        sqrt_u128(ratio) as u64
    }

    fun sqrt_u128(x: u128): u128 {
        if (x == 0) return 0;
        if (x == 1) return 1;
        let mut guess = x;
        let mut iteration = 0;
        while (iteration < 20) {
            let new_guess = (guess + x / guess) / 2;
            if (new_guess == guess) break;
            guess = new_guess;
            iteration = iteration + 1;
        };
        guess
    }

    fun calculate_adjusted_reward_rate(base_rate: u64, remaining_pool: u64, total_pool: u64): u64 {
        let f = calculate_depletion_factor(remaining_pool, total_pool);
        ((base_rate * f) as u128 / SCALING_FACTOR) as u64
    }

    public entry fun fund_rewards_override<T0>(
        _: &ChopLockerAdmin,
        config: &mut PoolConfig<T0>,
        reward_coins: Coin<T0>,
    ) {
        balance::join(&mut config.reward_balance, coin::into_balance(reward_coins));
    }

    public entry fun fund_rewards<T0>(
        poolAdmin: &PoolAdmin,
        config: &mut PoolConfig<T0>,
        reward_coins: Coin<T0>,
    ) {
        assert!(poolAdmin.poolAddy == object::uid_to_address(&config.id), EZeroAmount);
        config.total_rewards_added_by_admin = config.total_rewards_added_by_admin + reward_coins.value();
        balance::join(&mut config.reward_balance, coin::into_balance(reward_coins));
    }

    public entry fun lock_tokens<T0>(
        config: &mut PoolConfig<T0>,
        tokens: Coin<T0>,
        clock: &Clock,
        ms_locked: u64,
        token_type: String,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&tokens);
        let days = (ms_locked / 86400000) + 1;
        assert!(amount > 0, ENoTokensLocked);
        assert!(days >= MIN_DAYS && days <= MAX_DAYS, EInvalidDuration);

        let current_time = clock::timestamp_ms(clock);
        let rewardBalance: Balance<T0>;
        let mut adjusted_rate = 0;

        if (config.reward_balance.value() > 0) {
            config.total_staked = config.total_staked + amount;

            let apy = calculate_apy(days, config.maxAPY);
            let base_rate = calculate_base_reward_rate(days, apy);
            adjusted_rate = calculate_adjusted_reward_rate(
                base_rate,
                config.reward_balance.value(),
                config.total_rewards_added_by_admin
            );

            let ideal_reward = ((amount as u128) * (adjusted_rate as u128)) / SCALING_FACTOR;
            let new_weighted_stake = (amount as u128 / SCALING_FACTOR) * (adjusted_rate as u128);
            let total_weighted_stake = (config.total_weighted_stake as u128) + new_weighted_stake;

            let proportional_reward = if (total_weighted_stake > 0) {
                (new_weighted_stake * (config.reward_balance.value() as u128)) / total_weighted_stake
            } else {
                config.reward_balance.value() as u128
            };

            let reward = if (ideal_reward < proportional_reward) { ideal_reward } else { proportional_reward };
            assert!(reward <= config.reward_balance.value() as u128, EInsufficientPool);

            rewardBalance = balance::split(&mut config.reward_balance, reward as u64);
            config.total_weighted_stake = total_weighted_stake as u64;
        } else {
            rewardBalance = balance::zero();
        };

        let lock = Lock {
            id: object::new(ctx),
            staked: coin::into_balance(tokens),
            start_time: current_time,
            end_time: current_time + ms_locked,
            locked_in_apy: ((((365 / days) as u128) * (rewardBalance.value() as u128) * 1000000) / (amount as u128)) as u64,
            token_type: token_type,
            rewards_locked: rewardBalance,
            pool_config: object::uid_to_address(&config.id),
            pool_size_at_creation: config.reward_balance.value(),
            adjusted_reward_rate: adjusted_rate,
        };
        config.active_lockers = config.active_lockers + 1;
        transfer::transfer(lock, tx_context::sender(ctx));
    }

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
            pool_config: _,
            pool_size_at_creation: _,
            adjusted_reward_rate: _,
        } = lock;

        let amount = balance::value(&staked);
        object::delete(id);

        config.total_staked = config.total_staked - amount;
        config.active_lockers = config.active_lockers - 1;

        let tokens = coin::from_balance(staked, ctx);
        let rewards = coin::from_balance(rewards_locked, ctx);
        transfer::public_transfer(tokens, tx_context::sender(ctx));
        transfer::public_transfer(rewards, tx_context::sender(ctx));
    }
}
