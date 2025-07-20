// module reward_pool::reward_pool {
//     use sui::object::{Self, UID};
//     use sui::tx_context::{Self, TxContext};
//     use sui::coin::{Self, Coin};
//     use sui::balance::{Self, Balance};
//     use sui::transfer;
//     use sui::math;

//     // Constants
//     const INITIAL_POOL_SIZE: u64 = 100_000_000_000_000; // 100,000 tokens (scaled by 10^9 for precision)
//     const MIN_APY: u64 = 2_000_000_000; // 2% (scaled: 0.02 * 10^9)
//     const MAX_APY: u64 = 15_000_000_000; // 15% (scaled: 0.15 * 10^9)
//     const MAX_DAYS: u64 = 365;
//     const MIN_DAYS: u64 = 1;
//     const SCALING_FACTOR: u64 = 1_000_000_000; // 10^9 for fixed-point precision
//     const ALPHA_NUMERATOR: u64 = 5; // For alpha = 0.5
//     const ALPHA_DENOMINATOR: u64 = 10;

//     // Errors
//     const E_INVALID_DURATION: u64 = 0;
//     const E_INSUFFICIENT_POOL: u64 = 1;
//     const E_ZERO_AMOUNT: u64 = 2;

//     // Reward pool state
//     struct RewardPool has key {
//         id: UID,
//         total_pool: u64, // Initial pool size (scaled)
//         remaining_pool: u64, // Remaining pool size (scaled)
//         total_weighted_stake: u64, // Sum of A_i * r_adjusted,i
//         balance: Balance<SUI>, // Pool's token balance
//     }

//     // User stake
//     struct Stake has key, store {
//         id: UID,
//         amount: u64, // Tokens locked (scaled)
//         duration: u64, // Lock duration in days
//         pool_size_at_creation: u64, // Pool size when stake was created (scaled)
//         adjusted_reward_rate: u64, // r_adjusted (scaled)
//     }

//     // Initialize the reward pool
//     fun init(ctx: &mut TxContext) {
//         let pool = RewardPool {
//             id: object::new(ctx),
//             total_pool: INITIAL_POOL_SIZE,
//             remaining_pool: INITIAL_POOL_SIZE,
//             total_weighted_stake: 0,
//             balance: balance::zero<SUI>(),
//         };
//         transfer::share_object(pool);
//     }

//     // Calculate fluid APY: APY(D) = 0.02 + 0.13 * (D - 1) / 364
//     fun calculate_apy(duration: u64): u64 {
//         let duration_minus_one = if (duration > MIN_DAYS) { duration - 1 } else { 0 };
//         let apy_range = MAX_APY - MIN_APY; // 0.13 * 10^9
//         let apy_increment = (apy_range * duration_minus_one) / (MAX_DAYS - 1);
//         MIN_APY + apy_increment
//     }

//     // Calculate base reward rate: r = APY(D) * D / 365
//     fun calculate_base_reward_rate(duration: u64): u64 {
//         let apy = calculate_apy(duration);
//         (apy * duration) / MAX_DAYS
//     }

//     // Calculate pool depletion factor: F = (P_remaining / P)^alpha
//     fun calculate_depletion_factor(remaining_pool: u64, total_pool: u64): u64 {
//         if (remaining_pool == 0) return 0;
//         // Use approximate square root for alpha = 0.5
//         let ratio = (remaining_pool * SCALING_FACTOR) / total_pool;
//         math::sqrt(ratio)
//     }

//     // Calculate adjusted reward rate: r_adjusted = r * F
//     fun calculate_adjusted_reward_rate(base_rate: u64, remaining_pool: u64, total_pool: u64): u64 {
//         let f = calculate_depletion_factor(remaining_pool, total_pool);
//         (base_rate * f) / SCALING_FACTOR
//     }

//     // Create a new stake and calculate reward
//     public entry fun create_stake(
//         pool: &mut RewardPool,
//         amount: Coin<SUI>,
//         duration: u64,
//         ctx: &mut TxContext
//     ) {
//         assert!(duration >= MIN_DAYS && duration <= MAX_DAYS, E_INVALID_DURATION);
//         let amount_value = coin::value(&amount);
//         assert!(amount_value > 0, E_ZERO_AMOUNT);

//         // Calculate reward
//         let base_rate = calculate_base_reward_rate(duration);
//         let adjusted_rate = calculate_adjusted_reward_rate(base_rate, pool.remaining_pool, pool.total_pool);
//         let ideal_reward = (amount_value * adjusted_rate) / SCALING_FACTOR;

//         // Calculate total weighted stake
//         let new_weighted_stake = (amount_value * adjusted_rate) / SCALING_FACTOR;
//         let total_weighted_stake = pool.total_weighted_stake + new_weighted_stake;

//         // Calculate proportional reward
//         let proportional_reward = if (total_weighted_stake > 0) {
//             (new_weighted_stake * pool.remaining_pool) / total_weighted_stake
//         } else {
//             pool.remaining_pool
//         };

//         // Final reward: min(ideal, proportional)
//         let reward = if (ideal_reward < proportional_reward) { ideal_reward } else { proportional_reward };
//         assert!(reward <= pool.remaining_pool, E_INSUFFICIENT_POOL);

//         // Update pool
//         pool.remaining_pool = pool.remaining_pool - reward;
//         pool.total_weighted_stake = total_weighted_stake;

//         // Store stake
//         let stake = Stake {
//             id: object::new(ctx),
//             amount: amount_value,
//             duration,
//             pool_size_at_creation: pool.remaining_pool + reward, // Pool size before deduction
//             adjusted_reward_rate: adjusted_rate,
//         };
//         transfer::public_transfer(stake, tx_context::sender(ctx));

//         // Transfer reward (simplified: assumes pool has enough balance)
//         let reward_coin = coin::take(&mut pool.balance, reward, ctx);
//         transfer::public_transfer(reward_coin, tx_context::sender(ctx));

//         // Deposit locked amount to pool
//         coin::put(&mut pool.balance, amount);
//     }

//     // Query reward for a potential stake (view function)
//     public fun calculate_potential_reward(
//         pool: &RewardPool,
//         amount: u64,
//         duration: u64
//     ): u64 {
//         assert!(duration >= MIN_DAYS && duration <= MAX_DAYS, E_INVALID_DURATION);
//         assert!(amount > 0, E_ZERO_AMOUNT);

//         let base_rate = calculate_base_reward_rate(duration);
//         let adjusted_rate = calculate_adjusted_reward_rate(base_rate, pool.remaining_pool, pool.total_pool);
//         let ideal_reward = (amount * adjusted_rate) / SCALING_FACTOR;
//         let new_weighted_stake = (amount * adjusted_rate) / SCALING_FACTOR;
//         let total_weighted_stake = pool.total_weighted_stake + new_weighted_stake;
//         let proportional_reward = if (total_weighted_stake > 0) {
//             (new_weighted_stake * pool.remaining_pool) / total_weighted_stake
//         } else {
//             pool.remaining_pool
//         };
//         if (ideal_reward < proportional_reward) { ideal_reward } else { proportional_reward }
//     }
// }