# Move V4 Collect Fees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep V4 fee collection on the pool detail page and remove it from the remove-liquidity flow.

**Architecture:** Reuse the existing `useRemoveV4Liquidity().collectFees` transaction path from `PairDetailPage`. `RemoveLiquidityForm` remains responsible only for decreasing liquidity, while the detail page owns the independent fee-collection action and transaction feedback.

**Tech Stack:** React, TypeScript, wagmi, Vitest, Testing Library

---

### Task 1: Add the page-boundary regression test

**Files:**
- Create: `src/pages/V4CollectFeesPlacement.test.tsx`

- [x] **Step 1: Write the failing test**

Render a V4 `PairDetailPage` and `RemoveLiquidityPage` with mocked wallet and data hooks. Assert that the detail page exposes a `Collect fees` button and that the remove page does not.

- [x] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/pages/V4CollectFeesPlacement.test.tsx`

Expected: FAIL because `Collect fees` is still rendered on the remove page and absent from the detail page.

### Task 2: Move the V4 fee collection action

**Files:**
- Modify: `src/pages/PairDetailPage.tsx`
- Modify: `src/components/liquidity/RemoveLiquidityForm.tsx`

- [x] **Step 1: Add the detail-page transaction action**

Use `useAccount`, `useChainId`, `useRemoveV4Liquidity`, `useTransactionMessage`, and `isTargetChainId` in `PairDetailPage`. Render `Collect fees` only for V4, disable it without a connected wallet, correct network, or loaded position, and call `collectFees(v4Position)` on click.

- [x] **Step 2: Remove the action from the remove form**

Delete the V4 `Collect fees` button from `RemoveLiquidityForm` without changing the V4 remove-liquidity submit behavior.

- [x] **Step 3: Run the focused test**

Run: `bun run test -- src/pages/V4CollectFeesPlacement.test.tsx`

Expected: PASS.

### Task 3: Verify the application

**Files:**
- Verify only

- [x] **Step 1: Run all tests**

Run: `bun run test`

Expected: all tests pass.

- [x] **Step 2: Run typecheck and production build**

Run: `bun run typecheck`

Run: `bun run build`

Expected: both commands complete successfully.
