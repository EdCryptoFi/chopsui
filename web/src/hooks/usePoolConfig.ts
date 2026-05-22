import { useSuiClientQuery } from '@mysten/dapp-kit';
import { PoolConfig } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePoolConfig(data: any): PoolConfig | null {
  const fields = data?.data?.content?.fields;
  if (!fields) return null;
  return {
    objectId: data.data.objectId,
    totalStaked: BigInt(fields.total_staked ?? '0'),
    totalRewardsAddedByAdmin: BigInt(fields.total_rewards_added_by_admin ?? '0'),
    rewardBalance: BigInt(fields.reward_balance?.fields?.value ?? fields.reward_balance ?? '0'),
    tokenType: fields.token_type ?? '',
    activeLockers: BigInt(fields.active_lockers ?? '0'),
    totalWeightedStake: BigInt(fields.total_weighted_stake ?? '0'),
    maxApy: BigInt(fields.maxAPY ?? '0'),
  };
}

export function usePoolConfig(poolConfigId: string) {
  const query = useSuiClientQuery(
    'getObject',
    { id: poolConfigId, options: { showContent: true } },
    { enabled: !!poolConfigId }
  );

  return {
    poolConfig: query.data ? parsePoolConfig(query.data) : null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
