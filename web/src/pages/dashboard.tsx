'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUserLocks } from '@/hooks/useUserLocks';
import { usePoolConfig } from '@/hooks/usePoolConfig';
import { useWithdrawTokens } from '@/hooks/useWithdrawTokens';
import { formatToken, formatLockedApy } from '@/lib/format';
import { daysLeft, isUnlocked, formatDate } from '@/lib/time';
import { LockPosition } from '@/types';

function LockRow({ lock, onWithdraw }: { lock: LockPosition; onWithdraw: (lock: LockPosition) => void }) {
  const { poolConfig } = usePoolConfig(lock.poolConfig);
  const unlocked = isUnlocked(lock.endTime);
  const days = daysLeft(lock.endTime);

  const symbol = poolConfig?.tokenType
    ? poolConfig.tokenType.split('::').pop() ?? lock.tokenType
    : lock.tokenType.split('::').pop() ?? '—';

  return (
    <tr className="border-b border-[#FF006E]/10 hover:bg-[#1a1f3a]/50 transition">
      <td className="px-6 py-4 font-bold text-white">{symbol}</td>
      <td className="px-6 py-4 text-gray-300">{formatToken(lock.stakedAmount)}</td>
      <td className="px-6 py-4 text-[#00D9FF] font-bold">{formatLockedApy(lock.lockedInApy)}</td>
      <td className="px-6 py-4 text-[#FF006E] font-bold">{formatToken(lock.rewardsLocked)}</td>
      <td className="px-6 py-4 text-gray-300">
        {unlocked ? (
          <span className="text-green-400 font-bold">Ready</span>
        ) : (
          `${days}d (until ${formatDate(lock.endTime)})`
        )}
      </td>
      <td className="px-6 py-4 text-right">
        {unlocked ? (
          <button onClick={() => onWithdraw(lock)} className="btn-primary text-sm py-2 px-4">
            Withdraw
          </button>
        ) : (
          <span className="text-gray-400 text-sm">Locked</span>
        )}
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const account = useCurrentAccount();
  const { locks, isLoading, refetch } = useUserLocks();
  const { withdrawTokens, status: withdrawStatus, error: withdrawError } = useWithdrawTokens();

  const totalStaked = locks.reduce((sum, l) => sum + l.stakedAmount, 0n);
  const totalRewards = locks.reduce((sum, l) => sum + l.rewardsLocked, 0n);
  const avgApy =
    locks.length > 0
      ? locks.reduce((sum, l) => sum + Number(l.lockedInApy) / 10_000, 0) / locks.length
      : 0;

  const stats = [
    { label: 'Total Staked', value: account ? formatToken(totalStaked) + ' CHOP' : '—', icon: '💰' },
    { label: 'Active Locks', value: account ? String(locks.length) : '—', icon: '🔒' },
    { label: 'Avg APY', value: account ? avgApy.toFixed(1) + '%' : '—', icon: '📈' },
    { label: 'Total Rewards', value: account ? formatToken(totalRewards) + ' CHOP' : '—', icon: '🎁' },
  ];

  // Build lock distribution data from real locks
  const lockDistributionData = [
    { range: '1-30d', count: 0 },
    { range: '30-90d', count: 0 },
    { range: '90-180d', count: 0 },
    { range: '180-365d', count: 0 },
  ];
  locks.forEach((l) => {
    const totalDays = daysLeft(l.endTime) + Math.ceil(Number(l.endTime - l.startTime) / 86_400_000);
    if (totalDays <= 30) lockDistributionData[0].count++;
    else if (totalDays <= 90) lockDistributionData[1].count++;
    else if (totalDays <= 180) lockDistributionData[2].count++;
    else lockDistributionData[3].count++;
  });

  // APY trend: plot each lock's APY as a data point
  const apyTrendData = locks.length
    ? locks.map((l, i) => ({
        day: `Lock ${i + 1}`,
        apy: Number(l.lockedInApy) / 10_000,
      }))
    : [
        { day: 'Mon', apy: 15 },
        { day: 'Tue', apy: 16 },
        { day: 'Wed', apy: 14 },
        { day: 'Thu', apy: 18 },
        { day: 'Fri', apy: 17 },
        { day: 'Sat', apy: 19 },
        { day: 'Sun', apy: 18.5 },
      ];

  async function handleWithdraw(lock: LockPosition) {
    await withdrawTokens(lock.objectId, lock.poolConfig, lock.tokenType);
    if (withdrawStatus === 'success') refetch();
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
            <Link href="/lock" className="text-white hover:text-[#FF006E] transition uppercase text-sm font-bold">
              LOCK
            </Link>
            <Link href="/dashboard" className="text-[#FF006E] transition uppercase text-sm font-bold border-b-2 border-[#FF006E]">
              DASHBOARD
            </Link>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-title mb-4 text-center"
          >
            Portfolio Dashboard
          </motion.h1>
          <p className="section-subtitle text-center mb-12">
            Manage your locks and track your earnings
          </p>

          {!account && (
            <div className="text-center mb-12 p-8 border border-[#FF006E]/30 rounded-lg bg-[#FF006E]/5">
              <p className="text-gray-300 mb-4">Connect your wallet to view your portfolio</p>
              <ConnectButton />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="stat-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 uppercase text-xs font-bold">{stat.label}</p>
                    <p className="text-3xl font-bold text-[#FF006E] mt-2">{stat.value}</p>
                  </div>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-primary border-2 border-[#FF006E]/20"
            >
              <h2 className="text-xl font-bold text-[#FF006E] mb-6 uppercase">
                {locks.length ? 'Lock APY Breakdown' : 'APY Trend (7 Days)'}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={apyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FF006E20" />
                  <XAxis dataKey="day" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #FF006E' }}
                    labelStyle={{ color: '#FF006E' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="apy"
                    stroke="#FF006E"
                    strokeWidth={3}
                    dot={{ fill: '#FF006E', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="card-primary border-2 border-[#FF006E]/20"
            >
              <h2 className="text-xl font-bold text-[#FF006E] mb-6 uppercase">Lock Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lockDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FF006E20" />
                  <XAxis dataKey="range" stroke="#999" />
                  <YAxis stroke="#999" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #FF006E' }}
                    labelStyle={{ color: '#FF006E' }}
                  />
                  <Bar dataKey="count" fill="#FF006E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Active Locks Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-primary border-2 border-[#FF006E]"
          >
            <h2 className="text-2xl font-bold text-[#FF006E] mb-6 uppercase">Active Locks</h2>

            {withdrawError && (
              <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
                <p className="text-red-400">Error: {withdrawError}</p>
              </div>
            )}

            {isLoading && (
              <p className="text-gray-400 text-center py-8">Loading your locks...</p>
            )}

            {!isLoading && account && locks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No active locks found</p>
                <Link href="/lock" className="btn-primary inline-block">Lock Tokens</Link>
              </div>
            )}

            {!isLoading && locks.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#FF006E]/20">
                      <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Token</th>
                      <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Amount</th>
                      <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">APY</th>
                      <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Rewards</th>
                      <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Status</th>
                      <th className="text-right px-6 py-4 font-bold uppercase text-[#FF006E]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locks.map((lock) => (
                      <LockRow key={lock.objectId} lock={lock} onWithdraw={handleWithdraw} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
