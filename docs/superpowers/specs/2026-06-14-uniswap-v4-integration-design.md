# Uniswap V4 Integration Design

## Goal

Add complete Uniswap V4 pool and position support on BSC Testnet while preserving
the existing V2 and V3 transaction paths.

The first release will support:

- Creating and initializing V4 pools.
- Minting, importing, viewing, increasing, decreasing, and collecting fees from
  V4 positions.
- Comparing V4 quotes with existing V2 and V3 quotes.
- Executing only V4 swaps through Universal Router 2.1.1.
- Custom hook addresses and hook data.

## Deployment

Use these BSC Testnet contracts:

| Contract | Address |
| --- | --- |
| PoolManager | `0xe60Fc7C84A697270797986e342e2fe2A1A0310cA` |
| PositionDescriptor implementation | `0x4657dCcd7403117fd54F5c21A898613Ed5b1fd88` |
| PositionDescriptor | `0xaFF74454D79d27E52256B5D3C563e03479bF4050` |
| PositionDescriptor ProxyAdmin | `0xf6E11333E0a3a3dac4f2cb74E82f1f0Ee7dBaa63` |
| PositionManager | `0x38342ef4253091B8C4535eBcE1492077BAA7e023` |
| StateView | `0x25c413Edc80F97dce81479fF4DAC67940095CcB5` |
| V4Quoter | `0xbE46d4cA46aC3217e5547fB93b9B50Daf92bC213` |
| UniversalRouter 2.1.1 | `0x5EEA3b6053f56C0f1D48F7215D26c3c0ab6C67b1` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

The contracts follow the unmodified official Uniswap V4 core, periphery, and
Universal Router 2.1.1 interfaces.

## Implementation Approach

Continue using the project's existing Viem, Wagmi, React hooks, and minimal
handwritten ABI pattern. Do not add Uniswap SDK dependencies.

Add focused V4 modules for:

- PoolKey, Currency, tick, price, liquidity, and pool ID utilities.
- PositionManager action encoding.
- Universal Router 2.1.1 V4 command encoding.
- Permit2 allowance reads and writes.
- V4 pool, position, quote, and transaction hooks.

Existing V2 and V3 modules remain the owners of their current behavior.

## Pool Model

A V4 pool is identified by its complete `PoolKey`:

- `currency0`
- `currency1`
- `fee`
- `tickSpacing`
- `hooks`

Native BNB is represented as the zero-address V4 Currency. ERC-20 currencies use
their contract addresses. Currencies are sorted by their underlying address, so
native BNB sorts before every ERC-20.

The initial supported fee choices mirror the current V3 UI:

| UI fee | Fee value | Tick spacing |
| --- | ---: | ---: |
| 0.05% | 500 | 10 |
| 0.3% | 3000 | 60 |
| 1% | 10000 | 200 |

The form exposes:

- Hook address, defaulting to the zero address.
- Hook data, defaulting to `0x`.

Hook data is retained with the tracked position and reused for position
operations and swaps involving that tracked PoolKey. The UI validates the hook
as an EVM address and hook data as hex bytes. The frontend does not attempt to
validate hook permission bits or hook-specific business rules.

## Pool And Position UX

Enable V4 in the existing Create Position modal. The V4 creation form follows
the V3 layout and interaction model:

- Token selection.
- Fee tier.
- Existing or initial pool price.
- Full or custom price range.
- Token amounts and balance percentages.
- Advanced hook address and hook data fields.

The form derives ticks, desired liquidity, maximum token inputs, and slippage
bounds before encoding PositionManager actions.

For a new pool, one transaction batches pool initialization and position minting
when supported by the official PositionManager multicall flow. Existing pools
skip initialization.

Position detail supports:

- Increase liquidity with the original PoolKey and locked range.
- Decrease liquidity by percentage.
- Collect accrued fees without requiring a liquidity decrease.
- Display fee tier, range status, token amounts, liquidity, and token ID.

Hook configuration may appear in V4 position details, but it does not appear in
the Swap route label.

## Position Discovery And Persistence

Use local tracking rather than historical event scanning.

After a successful V4 mint, parse the receipt to identify the minted ERC-721
token ID, then persist:

- Protocol `V4`.
- PositionManager token ID.
- Complete PoolKey.
- Token metadata.
- Tick lower and upper.
- Hook data.

The existing Import Position flow accepts a V4 token ID. Import reads
`getPoolAndPositionInfo` and `getPositionLiquidity` from PositionManager and
constructs the tracked record from chain data. User-supplied pool parameters are
not trusted.

Local persistence remains a convenience index. Position ownership and current
position state are always revalidated on chain before writes.

## PositionManager Actions

Use `modifyLiquidities(unlockData, deadline)` with official action values and ABI
parameter layouts.

Mint:

- `MINT_POSITION`
- `SETTLE_PAIR`

Increase:

- `INCREASE_LIQUIDITY`
- `SETTLE_PAIR`

Decrease:

- `DECREASE_LIQUIDITY`
- `TAKE_PAIR`

Collect fees:

- `DECREASE_LIQUIDITY` with zero liquidity
- `TAKE_PAIR`

Use explicit liquidity values and slippage bounds. Do not use the deprecated
`MINT_POSITION_FROM_DELTAS` or `INCREASE_LIQUIDITY_FROM_DELTAS` actions.

Native BNB is supplied as transaction value. ERC-20 settlement uses Permit2.

## Permit2 Authorization

For each ERC-20, the UI handles two authorization layers:

1. ERC-20 allowance from the token to Permit2.
2. Permit2 allowance from the user to either PositionManager or UniversalRouter.

Authorization state is scoped to the actual spender:

- V4 liquidity uses PositionManager.
- V4 swaps use UniversalRouter.
- Existing V2 and V3 approvals remain unchanged.

Permit2 expiration and amount are checked before presenting the transaction CTA.
The UI guides the user through each required authorization transaction in order.

## Swap Routing

The quote engine requests candidates in parallel:

- V2 through the existing V2 Router.
- V3 through the existing V3 Quoter and supported fee tiers.
- V4 through V4Quoter for known candidate PoolKeys.

V2 and V3 approvals and swaps continue to use their existing routers. They must
not be redirected through UniversalRouter.

Only a winning V4 quote is executed through UniversalRouter 2.1.1. The command
uses the V4 exact-input-single action, settlement, and output-taking actions
required by the official router encoding.

The Swap preview route label is:

- `V2`
- `V3 0.3%`
- `V4 0.3%`

It does not display the hook address.

Because a token pair and fee can have multiple V4 pools with different hooks,
V4 quote candidates come from tracked/imported V4 PoolKeys for the selected
pair. The zero-hook PoolKey for each supported fee may also be probed by default.
Duplicate PoolKeys are removed before quoting.

Hook data is passed to V4Quoter and UniversalRouter. A failing V4 quote is
discarded without affecting V2 or V3 candidates.

## Error Handling

Validate before simulation or submission:

- Different input currencies after native currency normalization.
- Valid hook address.
- Valid hook data hex.
- Supported fee and non-zero tick spacing.
- Initial price and range.
- Tick alignment and ordering.
- Positive liquidity or a valid fee-collection operation.
- ERC-20 and Permit2 allowances.

Surface decoded contract errors where possible. Otherwise show the existing
readable transaction error summary. Hook reverts remain transaction failures and
are not hidden or reinterpreted.

Quote errors are isolated per candidate. Transaction errors retain the existing
message and receipt handling pattern.

## Data And Routing Changes

Extend protocol unions from `V2 | V3` to `V2 | V3 | V4`.

V4 tracked positions add a structured PoolKey and hook data. Routes for V4
position detail, add, and remove operations include token ID; complete PoolKey
data is resolved from local tracking and confirmed on chain.

Existing stored V2 and V3 positions remain valid without migration. The storage
reader treats V4-only fields as optional and validates them only when protocol is
V4.

## Testing

Add unit coverage for:

- V4 Currency normalization and sorting, including native BNB.
- PoolKey normalization and pool ID calculation.
- Fee, tick spacing, full-range, and custom-range calculations.
- Hook address and hook data validation.
- Mint, increase, decrease, collect, settle, and take action encoding.
- Universal Router 2.1.1 V4 exact-input calldata.
- Permit2 allowance and expiration decisions.
- Receipt parsing for minted V4 token IDs.
- V4 tracked-position persistence and import.
- V2, V3, and V4 best-route selection.
- Proof that V2 and V3 writes retain their existing router addresses.
- V4 route labels showing only protocol and fee.
- URL routing for V4 position operations.

Verification runs:

- `bun test`
- `bun run typecheck`
- `bun run lint`
- `bun run build`

After implementation, inspect the Create Position, V4 liquidity, Pool list,
position detail, import, remove, collect, and Swap flows in the local browser.

## Scope Boundaries

This release does not:

- Discover arbitrary wallet V4 positions by scanning historical logs.
- Add multi-hop V4 routing.
- Add user-authored hook-specific parameter schemas.
- Validate hook bytecode or permission flags.
- Route V2 or V3 swaps through UniversalRouter.
- Add Uniswap SDK dependencies.
