import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { LOCK_STRUCT_TYPE } from '@/lib/constants';
import { LockPosition } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLock(obj: any): LockPosition | null {
  const fields = obj?.data?.content?.fields;
  const objectId = obj?.data?.objectId;
  if (!fields || !objectId) return null;

  return {
    objectId,
    stakedAmount: BigInt(fields.staked?.fields?.value ?? fields.staked ?? '0'),
    startTime: BigInt(fields.start_time ?? '0'),
    endTime: BigInt(fields.end_time ?? '0'),
    lockedInApy: BigInt(fields.locked_in_apy ?? '0'),
    tokenType: fields.token_type ?? '',
    rewardsLocked: BigInt(
      fields.rewards_locked?.fields?.value ?? fields.rewards_locked ?? '0'
    ),
    poolConfig: fields.pool_config ?? '',
  };
}

export function useUserLocks() {
  const account = useCurrentAccount();

  const query = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address ?? '',
      filter: { StructType: LOCK_STRUCT_TYPE },
      options: { showContent: true, showType: true },
    },
    { enabled: !!account?.address && !!LOCK_STRUCT_TYPE }
  );

  const locks: LockPosition[] = (query.data?.data ?? [])
    .map(parseLock)
    .filter((l): l is LockPosition => l !== null);

  return {
    locks,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
