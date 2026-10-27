# V3/V4 Pool Detail Fees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show accurate V3/V4 unclaimed fees, collection controls, pool identity, fee tier, and price on the pool detail page.

**Architecture:** Add protocol-specific fee-growth readers backed by shared pure fee math. Extend the existing remove hooks with independent collect actions, then render a common lower detail section in `PairDetailPage` using V3 pool addresses and V4 pool IDs.

**Tech Stack:** React, TypeScript, viem, wagmi, TanStack Query, Vitest, Testing Library

---

### Task 1: Fee math

**Files:**
- Create: `src/lib/liquidityFees.ts`
- Create: `src/lib/liquidityFees.test.ts`

- [x] Write failing tests for uint256 subtraction, V3 fee growth inside, stored V3 owed fees, and V4 fee growth deltas.
- [x] Run `bun run test -- src/lib/liquidityFees.test.ts` and confirm the missing-module failure.
- [x] Implement modular subtraction and Q128 fee calculations.
- [x] Re-run the focused test and confirm it passes.

### Task 2: Chain fee readers

**Files:**
- Modify: `src/lib/abis.ts`
- Modify: `src/types/token.ts`
- Modify: `src/hooks/useV3Position.ts`
- Create: `src/hooks/useV3UnclaimedFees.ts`
- Create: `src/hooks/useV4UnclaimedFees.ts`
- Modify: `src/lib/queryInvalidation.ts`

- [x] Add the required V3 pool fee-growth/tick ABI functions and V4 StateView fee-growth/position functions.
- [x] Preserve V3 position fee-growth snapshots in `V3PositionInfo`.
- [x] Read and calculate V3 and V4 claimable token amounts through query hooks.
- [x] Include the new fee query keys in mutation invalidation.

### Task 3: Independent V3 collection

**Files:**
- Modify: `src/hooks/useRemoveV3Liquidity.ts`

- [x] Expose `collectFees(position)` using the existing Position Manager `collect` call.
- [x] Keep remove liquidity as the existing decrease-plus-collect multicall.

### Task 4: Pool detail UI

**Files:**
- Modify: `src/pages/PairDetailPage.tsx`
- Modify: `src/pages/V4CollectFeesPlacement.test.tsx`
- Modify: `src/styles/globals.css`

- [x] Write failing page assertions for V3/V4 pool identity, fee tier, unclaimed fees, collect action, and price.
- [x] Render the unified lower detail list and protocol-specific collect handlers.
- [x] Match the supplied reference layout with inline fee collection and a direction-toggle price row.
- [x] Run the focused page test and confirm it passes.

### Task 5: Verification

**Files:**
- Verify only

- [x] Run `bun run test`.
- [x] Run `bun run typecheck`.
- [x] Run `bun run build`.
- [x] Run `git diff --check`.
