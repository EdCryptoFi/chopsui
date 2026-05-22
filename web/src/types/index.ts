export interface LockPosition {
  objectId: string;
  stakedAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  lockedInApy: bigint;
  tokenType: string;
  rewardsLocked: bigint;
  poolConfig: string;
}

export interface PoolConfig {
  objectId: string;
  totalStaked: bigint;
  totalRewardsAddedByAdmin: bigint;
  rewardBalance: bigint;
  tokenType: string;
  activeLockers: bigint;
  totalWeightedStake: bigint;
  maxApy: bigint;
}

export interface PoolSummary {
  tokenType: string;
  symbol: string;
  poolConfigId: string;
  totalStaked: bigint;
  rewardBalance: bigint;
  maxApy: bigint;
  activeLockers: bigint;
}

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';
