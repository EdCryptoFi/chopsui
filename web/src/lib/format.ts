/** Convert raw MIST balance to decimal token amount (9 decimals) */
export function mistToToken(mist: bigint, decimals = 9): number {
  const divisor = 10n ** BigInt(decimals);
  const whole = mist / divisor;
  const frac = mist % divisor;
  return Number(whole) + Number(frac) / Number(divisor);
}

/** Format token amount with commas */
export function formatToken(mist: bigint, decimals = 9): string {
  const val = mistToToken(mist, decimals);
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * APY stored in contract as MIN_APY = 1_000_000_000 = 1%.
 * locked_in_apy uses a different formula: divide by 10_000 to get %.
 */
export function formatLockedApy(lockedInApy: bigint): string {
  return (Number(lockedInApy) / 10_000).toFixed(2) + '%';
}

/**
 * Pool maxAPY stored as e.g. 25_000_000_000 = 25%.
 * Divide by SCALING_FACTOR (1e9) to get percentage.
 */
export function formatMaxApy(rawMaxApy: bigint): string {
  return (Number(rawMaxApy) / 1_000_000_000).toFixed(0) + '%';
}

/** Parse user input (decimal string) to MIST bigint */
export function tokenToMist(input: string, decimals = 9): bigint {
  const parsed = parseFloat(input);
  if (isNaN(parsed) || parsed <= 0) return 0n;
  return BigInt(Math.floor(parsed * 10 ** decimals));
}

/** Format large USD values */
export function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}
