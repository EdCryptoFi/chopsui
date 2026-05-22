'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';
import { motion } from 'framer-motion';
import { usePoolConfig } from '@/hooks/usePoolConfig';
import { CHOP_POOL_CONFIG_ID } from '@/lib/constants';
import { formatToken, formatMaxApy } from '@/lib/format';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { poolConfig } = usePoolConfig(CHOP_POOL_CONFIG_ID);

  const stats = [
    {
      label: 'Total Staked',
      value: poolConfig ? formatToken(poolConfig.totalStaked) + ' CHOP' : '—',
    },
    {
      label: 'Active Locks',
      value: poolConfig ? String(poolConfig.activeLockers) : '—',
    },
    {
      label: 'Max APY',
      value: poolConfig ? formatMaxApy(poolConfig.maxApy) : '—',
    },
    {
      label: 'Reward Pool',
      value: poolConfig ? formatToken(poolConfig.rewardBalance) + ' CHOP' : '—',
    },
  ];

  const features = [
    {
      title: 'Fluid APY',
      description: 'Dynamic rewards based on lock duration (10-25%)',
      icon: '📈',
    },
    {
      title: 'DEX Integration',
      description: 'Swap rewards via 7k protocol',
      icon: '🔄',
    },
    {
      title: 'Liquidity Positions',
      description: 'Auto-reinvest via Bolt LPs',
      icon: '💧',
    },
    {
      title: 'Custom Baskets',
      description: 'Create token baskets with rebalancing',
      icon: '🧺',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0a0e27]/80 backdrop-blur-md z-50 border-b border-[#FF006E]/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-[#FF006E]">CHOPSUI</div>
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
            <Link href="/dashboard" className="text-white hover:text-[#FF006E] transition uppercase text-sm font-bold">
              DASHBOARD
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-[#FF006E] text-2xl"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-7xl font-black uppercase tracking-wider mb-6 text-white">
              WELCOME TO <span className="text-[#FF006E]">CHOPSUI</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              The most powerful token locking and staking protocol on Sui blockchain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/lock" className="btn-primary">
                Start Locking
              </Link>
              <Link href="/swap" className="btn-secondary">
                Explore Tokens
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a]">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center mb-12">Protocol Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="stat-card text-center"
              >
                <p className="text-gray-400 uppercase text-sm font-bold">{stat.label}</p>
                <p className="text-3xl font-bold text-[#FF006E] mt-2">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center mb-16">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="card-primary text-center hover:border-[#FF006E] transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-[#FF006E] mb-3 uppercase">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-[#FF006E]/10 to-[#00D9FF]/10 border-y border-[#FF006E]/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 uppercase">Ready to Maximize Your Rewards?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Lock your tokens now and earn dynamic APY based on your lock duration
          </p>
          <Link href="/lock" className="btn-primary inline-block">
            Start Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] border-t border-[#FF006E]/20 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-[#FF006E] font-bold uppercase mb-4">ChopSui</h3>
              <p className="text-gray-400">The premier token locking protocol on Sui</p>
            </div>
            <div>
              <h3 className="text-[#FF006E] font-bold uppercase mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-[#FF006E]">Home</Link></li>
                <li><Link href="/lock" className="hover:text-[#FF006E]">Lock Tokens</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#FF006E]">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#FF006E] font-bold uppercase mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#FF006E]">Twitter</a></li>
                <li><a href="#" className="hover:text-[#FF006E]">Discord</a></li>
                <li><a href="#" className="hover:text-[#FF006E]">Docs</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#FF006E]/20 pt-8 text-center text-gray-400">
            <p>&copy; 2026 ChopSui Protocol. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
