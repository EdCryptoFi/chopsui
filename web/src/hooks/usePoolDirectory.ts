import { useSuiClientQuery } from '@mysten/dapp-kit';
import { POOL_DIRECTORY_ID } from '@/lib/constants';

export function usePoolDirectory() {
  const query = useSuiClientQuery(
    'getObject',
    { id: POOL_DIRECTORY_ID, options: { showContent: true } },
    { enabled: !!POOL_DIRECTORY_ID }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields = (query.data?.data?.content as any)?.fields;
  const tokenTypes: string[] = fields?.token_types ?? [];

  return {
    tokenTypes,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
