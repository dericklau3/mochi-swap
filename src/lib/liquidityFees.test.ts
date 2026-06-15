import { describe, expect, it } from "vitest";
import {
  calculateAccruedFees,
  calculateV3FeeGrowthInside,
  calculateV3UnclaimedFees,
  subtractUint256
} from "./liquidityFees";

describe("liquidity fee calculations", () => {
  it("matches Solidity uint256 subtraction when fee growth wraps", () => {
    expect(subtractUint256(3n, (2n ** 256n) - 2n)).toBe(5n);
  });

  it("calculates V3 fee growth inside the active range", () => {
    expect(calculateV3FeeGrowthInside({
      currentTick: 0,
      tickLower: -100,
      tickUpper: 100,
      feeGrowthGlobal0X128: 1000n,
      feeGrowthGlobal1X128: 2000n,
      feeGrowthOutsideLower0X128: 100n,
      feeGrowthOutsideLower1X128: 200n,
      feeGrowthOutsideUpper0X128: 300n,
      feeGrowthOutsideUpper1X128: 400n
    })).toEqual({
      feeGrowthInside0X128: 600n,
      feeGrowthInside1X128: 1400n
    });
  });

  it("adds crystallized V3 fees to newly accrued fees", () => {
    const q128 = 2n ** 128n;
    expect(calculateV3UnclaimedFees({
      liquidity: 10n,
      feeGrowthInside0X128: 5n * q128,
      feeGrowthInside1X128: 8n * q128,
      feeGrowthInside0LastX128: 2n * q128,
      feeGrowthInside1LastX128: 3n * q128,
      tokensOwed0: 7n,
      tokensOwed1: 11n
    })).toEqual({
      amount0: 37n,
      amount1: 61n
    });
  });

  it("calculates V4 accrued fees from fee growth snapshots", () => {
    const q128 = 2n ** 128n;
    expect(calculateAccruedFees({
      liquidity: 4n,
      feeGrowthInside0X128: 9n * q128,
      feeGrowthInside1X128: 7n * q128,
      feeGrowthInside0LastX128: 6n * q128,
      feeGrowthInside1LastX128: 2n * q128
    })).toEqual({
      amount0: 12n,
      amount1: 20n
    });
  });
});
