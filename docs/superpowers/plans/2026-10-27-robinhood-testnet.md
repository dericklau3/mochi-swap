# Robinhood Testnet Implementation Plan

> Execute inline with superpowers:executing-plans and test-driven-development.

**Goal:** Enable Robinhood testnet V2 swaps and liquidity alongside BSC.
**Architecture:** URL-selected application network, full reload on changes, static active configuration and explicit chain binding for reads/writes.
**Tech Stack:** React, wagmi, viem, Vitest.
**Spec:** ../specs/2026-10-27-robinhood-testnet-design.md

## Constraints and review focus

Preserve BSC defaults and legacy storage; Robinhood has no V3/V4 configuration. Check wallet/application chain mismatch, deep links, cache isolation, ETH/WETH aliasing, and native/ERC20 transaction arguments.

## Tasks

- [x] 1. Add failing Robinhood configuration, storage and protocol-route tests; run with `npm test -- src/lib/robinhood.test.ts` and confirm missing support.
- [x] 2. Implement URL network selection in chains.ts, active contracts/tokens, network-scoped storage, explicit clients/transaction chains and V2-only protocol gates. Run the focused tests.
- [x] 3. Add network selector and dynamic copy; guard deep links and unsupported protocol reads. Add mocked V2 swap/add/remove/approval tests against Robinhood, then run `npm test`.
- [x] 4. Document network, addresses and usage in README and RPC override in .env.example. Run `npm run lint`, `npm run build`, inspect the browser UI, and review the complete diff.

## Completion evidence

- 2026-10-27: 101 tests across 23 files passed; lint, TypeScript and Vite production build passed; diff whitespace check passed.
- Browser: changed Robinhood → BSC → Robinhood through the selector; verified asset reset and swap route reset, Robinhood V2-only create modal and add-liquidity form.
- Independent review found an unsupported-protocol trailing-path bypass; regression tests failed first, then passed after consistent route gating and defensive mutation guards. No other actionable regression reported.
- Preserved legacy BSC storage and unrelated untracked June docs. Implementation branch: codex/robinhood-testnet. No wallet signatures or broadcasts performed.
