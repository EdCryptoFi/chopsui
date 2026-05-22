'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';
import { usePoolDirectory } from '@/hooks/usePoolDirectory';
import { usePoolConfig } from '@/hooks/usePoolConfig';
import { CHOP_POOL_CONFIG_ID } from '@/lib/constants';
import { formatToken, formatMaxApy } from '@/lib/format';
import { PoolConfig } from '@/types';

const TOKEN_EMOJI: Record<string, string> = {
  CHOP_TOKEN: '🌶️',
  CHOP: '🌶️',
  GULO: '🐺',
  NEG: '⚫',
  TKI: '🎋',
  FFIO: '🦅',
  SUIP: '🌊',
  AXOL: '🦎',
  SUPERFRA: '🍓',
};

function tokenSymbol(tokenType: string): string {
  return tokenType.split('::').pop() ?? tokenType;
}

function tokenEmoji(tokenType: string): string {
  const sym = tokenSymbol(tokenType);
  return TOKEN_EMOJI[sym] ?? '🪙';
}

// Single pool row — fetches its own PoolConfig
function PoolRow({
  tokenType,
  poolConfigId,
  isSelected,
  onSelect,
}: {
  tokenType: string;
  poolConfigId: string;
  isSelected: boolean;
  onSelect: (config: PoolConfig) => void;
}) {
  const { poolConfig, isLoading } = usePoolConfig(poolConfigId);
  const sym = tokenSymbol(tokenType);

  if (isLoading || !poolConfig) {
    return (
      <tr className="border-b border-[#FF006E]/10 animate-pulse">
        <td className="px-6 py-4 text-gray-600">...</td>
        <td className="px-6 py-4 text-gray-600">loading</td>
        <td className="px-6 py-4 text-gray-600">—</td>
        <td className="px-6 py-4 text-gray-600">—</td>
        <td className="px-6 py-4" />
      </tr>
    );
  }

  return (
    <tr className={`border-b border-[#FF006E]/10 transition ${isSelected ? 'bg-[#1a1f3a]/70' : 'hover:bg-[#1a1f3a]/50'}`}>
      <td className="px-6 py-4 flex items-center gap-3">
        <span className="text-3xl">{tokenEmoji(tokenType)}</span>
        <span className="font-bold text-white">{sym}</span>
      </td>
      <td className="px-6 py-4 text-gray-300">{formatToken(poolConfig.totalStaked)} {sym}</td>
      <td className="px-6 py-4 text-gray-300">—</td>
      <td className="px-6 py-4 text-[#00D9FF] font-bold">{formatMaxApy(poolConfig.maxApy)}</td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onSelect(poolConfig)}
          className={`text-sm py-2 px-4 ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </td>
    </tr>
  );
}

// Fallback hardcoded tokens when PoolDirectory is not configured
const FALLBACK_TOKENS = [
  { symbol: 'CHOP', logo: '🌶️', tvl: '—', maxAPY: '25%' },
  { symbol: 'GULO', logo: '🐺', tvl: '—', maxAPY: '22%' },
  { symbol: 'NEG', logo: '⚫', tvl: '—', maxAPY: '20%' },
  { symbol: 'TKI', logo: '🎋', tvl: '—', maxAPY: '18%' },
];

export default function SwapPage() {
  const router = useRouter();
  const [selectedConfig, setSelectedConfig] = useState<PoolConfig | null>(null);
  const { tokenTypes, isLoading: dirLoading } = usePoolDirectory();

  // If PoolDirectory has one entry, map it to CHOP_POOL_CONFIG_ID
  // For multi-pool support, PoolDirectory would need to store poolConfig addresses too.
  // For now, the single known pool maps to CHOP_POOL_CONFIG_ID.
  const poolMappings: { tokenType: string; poolConfigId: string }[] = tokenTypes.length
    ? tokenTypes.map((t) => ({ tokenType: t, poolConfigId: CHOP_POOL_CONFIG_ID }))
    : [];

  const hasRealData = !dirLoading && poolMappings.length > 0;

  function handleLockThis() {
    if (selectedConfig) {
      const tokenType = encodeURIComponent(selectedConfig.tokenType);
      router.push(`/lock?token=${tokenType}&pool=${selectedConfig.objectId}`);
    } else {
      router.push('/lock');
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

          {/* Tokens Table — real data when PoolDirectory is configured */}
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
                  {hasRealData
                    ? poolMappings.map(({ tokenType, poolConfigId }) => (
                        <PoolRow
                          key={tokenType}
                          tokenType={tokenType}
                          poolConfigId={poolConfigId}
                          isSelected={selectedConfig?.tokenType === tokenType}
                          onSelect={setSelectedConfig}
                        />
                      ))
                    : FALLBACK_TOKENS.map((token, idx) => (
                        <tr key={idx} className="border-b border-[#FF006E]/10 hover:bg-[#1a1f3a]/50 transition">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <span className="text-3xl">{token.logo}</span>
                            <span className="font-bold text-white">{token.symbol}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm italic">{token.tvl}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm italic">—</td>
                          <td className="px-6 py-4 text-[#00D9FF] font-bold">{token.maxAPY}</td>
                          <td className="px-6 py-4 text-right">
                            <Link href="/lock" className="btn-primary text-sm py-2 px-4 inline-block">
                              Select
                            </Link>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Selected Token Details */}
          {selectedConfig && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-primary border-2 border-[#00D9FF]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-[#FF006E] uppercase">
                    {tokenSymbol(selectedConfig.tokenType)}
                  </h2>
                  <p className="text-gray-400">Pool Details</p>
                </div>
                <button onClick={() => setSelectedConfig(null)} className="text-2xl text-gray-400 hover:text-[#FF006E]">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Staked', value: formatToken(selectedConfig.totalStaked) + ' ' + tokenSymbol(selectedConfig.tokenType) },
                  { label: 'Reward Pool', value: formatToken(selectedConfig.rewardBalance) + ' tokens' },
                  { label: 'Active Locks', value: String(selectedConfig.activeLockers) },
                  { label: 'Max APY', value: formatMaxApy(selectedConfig.maxApy) },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#0a0e27] border border-[#FF006E]/20 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase font-bold">{item.label}</p>
                    <p className="text-xl font-bold text-[#FF006E] mt-2">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={handleLockThis} className="btn-primary flex-1">
                  Lock This Token
                </button>
                <button className="btn-secondary flex-1">View Chart</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
