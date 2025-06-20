// module chop_locker::chop_locker2 {

//     use sui::vec_map::{Self, VecMap};
//     use sui::math;
//     use sui::clock::{Self, Clock};
//     use sui::balance::{Self, Balance};
//     use sui::sui::SUI;
//     use sui::coin::{Self, Coin};
//     use sui::event;
//     use sui::url::Url;
//     use std::debug;
//     use sui::table::{Self, Table};

//     use sui::transfer;
//     use sui::tx_context::{TxContext, sender};
//     use sui::object::{Self, UID};
//     use std::vector;

//     const VERSION: u64 = 1;
//     const EInsufficientBalance: u64 = 0;
//         const OneCoinNineDecimals: u64 = 1000000000;

//     /* ========== OBJECTS ========== */

//     public struct Treasury<phantom T0> has key {
//         id: UID,
//         rewardsTreasury: Balance<T0>, // Staking rewards held in the treasury
//         stakedCoinsTreasury: Balance<T0>, // Staked Sui coins held in the treasury
//         gameRewardsTreasury: Balance<T0>,
//         version: u64
//     }

//         // Struct to hold staking information
//     public struct StakeObject<phantom T0> has key {
//         id: UID,
//         // owner: address,
//         amount: u64,
//         start_epoch: u64,
//         reward_rate: u64,
//         tokens: Balance<T0>
//     }

//     // Struct to manage staking pool
//     public struct StakingPool<phantom T0> has key {
//         id: UID,
//         total_staked: Balance<T0>, //NOT USED FOR ANYTHING EVER
//         reward_rate: u64, // Rewards per second per token staked
//         last_updated_time: u64,
//         version: u64
//     }

//     public struct FFIO has drop {}

//     public struct ChopLockerCap has key { id: UID }


//     fun init (ctx: &mut TxContext){
//         transfer::transfer(ChopLockerCap {
//             id: object::new(ctx)
//         }, ctx.sender());
//         transfer::transfer(ChopLockerCap {id: object::new(ctx)}, tx_context::sender(ctx));
//         // let half_bil = 500000000*OneCoinNineDecimals;
//         // let staking_rewards_coins = coin::mint<FFIO>(&mut treasury, 8*half_bil, ctx);
//         // let mut treasury_obj = Treasury{
//         //     id: object::new(ctx),
//         //     rewardsTreasury: balance::zero<FFIO>(),
//         //     stakedCoinsTreasury: balance::zero<FFIO>(),
//         //     gameRewardsTreasury: balance::zero<FFIO>(),
//         //     version: VERSION};
//         // let balance1 = coin::into_balance(staking_rewards_coins);
//         // balance::join(&mut treasury_obj.rewardsTreasury, balance1);
//         // transfer::share_object(treasury_obj);
//     }

//     //check versions of shared treasury object
//     fun check_version_Treasury(treasury: &Treasury){
//         assert!(treasury.version == VERSION, 1);
//     }

//     fun check_version_StakingPool(staking_pool: &StakingPool){
//         assert!(staking_pool.version == VERSION, 1);
//     }

//     /* ========== USER FUNCTIONS ========== */

//     public entry fun add_to_existing_locker<T0>(staking_pool: &mut StakingPool<T0>, coin: Coin<T0>, treasury: &mut Treasury<T0>, clock: &Clock, stake_object: StakeObject, ctx: &mut TxContext){
//         check_version_StakingPool(staking_pool);
//         claim_rewards(staking_pool, treasury, &stake_object, clock, ctx);
//         assert!(ctx.sender() != @0xCAFE, 1);
//         let amount = coin::value(&coin) + stake_object.amount;

//         // let balance = coin::into_balance(coin);
//         // balance::join(&mut treasury.stakedCoinsTreasury, balance);
//         let new_stake_object = StakeObject {
//             id: object::new(ctx),
//             // staker,
//             amount: amount,
//             start_epoch: getCurrentEpoch(clock), 
//             reward_rate: staking_pool.reward_rate
//         };
//         let balance = coin::into_balance(coin);
//         balance::join(&mut treasury.stakedCoinsTreasury, balance);
//         transfer::transfer(new_stake_object, ctx.sender());
//         transfer::transfer(stake_object, @0xCAFE);
//     }

//     // Stake function
//     public entry fun new_locker<T0>(staking_pool: &mut StakingPool<T0>, coin: Coin<T0>, treasury: &mut Treasury<T0>, clock: &Clock, ctx: &mut TxContext) {
//         check_version_StakingPool(staking_pool);
//         assert!(ctx.sender() != @0xCAFE, 1);
//         let stake_object = StakeObject {
//             id: object::new(ctx),
//             // staker,
//             amount: coin::value(&coin),
//             start_epoch: getCurrentEpoch(clock), 
//             reward_rate: staking_pool.reward_rate
//         };
//         let balance = coin::into_balance(coin);
//         balance::join(&mut treasury.stakedCoinsTreasury, balance);
//         transfer::transfer(stake_object, ctx.sender());
//     }

//     // Function to unstake
//     public entry fun unlock_locker<T0>(staking_pool: &mut StakingPool<T0>, treasury: &mut Treasury<T0>, stake_object: &mut StakeObject, clock: &Clock, ctx: &mut TxContext) {
//         assert!(ctx.sender() != @0xCAFE, 1);
//         check_version_StakingPool(staking_pool);
//         claim_rewards(staking_pool, treasury, stake_object, clock, ctx);
//         let unstake_coin = coin::take<T0>(&mut treasury.stakedCoinsTreasury, stake_object.amount, ctx);
//         transfer::public_transfer(unstake_coin, sender(ctx));
//         stake_object.amount = 0;
//     }

//     fun getCurrentEpoch(clock: &Clock): u64{
//         (clock::timestamp_ms(clock) / 1000) // Converts to seconds
//     }

//     public(package) fun getStakedAmount(stakedObj: &StakeObject): u64{
//         stakedObj.amount
//     }

//     // Calculate rewards for a stake
//     public fun calculate_rewards<T0>(staking_pool: &StakingPool<T0>, stake_object: &StakeObject, clock: &Clock): u64 {
//         check_version_StakingPool(staking_pool);
//         if (staking_pool.reward_rate >= stake_object.reward_rate) {
//             return staking_pool.reward_rate * (getCurrentEpoch(clock) - stake_object.start_epoch) * (stake_object.amount / OneCoinNineDecimals);
//         }else{
//             return stake_object.reward_rate * (getCurrentEpoch(clock) - stake_object.start_epoch) * (stake_object.amount / OneCoinNineDecimals);
//         };
//         0
//     }

//     // Claim rewards
//     public fun claim_rewards<T0>(staking_pool: &mut StakingPool<T0>, treasury: &mut Treasury<T0>, stake_object: &StakeObject, clock: &Clock, ctx: &mut TxContext) {
//         assert!(ctx.sender() != @0xCAFE, 1);
//         check_version_StakingPool(staking_pool);
//         let reward_amount = calculate_rewards(staking_pool, stake_object, clock);
//         let reward_coin = coin::take<T0>(&mut treasury.rewardsTreasury, reward_amount, ctx);
//         transfer::public_transfer(reward_coin, sender(ctx));
//     }

//     // Claim rewards
//     public fun claim_rewards2<T0>(staking_pool: &mut StakingPool<T0>, treasury: &mut Treasury<T0>, stake_object: StakeObject, clock: &Clock, ctx: &mut TxContext) {
//         assert!(ctx.sender() != @0xCAFE, 1);
//         check_version_StakingPool(staking_pool);
//         let reward_amount = calculate_rewards(staking_pool, &stake_object, clock);
//         let reward_coin = coin::take<T0>(&mut treasury.rewardsTreasury, reward_amount, ctx);
//         transfer::public_transfer(reward_coin, sender(ctx));

//         let new_stake_object = StakeObject {
//             id: object::new(ctx),
//             // staker,
//             amount: stake_object.amount,
//             start_epoch: getCurrentEpoch(clock), 
//             reward_rate: staking_pool.reward_rate
//         };
//         transfer::transfer(new_stake_object, ctx.sender());
//         transfer::transfer(stake_object, @0xCAFE);
//         // stake_object.start_epoch = getCurrentEpoch(clock);
//     }

//     public fun update_reward_rate<T0>(_: &ChopLockerCap, staking_pool: &mut StakingPool<T0>, rate: u64, clock: &Clock) {
//         check_version_StakingPool(staking_pool);
//         staking_pool.reward_rate = rate;
//         staking_pool.last_updated_time = getCurrentEpoch(clock);
//     }

//     public entry fun update_version<T0>(_: &ChopLockerCap, staking_pool: &mut StakingPool<T0>, treasury: &mut Treasury<T0>) {
//         staking_pool.version = VERSION;
//         treasury.version = VERSION;
//     }

//     public(package) fun create_url(url: vector<u8>): Url {
//         let url = sui::url::new_unsafe(std::ascii::string(url));
//         url
//     }
// }
