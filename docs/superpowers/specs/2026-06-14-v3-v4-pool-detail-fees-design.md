# V3/V4 Pool Detail Fees Design

## Goal

Make V3 and V4 pool detail pages match the intended position-detail layout and show accurate, actionable fee information.

## Detail Layout

The top action area keeps Back, Add liquidity, Remove liquidity, and the protocol fee badge. The metric grid shows Range, Token ID, and deposited token amounts.

The lower information list contains:

1. `Pool address` for V3, using the deployed V3 pool contract address.
2. `Pool ID` for V4, because V4 pools are singleton PoolManager state and do not have individual contract addresses.
3. `Fee tier`.
4. `Unclaimed fees`, formatted as both token amounts with an inline `Collect fees` button.
5. `Price`, with the existing direction-toggle control.

## Fee Calculation

V3 unclaimed fees include both stored `tokensOwed` and fees accrued since the position's last interaction. The app reads global fee growth, lower and upper tick fee growth outside values, and the current tick, then calculates current fee growth inside the range. Unsigned 256-bit subtraction uses modular arithmetic, matching Solidity overflow semantics.

V4 reads current fee growth inside from `StateView.getFeeGrowthInside` and the position's last recorded fee growth from `StateView.getPositionInfo`. The Position Manager is the core position owner and `bytes32(tokenId)` is the position salt. The delta multiplied by position liquidity and divided by `2^128` gives each currency's claimable fee amount.

## Collection

V3 collection calls `NonfungiblePositionManager.collect` with both maxima set to `uint128.max`.

V4 collection continues to use a zero-liquidity `DECREASE_LIQUIDITY` action followed by currency settlement through the existing Position Manager action encoder.

Successful transactions invalidate position and pool queries so displayed fees refresh.

## Loading And Errors

While fee data is loading, the detail row displays `Loading...`. If the pool or position is unavailable, it displays `-` and disables collection. Existing transaction messages report successful collection, rejection, and contract errors.

## Testing

Pure unit tests cover V3 fee-growth-inside math, uint256 wraparound, and V4 fee deltas. Page tests cover the V3/V4 lower detail rows, price-direction controls, and the correct collect callback for each protocol.
