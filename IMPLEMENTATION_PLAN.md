# ChopSui — Implementation Plan

## Repository
**Source**: https://github.com/sgrutman978/chop_sui
**Local**: `/Users/fabioalves/Desktop/VibeCode/ChopSui`

---

## Phase 1: Contract Foundation ✅ (Complete)

| Task | Status |
|------|--------|
| Clean up `chop_locker.move` — remove dead code, fix `sqrt()`, fix zero-balance edge case | ✅ |
| Implement `chop_token` module (was empty stub) | ✅ |
| Get both packages compiling against Sui testnet | ✅ |
| Remove dead files (`chop_locker2.move`, `tmp.move`) | ✅ |
| Fix `.gitignore` | ✅ |

### Phase 1 Artifacts
- **chop_locker** (`0x0`): Token staking/locking with fluid APY
  - `PoolConfig` — shared pool state per token
  - `Lock` — user-owned lock position
  - Fluid APY based on lock duration (MIN_APY + range * (days-1)/364)
  - Pool depletion factor for reward scaling
  - Admin: `ChopLockerAdmin`, `PoolAdmin` (per-pool)
- **chop_token** (`0x0`): CHOP token
  - One-time witness `CHOP_TOKEN`, 9 decimals
  - `coin::create_currency` with TreasuryCap + CoinMetadata

### Known Warnings (non-blocking)
- `public entry` lint (redundant — `public` alone is sufficient)
- Untyped numeric literal `1` in `sqrt_u128` — defaults to u64

---

## Phase 2: Testnet Deploy

### 2.1 Deploy chop_token
```bash
sui client publish --path chop_token
```
- Capture published package ID
- Capture TreasuryCap object ID

### 2.2 Deploy chop_locker
```bash
sui client publish --path chop_locker
```
- Update `chop_locker/Move.toml` to reference the published `chop_token` package
- Capture published package ID

### 2.3 Initialize On-Chain
- Call `chop_locker::init` (runs automatically on publish)
- Call `new_pool_config` with CHOP coin to seed a reward pool
- Test `lock_tokens`, `withdraw_tokens`, `fund_rewards` on testnet

### 2.4 Verify
- Write Move unit tests for core math (`calculate_apy`, `calculate_depletion_factor`, `sqrt_u128`)
- Test edge cases: 0 balance, max days, min days
- Test `withdraw_tokens` before unlock period (should fail)

---

## Phase 3: Security & Walrus Integration

### 3.1 Research Goals
- Walrus decentralized storage for locker/vault metadata
  - Store pool configurations, historical APY data
  - Blob certification for data availability
- Sui KMS / multisig for admin operations
- Time-locks and emergency pause mechanisms

### 3.2 Potential Additions
- `EmergencyPause` capability
- `UpgradeCap` for future contract upgrades
- Walrus blob storage for locker metadata (off-chain, referenced on-chain via `Url`)

---

## Phase 4: 7k / Bolt Liquidity Integration

### 4.1 Research Goals
- Investigate [7k](https://7k.dev) (Sui DEX aggregator) integration
  - Fee structure comparison vs direct swaps
  - How lockers can route rewards through 7k
- Investigate Bolt liquidity
  - Fee comparison table
  - TVL and volume data

### 4.2 Deliverable
- Comparison table of fee structures
- Recommendation for reward routing strategy
- Code sketch for integration if applicable

---

## Phase 5: Baskets Evaluation

### 5.1 Research Goals
- Evaluate Crypto.com DeFi Basket
  - Token composition, rebalancing strategy
  - Fee structure
- Evaluate Tugboat (Sui-based basket protocol)
  - Smart contract architecture
  - Comparison with ChopSui locker model

### 5.2 Feasibility
- Can ChopSui lockers support basket positions?
- Would a basket wrapper contract be needed?

---

## Phase 6: Website Planning

### 6.1 Architecture
- Frontend: Next.js or SvelteKit
- Sui wallet integration (Suiet, Martian, OKX)
- State: React Query / Zustand
- Styling: Tailwind CSS
- Hosting: Vercel / SuiNS

### 6.2 Pages
1. **Dashboard** — pool overview, TVL, APY
2. **Lock** — create new lock position
3. **Portfolio** — user's active locks, rewards
4. **Pool Admin** — fund rewards, manage pools
5. **Swap** — (future) integrate 7k for in-app swaps

### 6.3 Smart Contract Interaction
- `@mysten/sui.js` SDK
- PTBs for batched operations (lock + swap in one tx)
- `useZkLogin` for gasless transactions (future)

---

## Phase 7: Production Readiness

### 7.1 Audits
- Internal review
- Third-party audit (MoveBit / OtterSec)
- Formal verification for core math

### 7.2 Mainnet Deploy
- Follow same flow as Phase 2 but on mainnet
- Configure real token addresses

### 7.3 CI/CD
- GitHub Actions for Move compilation checks
- Unit test runner on PRs
- Deploy automation (optional)

---

## File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `chop_locker/sources/chop_locker.move` | 249 | Token locker staking contract |
| `chop_token/sources/chop_token.move` | 19 | CHOP token |
| `chop_locker/Move.toml` | — | Locker package config |
| `chop_token/Move.toml` | — | Token package config |
| `removeFromLocker.sh` | — | Legacy unlock script (needs update) |
