'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';

export default function SwapPage() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const tokens = [
    { symbol: 'CHOP', logo: '🌶️', tvl: '$2.4M', price: '$0.45', maxAPY: '25%' },
    { symbol: 'GULO', logo: '🐺', tvl: '$1.8M', price: '$0.32', maxAPY: '22%' },
    { symbol: 'NEG', logo: '⚫', tvl: '$1.2M', price: '$0.28', maxAPY: '20%' },
    { symbol: 'TKI', logo: '🎋', tvl: '$950K', price: '$0.15', maxAPY: '18%' },
    { symbol: 'FFIO', logo: '🦅', tvl: '$650K', price: '$0.08', maxAPY: '16%' },
    { symbol: 'SUIP', logo: '🌊', tvl: '$480K', price: '$0.12', maxAPY: '15%' },
    { symbol: 'AXOL', logo: '🦎', tvl: '$320K', price: '$0.05', maxAPY: '14%' },
    { symbol: 'SUPERFRA', logo: '🍓', tvl: '$180K', price: '$0.02', maxAPY: '12%' },
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
            <Link href="/swap" className="text-[#FF006E] transition uppercase text-sm font-bold border-b-2 border-[#FF006E]">
              SWAP
            </Link>
            <Link href="/lock" className="text-white hover:text-[#FF006E] transition uppercase text-sm font-bold">
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
        <div className="max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-title mb-4 text-center"
          >
            Select Token
          </motion.h1>
          <p className="section-subtitle text-center mb-12">
            Browse available tokens and manage your positions
          </p>

          {/* Tokens Table */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-primary border-2 border-[#FF006E] overflow-hidden mb-8"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#FF006E]/20">
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Token</th>
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">TVL</th>
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Price</th>
                    <th className="text-left px-6 py-4 font-bold uppercase text-[#FF006E]">Max APY</th>
                    <th className="text-right px-6 py-4 font-bold uppercase text-[#FF006E]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#FF006E]/10 hover:bg-[#1a1f3a]/50 transition"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="text-3xl">{token.logo}</span>
                        <span className="font-bold text-white">{token.symbol}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{token.tvl}</td>
                      <td className="px-6 py-4 text-gray-300">{token.price}</td>
                      <td className="px-6 py-4 text-[#00D9FF] font-bold">{token.maxAPY}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedToken(token.symbol)}
                          className="btn-primary text-sm py-2 px-4"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Selected Token Details */}
          {selectedToken && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-primary border-2 border-[#00D9FF]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-[#FF006E] uppercase">{selectedToken}</h2>
                  <p className="text-gray-400">Token Details</p>
                </div>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="text-2xl text-gray-400 hover:text-[#FF006E]"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Current Price', value: '$0.45' },
                  { label: 'Market Cap', value: '$450M' },
                  { label: 'Volume (24h)', value: '$12.5M' },
                  { label: 'Holders', value: '45,230' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#0a0e27] border border-[#FF006E]/20 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase font-bold">{item.label}</p>
                    <p className="text-xl font-bold text-[#FF006E] mt-2">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button className="btn-primary flex-1">Lock This Token</button>
                <button className="btn-secondary flex-1">View Chart</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
