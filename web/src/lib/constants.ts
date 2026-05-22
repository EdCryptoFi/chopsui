export const CHOP_LOCKER_PACKAGE_ID =
  process.env.NEXT_PUBLIC_CHOP_LOCKER_PACKAGE_ID ?? '';

export const CHOP_TOKEN_PACKAGE_ID =
  process.env.NEXT_PUBLIC_CHOP_TOKEN_PACKAGE_ID ?? '';

export const POOL_DIRECTORY_ID =
  process.env.NEXT_PUBLIC_POOL_DIRECTORY_ID ?? '';

export const CHOP_POOL_CONFIG_ID =
  process.env.NEXT_PUBLIC_CHOP_POOL_CONFIG_ID ?? '';

// Sui system clock — fixed address on all networks
export const SUI_CLOCK_OBJECT_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000006';

export const CHOP_COIN_TYPE = CHOP_TOKEN_PACKAGE_ID
  ? `${CHOP_TOKEN_PACKAGE_ID}::chop_token::CHOP_TOKEN`
  : '';

export const LOCK_STRUCT_TYPE = CHOP_LOCKER_PACKAGE_ID
  ? `${CHOP_LOCKER_PACKAGE_ID}::chop_locker::Lock`
  : '';

export const POOL_DIRECTORY_STRUCT_TYPE = CHOP_LOCKER_PACKAGE_ID
  ? `${CHOP_LOCKER_PACKAGE_ID}::chop_locker::PoolDirectory`
  : '';

export const POOL_CONFIG_STRUCT_TYPE = CHOP_LOCKER_PACKAGE_ID
  ? `${CHOP_LOCKER_PACKAGE_ID}::chop_locker::PoolConfig`
  : '';

// Contract scaling factor (1e9) used for APY values
export const SCALING_FACTOR = 1_000_000_000n;

// Token decimals for CHOP
export const CHOP_DECIMALS = 9;
export const CHOP_MIST = 10n ** 9n;
