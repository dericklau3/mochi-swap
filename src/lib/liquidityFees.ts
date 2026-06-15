const q128 = 2n ** 128n;
const uint256Modulus = 2n ** 256n;

export function subtractUint256(value: bigint, subtrahend: bigint) {
  return (value - subtrahend + uint256Modulus) % uint256Modulus;
}

export function calculateV3FeeGrowthInside({
  currentTick,
  tickLower,
  tickUpper,
  feeGrowthGlobal0X128,
  feeGrowthGlobal1X128,
  feeGrowthOutsideLower0X128,
  feeGrowthOutsideLower1X128,
  feeGrowthOutsideUpper0X128,
  feeGrowthOutsideUpper1X128
}: {
  currentTick: number;
  tickLower: number;
  tickUpper: number;
  feeGrowthGlobal0X128: bigint;
  feeGrowthGlobal1X128: bigint;
  feeGrowthOutsideLower0X128: bigint;
  feeGrowthOutsideLower1X128: bigint;
  feeGrowthOutsideUpper0X128: bigint;
  feeGrowthOutsideUpper1X128: bigint;
}) {
  const feeGrowthBelow0X128 = currentTick >= tickLower
    ? feeGrowthOutsideLower0X128
    : subtractUint256(feeGrowthGlobal0X128, feeGrowthOutsideLower0X128);
  const feeGrowthBelow1X128 = currentTick >= tickLower
    ? feeGrowthOutsideLower1X128
    : subtractUint256(feeGrowthGlobal1X128, feeGrowthOutsideLower1X128);
  const feeGrowthAbove0X128 = currentTick < tickUpper
    ? feeGrowthOutsideUpper0X128
    : subtractUint256(feeGrowthGlobal0X128, feeGrowthOutsideUpper0X128);
  const feeGrowthAbove1X128 = currentTick < tickUpper
    ? feeGrowthOutsideUpper1X128
    : subtractUint256(feeGrowthGlobal1X128, feeGrowthOutsideUpper1X128);

  return {
    feeGrowthInside0X128: subtractUint256(
      subtractUint256(feeGrowthGlobal0X128, feeGrowthBelow0X128),
      feeGrowthAbove0X128
    ),
    feeGrowthInside1X128: subtractUint256(
      subtractUint256(feeGrowthGlobal1X128, feeGrowthBelow1X128),
      feeGrowthAbove1X128
    )
  };
}

export function calculateAccruedFees({
  liquidity,
  feeGrowthInside0X128,
  feeGrowthInside1X128,
  feeGrowthInside0LastX128,
  feeGrowthInside1LastX128
}: {
  liquidity: bigint;
  feeGrowthInside0X128: bigint;
  feeGrowthInside1X128: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
}) {
  return {
    amount0: liquidity * subtractUint256(feeGrowthInside0X128, feeGrowthInside0LastX128) / q128,
    amount1: liquidity * subtractUint256(feeGrowthInside1X128, feeGrowthInside1LastX128) / q128
  };
}

export function calculateV3UnclaimedFees({
  tokensOwed0,
  tokensOwed1,
  ...feeGrowth
}: Parameters<typeof calculateAccruedFees>[0] & {
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}) {
  const accrued = calculateAccruedFees(feeGrowth);
  return {
    amount0: accrued.amount0 + tokensOwed0,
    amount1: accrued.amount1 + tokensOwed1
  };
}
