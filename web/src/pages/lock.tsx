'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useChopBalance } from '@/hooks/useChopBalance';
import { usePoolConfig } from '@/hooks/usePoolConfig';
import { useLockTokens } from '@/hooks/useLockTokens';
import { CHOP_POOL_CONFIG_ID } from '@/lib/constants';
import { formatToken } from '@/lib/format';

const MIN_APY = 10;
const MAX_APY = 25;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

function calculateAPY(days: number, maxApy = MAX_APY): number {
  if (days < MIN_DAYS || days > MAX_DAYS) return MIN_APY;
  return MIN_APY + ((maxApy - MIN_APY) * (days - 1)) / (MAX_DAYS - 1);
}

export default function LockPage() {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(30);

  const account = useCurrentAccount();
  const { rawBalance, balance, refetch: refetchBalance } = useChopBalance();
  const { poolConfig } = usePoolConfig(CHOP_POOL_CONFIG_ID);
  const { lockTokens, status, error, digest } = useLockTokens();

  const poolMaxApy = poolConfig
    ? Number(poolConfig.maxApy) / 1_000_000_000
    : MAX_APY;

  const apy = calculateAPY(duration, poolMaxApy);
  const estimatedReward = amount ? (parseFloat(amount) * apy) / 100 : 0;

  const isLoading = status === 'pending';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  async function handleLock() {
    if (!account?.address) return;
    await lockTokens(account.address, { amountInput: amount, days: duration });
    if (status === 'success') {
      setAmount('');
      refetchBalance();
    }
  }

  function handleMax() {
    if (rawBalance > 0n) {
      setAmount(formatToken(rawBalance).replace(/[KM,]/g, ''));
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0a0e27]/80 backdrop-blur-md z-50 border-b border-[#FF006E]/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#FF006E]">
            CHOPSUI
          </Link>
          <div className="hidden md:flex gap-8">
            <Link href="/" className="text-white hover:text-[#FF006E] transition uppercase text-sm font-bold">
              HOME
            </Link>
            <Link href="/swap" className="text-white hover:text-[#FF006E] transition uppercase text-sm font-bold">
              SWAP
            </Link>
            <Link href="/lock" className="text-[#FF006E] transition uppercase text-sm font-bold border-b-2 border-[#FF006E]">
              LOCK
            </Link>
            <Link href="/dashboard" className="text-white hover:text-[#FF006E] transition uppercase text-sm font-bold">
              DASHBOARD
            </Link>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-title mb-4 text-center"
          >
            Lock Tokens
          </motion.h1>
          <p className="section-subtitle text-center mb-12">
            Lock your CHOP tokens and earn dynamic APY rewards
          </p>

          {!account && (
            <div className="text-center mb-8 p-6 border border-[#FF006E]/30 rounded-lg bg-[#FF006E]/5">
              <p className="text-gray-300 mb-4">Connect your wallet to lock tokens</p>
              <ConnectButton />
            </div>
          )}

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-primary border-2 border-[#FF006E] mb-8"
          >
            {/* Amount Input */}
            <div className="mb-8">
              <label className="block text-[#FF006E] font-bold uppercase text-sm mb-3">
                Amount to Lock
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-field text-2xl"
                disabled={isLoading}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-400 text-sm">
                  Balance:{' '}
                  <span className="text-white font-bold">
                    {account ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} CHOP` : '—'}
                  </span>
                </p>
                {account && rawBalance > 0n && (
                  <button
                    onClick={handleMax}
                    className="text-[#FF006E] text-sm font-bold hover:underline"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mb-8">
              <div className="flex justify-between mb-3">
                <label className="block text-[#FF006E] font-bold uppercase text-sm">
                  Lock Duration
                </label>
                <span className="text-[#FF006E] font-bold text-lg">{duration} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="365"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-3 bg-[#0a0e27] rounded-lg appearance-none cursor-pointer accent-[#FF006E]"
                disabled={isLoading}
              />
              <div className="flex justify-between text-gray-400 text-xs mt-2">
                <span>1 Day</span>
                <span>365 Days</span>
              </div>
            </div>

            {/* APY Display */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#0a0e27] border border-[#FF006E]/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm uppercase font-bold">APY Rate</p>
                <p className="text-3xl font-bold text-[#FF006E] mt-2">{apy.toFixed(2)}%</p>
              </div>
              <div className="bg-[#0a0e27] border border-[#FF006E]/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm uppercase font-bold">Est. Rewards</p>
                <p className="text-3xl font-bold text-[#00D9FF] mt-2">
                  {estimatedReward.toLocaleString(undefined, { maximumFractionDigits: 2 })} CHOP
                </p>
              </div>
            </div>

            {/* Status messages */}
            {isSuccess && digest && (
              <div className="mb-4 p-4 bg-green-900/30 border border-green-500 rounded-lg">
                <p className="text-green-400 font-bold">Tokens locked successfully!</p>
                <p className="text-gray-400 text-sm mt-1 break-all">Tx: {digest}</p>
              </div>
            )}
            {isError && error && (
              <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
                <p className="text-red-400 font-bold">Error: {error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleLock}
                disabled={!account || isLoading || !amount}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Locking...' : 'Approve & Lock'}
              </button>
              <button
                onClick={handleMax}
                disabled={!account || rawBalance === 0n}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Max Amount
              </button>
            </div>
          </motion.div>

          {/* Risk Warning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#FF006E]/10 border border-[#FF006E] rounded-lg p-6 mb-8"
          >
            <h3 className="text-[#FF006E] font-bold uppercase mb-3">⚠️ Important Notice</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Tokens will be locked for the specified duration</li>
              <li>• Early withdrawal is not possible</li>
              <li>• APY is dynamic and based on lock duration and pool depletion</li>
              <li>• Rewards are automatically calculated at unlock time</li>
            </ul>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold uppercase mb-6 text-[#FF006E]">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'How is APY calculated?',
                  a: 'APY ranges from 10% to 25% based on lock duration. Longer locks earn higher APY.',
                },
                {
                  q: 'When do I get my rewards?',
                  a: 'Rewards are automatically added to your account when the lock period ends.',
                },
                {
                  q: 'Can I withdraw early?',
                  a: 'No, early withdrawal is not permitted. Your tokens remain locked for the full duration.',
                },
                {
                  q: 'What happens if the pool runs out of rewards?',
                  a: 'APY is scaled based on pool depletion. You will still receive proportional rewards.',
                },
              ].map((item, idx) => (
                <div key={idx} className="card-secondary">
                  <h3 className="text-[#FF006E] font-bold mb-2">{item.q}</h3>
                  <p className="text-gray-300">{item.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
