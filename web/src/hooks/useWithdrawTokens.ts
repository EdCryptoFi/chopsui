import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CHOP_LOCKER_PACKAGE_ID, SUI_CLOCK_OBJECT_ID } from '@/lib/constants';
import { TxStatus } from '@/types';
import { useState } from 'react';

export function useWithdrawTokens() {
  const { mutateAsync, isPending } = useSignAndExecuteTransaction();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [digest, setDigest] = useState<string | null>(null);

  async function withdrawTokens(
    lockObjectId: string,
    poolConfigId: string,
    tokenType: string
  ): Promise<string | undefined> {
    if (!CHOP_LOCKER_PACKAGE_ID) {
      setError('Contract not configured');
      return;
    }

    setStatus('pending');
    setError(null);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${CHOP_LOCKER_PACKAGE_ID}::chop_locker::withdraw_tokens`,
        typeArguments: [tokenType],
        arguments: [
          tx.object(lockObjectId),
          tx.object(poolConfigId),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      const result = await mutateAsync({ transaction: tx });
      setDigest(result.digest);
      setStatus('success');
      return result.digest;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStatus('error');
      return undefined;
    }
  }

  return { withdrawTokens, status, error, digest, isPending };
}
