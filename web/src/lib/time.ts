export const MS_PER_DAY = 86_400_000n;

/** Convert days to milliseconds */
export function daysToMs(days: number): bigint {
  return BigInt(days) * MS_PER_DAY;
}

/** Convert milliseconds to days (rounded down) */
export function msToDays(ms: bigint): number {
  return Number(ms / MS_PER_DAY);
}

/** Days remaining until end_time (clamped to 0) */
export function daysLeft(endTimeMs: bigint): number {
  const now = BigInt(Date.now());
  if (endTimeMs <= now) return 0;
  return msToDays(endTimeMs - now);
}

/** Whether the lock period has ended */
export function isUnlocked(endTimeMs: bigint): boolean {
  return BigInt(Date.now()) >= endTimeMs;
}

/** Format a ms timestamp as a readable date */
export function formatDate(ms: bigint): string {
  return new Date(Number(ms)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
