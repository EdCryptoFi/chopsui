'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const apyTrendData = [
    { day: 'Mon', apy: 15 },
    { day: 'Tue', apy: 16 },
    { day: 'Wed', apy: 14 },
    { day: 'Thu', apy: 18 },
    { day: 'Fri', apy: 17 },
    { day: 'Sat', apy: 19 },
    { day: 'Sun', apy: 18.5 },
  ];

  const lockDistributionData = [
    { range: '1-30d', count: 234 },
    { range: '30-90d', count: 456 },
    { range: '90-180d', count: 321 },
    { range: '180-365d', count: 223 },
  ];

  const activeLocks = [
    { id: 1, token: 'CHOP', amount: 1000, apy: 18.5, earned: 125, daysLeft: 25 },
    { id: 2, token: 'GULO', amount: 500, apy: 16.2, earned: 45, daysLeft: 45 },
    { id: 3, token: 'NEG', amount: 750, apy: 14.8, earned: 60, daysLeft: 90 },
  ];

  const stats = [
    { label: 'Total Staked', value: '$2,250', icon: '💰' },
    { label: 'Active Locks', value: '3', icon: '🔒' },
    { label: 'Avg APY', value: '16.5%', icon: '📈' },
    { label: 'Total Rewards', value: '$230.50', icon: '🎁' },
  ];

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
            {/* APY Trend */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-primary border-2 border-[#FF006E]/20"
            >
              <h2 className="text-xl font-bold text-[#FF006E] mb-6 uppercase">APY Trend (7 Days)</h2>
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

            {/* Lock Distribution */}
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
                  <YAxis stroke="#999" />
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#FF006E]/20">
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Token</th>
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Amount</th>
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">APY</th>
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Earned</th>
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Days Left</th>
                    <th className="text-right px-6 py-4 font-bold uppercase text-[#FF006E]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLocks.map((lock) => (
                    <tr key={lock.id} className="border-b border-[#FF006E]/10 hover:bg-[#1a1f3a]/50 transition">
                      <td className="px-6 py-4 font-bold text-white">{lock.token}</td>
                      <td className="px-6 py-4 text-gray-300">{lock.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-[#00D9FF] font-bold">{lock.apy}%</td>
                      <td className="px-6 py-4 text-[#FF006E] font-bold">${lock.earned.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-300">{lock.daysLeft}</td>
                      <td className="px-6 py-4 text-right">
                        {lock.daysLeft === 0 ? (
                          <button className="btn-primary text-sm py-2 px-4">Withdraw</button>
                        ) : (
                          <span className="text-gray-400 text-sm">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
