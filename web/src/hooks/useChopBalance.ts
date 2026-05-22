import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { CHOP_COIN_TYPE } from '@/lib/constants';
import { mistToToken } from '@/lib/format';

export function useChopBalance() {
  const account = useCurrentAccount();

  const query = useSuiClientQuery(
    'getBalance',
    { owner: account?.address ?? '', coinType: CHOP_COIN_TYPE },
    { enabled: !!account?.address && !!CHOP_COIN_TYPE }
  );

  const rawBalance = BigInt(query.data?.totalBalance ?? '0');

  return {
    rawBalance,
    balance: mistToToken(rawBalance),
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
