# Uniswap V4 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete BSC Testnet Uniswap V4 pool, position, Permit2, and single-hop swap support while preserving the existing V2 and V3 router paths.

**Architecture:** Keep the current Viem/Wagmi hook structure and add focused V4 pure helpers, chain hooks, and UI branches. Persist complete zero-hook V4 PoolKey metadata with token IDs so positions can be restored without log scans.

**Tech Stack:** React 18, TypeScript, Viem, Wagmi, TanStack Query, Vitest, Vite.

---

### Task 1: V4 Types, PoolKey, Math, And Action Encoding

**Files:**
- Create: `src/lib/v4.ts`
- Create: `src/lib/v4.test.ts`
- Modify: `src/types/token.ts`
- Modify: `src/lib/contracts.ts`
- Modify: `src/lib/abis.ts`

- [ ] Write failing tests for native BNB currency normalization, currency sorting, fee/tick mapping, zero-hook PoolKey enforcement, PoolKey ID, liquidity calculation, PositionManager action encoding, Universal Router 2.1.1 V4 encoding, and route labels.
- [ ] Run `bun test src/lib/v4.test.ts` and confirm failures are caused by missing V4 exports.
- [ ] Add V4 types, deployed addresses, minimal official ABIs, and pure encoding/math helpers.
- [ ] Run `bun test src/lib/v4.test.ts` and confirm the tests pass.

### Task 2: Persistence And URL Routing

**Files:**
- Modify: `src/lib/poolPositions.ts`
- Modify: `src/lib/poolPositions.test.ts`
- Modify: `src/lib/appRouting.ts`
- Modify: `src/lib/appRouting.test.ts`

- [ ] Write failing tests for V4 tracked-position validation, PoolKey-based deduplication, bigint serialization, and V4 add/detail/remove URL round trips.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Extend persistence and route types without changing existing V2/V3 behavior.
- [ ] Run the focused tests and confirm they pass.

### Task 3: V4 Chain Reads And Position Import

**Files:**
- Create: `src/hooks/useV4PoolInfo.ts`
- Create: `src/hooks/useV4Position.ts`
- Create: `src/lib/v4Receipt.ts`
- Create: `src/lib/v4Receipt.test.ts`
- Modify: `src/components/liquidity/ImportPositionModal.tsx`
- Modify: `src/app/App.tsx`

- [ ] Write failing tests for V4 mint receipt token-ID parsing.
- [ ] Implement StateView pool reads, PositionManager position reads, owner validation, receipt parsing, and token-ID import.
- [ ] Verify focused tests and TypeScript compilation.

### Task 4: Permit2 Authorization

**Files:**
- Create: `src/lib/permit2.ts`
- Create: `src/lib/permit2.test.ts`
- Create: `src/hooks/usePermit2Allowance.ts`
- Create: `src/hooks/useApprovePermit2.ts`
- Modify: `src/lib/queryInvalidation.ts`

- [ ] Write failing tests for ERC-20-to-Permit2 and Permit2-to-spender authorization decisions, amount limits, and expiration.
- [ ] Implement Permit2 reads, ERC-20-to-Permit2 approvals, and EIP-712 PermitBatch signing using the standard Permit2 address.
- [ ] Verify focused tests and TypeScript compilation.

### Task 5: V4 Liquidity Transactions

**Files:**
- Create: `src/hooks/useAddV4Liquidity.ts`
- Create: `src/hooks/useRemoveV4Liquidity.ts`
- Modify: `src/components/liquidity/AddLiquidityForm.tsx`
- Modify: `src/components/liquidity/RemoveLiquidityForm.tsx`
- Modify: `src/pages/AddLiquidityPage.tsx`
- Modify: `src/pages/RemoveLiquidityPage.tsx`

- [ ] Add hook-level transaction construction around tested pure encoders.
- [ ] Add V4 create/increase UI with fee, range, PermitBatch signature forwarding in the PositionManager multicall, and receipt tracking. Keep PoolKey hooks at zero and ABI hook data at `0x`.
- [ ] Add V4 decrease and fee collection actions.
- [ ] Run V4 unit tests and TypeScript compilation.

### Task 6: V4 Quote And Universal Router Swap

**Files:**
- Modify: `src/lib/v3Routing.ts`
- Modify: `src/lib/v3Routing.test.ts`
- Modify: `src/hooks/useSwap.ts`
- Modify: `src/components/swap/SwapForm.tsx`
- Modify: `src/app/App.tsx`

- [ ] Write failing route-selection tests including V4 candidates and fee-only labels.
- [ ] Add tracked and default zero-hook PoolKey quote candidates through V4Quoter.
- [ ] Execute only winning V4 routes through UniversalRouter 2.1.1 and Permit2; leave V2/V3 addresses and writes unchanged.
- [ ] Run focused route tests and TypeScript compilation.

### Task 7: Pool And Position UI Integration

**Files:**
- Modify: `src/components/liquidity/CreatePositionModal.tsx`
- Modify: `src/components/liquidity/PoolList.tsx`
- Modify: `src/components/liquidity/PoolCard.tsx`
- Modify: `src/pages/PairDetailPage.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/globals.css`

- [ ] Enable the V4 create option and update Pool copy.
- [ ] Display locally tracked V4 NFTs, current liquidity, range, fee, and position controls.
- [ ] Preserve existing worktree UI edits and add only required V4 styles.
- [ ] Run TypeScript compilation and component-related tests.

### Task 8: Full Verification

**Files:**
- Modify only files required by verification failures.

- [ ] Run `bun test`.
- [ ] Run `bun run typecheck`.
- [ ] Run `bun run lint`.
- [ ] Run `bun run build`.
- [ ] Run `git diff --check`.
- [ ] Start the local app and inspect Create V4 Position, V4 import/detail/remove, and Swap route rendering in the in-app browser.
