import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import {
  CHOP_LOCKER_PACKAGE_ID,
  CHOP_POOL_CONFIG_ID,
  CHOP_COIN_TYPE,
  SUI_CLOCK_OBJECT_ID,
} from '@/lib/constants';
import { daysToMs } from '@/lib/time';
import { tokenToMist } from '@/lib/format';
import { TxStatus } from '@/types';
import { useState } from 'react';

interface LockParams {
  amountInput: string;
  days: number;
  poolConfigId?: string;
  tokenType?: string;
  coinType?: string;
}

export function useLockTokens() {
  const client = useSuiClient();
  const { mutateAsync, isPending } = useSignAndExecuteTransaction();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [digest, setDigest] = useState<string | null>(null);

  async function lockTokens(
    ownerAddress: string,
    { amountInput, days, poolConfigId, tokenType, coinType }: LockParams
  ): Promise<string | undefined> {
    const configId = poolConfigId ?? CHOP_POOL_CONFIG_ID;
    const coinTy = coinType ?? CHOP_COIN_TYPE;
    const tokenTy = tokenType ?? coinTy;

    if (!configId || !coinTy) {
      setError('Contract not configured — fill in .env.local IDs');
      return;
    }

    const amountMist = tokenToMist(amountInput);
    if (amountMist === 0n) {
      setError('Enter a valid amount');
      return;
    }

    setStatus('pending');
    setError(null);

    try {
      const coins = await client.getCoins({ owner: ownerAddress, coinType: coinTy });
      if (!coins.data.length) throw new Error('No tokens found in wallet');

      const tx = new Transaction();

      // Merge all coin objects into the first one if needed
      if (coins.data.length > 1) {
        tx.mergeCoins(
          tx.object(coins.data[0].coinObjectId),
          coins.data.slice(1).map((c) => tx.object(c.coinObjectId))
        );
      }

      const [splitCoin] = tx.splitCoins(tx.object(coins.data[0].coinObjectId), [
        tx.pure.u64(amountMist),
      ]);

      const msLocked = daysToMs(days);

      tx.moveCall({
        target: `${CHOP_LOCKER_PACKAGE_ID}::chop_locker::lock_tokens`,
        typeArguments: [coinTy],
        arguments: [
          tx.object(configId),
          splitCoin,
          tx.object(SUI_CLOCK_OBJECT_ID),
          tx.pure.u64(msLocked),
          tx.pure.string(tokenTy),
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

  return { lockTokens, status, error, digest, isPending };
}
