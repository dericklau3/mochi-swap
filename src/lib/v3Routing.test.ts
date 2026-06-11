import { describe, expect, it } from "vitest";
import { maxUint160 } from "viem";
import { calculateV3PositionAmounts, calculateV3RemovalAmounts, chooseBestSwapRoute, formatV3PoolPrice, getSqrtRatioAtTick, getV3DepositAvailability, getV3FeeOption, getV3FullRangeTicks, getV3MintAmountMinimums, getV3PoolPriceValue, getV3PositionRangePrices, getV3PositionRangeStatus, quoteV3DepositAmount, v3FeeOptions } from "./v3Routing";
import { defaultPoolTokens } from "./tokens";

describe("V2/V3 routing helpers", () => {
  it("chooses the route with the highest output amount", () => {
    expect(chooseBestSwapRoute([
      { protocol: "V2", amountOut: 100n },
      { protocol: "V3", fee: 500, amountOut: 98n },
      { protocol: "V3", fee: 3000, amountOut: 105n }
    ])).toEqual({ protocol: "V3", fee: 3000, amountOut: 105n });
  });

  it("ignores failed or empty quotes while choosing the best route", () => {
    expect(chooseBestSwapRoute([
      { protocol: "V2", amountOut: 0n },
      { protocol: "V3", fee: 500, amountOut: undefined },
      { protocol: "V3", fee: 10_000, amountOut: 1n }
    ])).toEqual({ protocol: "V3", fee: 10_000, amountOut: 1n });
  });

  it("maps fee tier labels to Uniswap V3 fee amounts and tick spacing", () => {
    expect(v3FeeOptions.map((option) => option.label)).toEqual(["0.05%", "0.3%", "1.0%"]);
    expect(getV3FeeOption("0.3%")).toMatchObject({ fee: 3000, tickSpacing: 60 });
    expect(getV3FeeOption("unknown")).toMatchObject({ fee: 3000, tickSpacing: 60 });
  });

  it("returns full range ticks aligned to the selected spacing", () => {
    expect(getV3FullRangeTicks(3000)).toEqual({ tickLower: -887220, tickUpper: 887220 });
    expect(getV3FullRangeTicks(500)).toEqual({ tickLower: -887270, tickUpper: 887270 });
  });

  it("uses a bounded sqrt price for initial pool creation", () => {
    expect(getV3FeeOption("1.0%").fee).toBe(10_000);
    expect(maxUint160 > 0n).toBe(true);
  });

  it("quotes both sides of a new full-range V3 position from the initial price", () => {
    const params = { price: "600", direction: "quote" as const, rangeMode: "full" as const, minPrice: "", maxPrice: "" };
    expect(quoteV3DepositAmount({ ...params, amount: "1", input: "a" })).toBe("600");
    expect(quoteV3DepositAmount({ ...params, amount: "600", input: "b" })).toBe("1");
  });

  it("uses concentrated-liquidity ratios for custom ranges", () => {
    const params = { price: "600", direction: "quote" as const, rangeMode: "custom" as const, minPrice: "500", maxPrice: "800" };
    expect(Number(quoteV3DepositAmount({ ...params, amount: "1", input: "a" }))).toBeCloseTo(390.20414296);
    expect(Number(quoteV3DepositAmount({ ...params, amount: "390.20414296", input: "b" }))).toBeCloseTo(1);
  });

  it("allows only the token required by an out-of-range V3 position", () => {
    const range = { rangeMode: "custom" as const, minPrice: "4800000", maxPrice: "5000000" };

    expect(getV3DepositAvailability({ ...range, price: "4700000", direction: "quote" })).toEqual({ a: true, b: false });
    expect(getV3DepositAvailability({ ...range, price: "4900000", direction: "quote" })).toEqual({ a: true, b: true });
    expect(getV3DepositAvailability({ ...range, price: "5100000", direction: "quote" })).toEqual({ a: false, b: true });
  });

  it("respects inverse price display when deciding which V3 token is disabled", () => {
    expect(getV3DepositAvailability({
      price: String(1 / 4700000),
      direction: "base",
      rangeMode: "custom",
      minPrice: String(1 / 5000000),
      maxPrice: String(1 / 4800000)
    })).toEqual({ a: true, b: false });
  });

  it("bases mint minimums on the amounts V3 will actually consume", () => {
    expect(getV3MintAmountMinimums({
      amountA: "0.01",
      amountB: "47000",
      decimalsA: 18,
      decimalsB: 18,
      price: "4782503.54034766",
      direction: "quote",
      rangeMode: "full",
      minPrice: "",
      maxPrice: "",
      slippageBps: 50
    })).toEqual({
      amountAMin: 9778351359980000n,
      amountBMin: 46765000000000000000000n
    });
  });

  it("calculates both token amounts for an in-range V3 position", () => {
    const q96 = 2n ** 96n;

    expect(calculateV3PositionAmounts({
      liquidity: 1_000n,
      sqrtPriceX96: q96,
      sqrtRatioAX96: q96 / 2n,
      sqrtRatioBX96: q96 * 2n
    })).toEqual({
      amount0: 500n,
      amount1: 500n
    });
  });

  it("calculates a single-sided V3 position outside its range", () => {
    const q96 = 2n ** 96n;
    const range = {
      liquidity: 1_000n,
      sqrtRatioAX96: q96,
      sqrtRatioBX96: q96 * 2n
    };

    expect(calculateV3PositionAmounts({ ...range, sqrtPriceX96: q96 / 2n })).toEqual({
      amount0: 500n,
      amount1: 0n
    });
    expect(calculateV3PositionAmounts({ ...range, sqrtPriceX96: q96 * 3n })).toEqual({
      amount0: 0n,
      amount1: 1_000n
    });
  });

  it("calculates the two token amounts received when removing V3 liquidity", () => {
    const q96 = 2n ** 96n;

    expect(calculateV3RemovalAmounts({
      liquidity: 1_000n,
      percent: 50,
      sqrtPriceX96: q96,
      sqrtRatioAX96: q96 / 2n,
      sqrtRatioBX96: q96 * 2n,
      tokensOwed0: 10n,
      tokensOwed1: 20n,
      aIsToken0: false
    })).toEqual({
      liquidity: 500n,
      amountA: 270n,
      amountB: 260n
    });
  });

  it("converts tick zero to Q96", () => {
    expect(getSqrtRatioAtTick(0)).toBe(2n ** 96n);
  });

  it("labels closed, full-range, out-of-range, and active V3 positions", () => {
    const fullRange = getV3FullRangeTicks(3000);

    expect(getV3PositionRangeStatus({ liquidity: 0n, currentTick: 0, fee: 3000, ...fullRange })).toBe("Closed");
    expect(getV3PositionRangeStatus({ liquidity: 1n, currentTick: 0, fee: 3000, ...fullRange })).toBe("Full range");
    expect(getV3PositionRangeStatus({ liquidity: 1n, currentTick: 120, fee: 3000, tickLower: -60, tickUpper: 60 })).toBe("Out of range");
    expect(getV3PositionRangeStatus({ liquidity: 1n, currentTick: 0, fee: 3000, tickLower: -60, tickUpper: 60 })).toBe("In range");
  });

  it("uses the selected token as the V3 current-price quote unit", () => {
    const [bnb, usdt] = defaultPoolTokens;
    const sqrtPriceX96 = (2n ** 96n) * 2n;

    expect(formatV3PoolPrice({ tokenA: bnb, tokenB: usdt, sqrtPriceX96, quoteToken: "b" })).toBe("1 BNB = 4 USDT");
    expect(formatV3PoolPrice({ tokenA: bnb, tokenB: usdt, sqrtPriceX96, quoteToken: "a" })).toBe("1 USDT = 0.25 BNB");
    expect(getV3PoolPriceValue({ tokenA: bnb, tokenB: usdt, sqrtPriceX96, quoteToken: "b" })).toBe("4");
  });

  it("quotes the other token for an existing V3 pool custom range", () => {
    const params = {
      price: "4",
      direction: "quote" as const,
      rangeMode: "custom" as const,
      minPrice: "3",
      maxPrice: "5"
    };

    const tokenBAmount = quoteV3DepositAmount({ ...params, amount: "1", input: "a" });
    expect(Number(tokenBAmount)).toBeGreaterThan(0);
    expect(Number(quoteV3DepositAmount({ ...params, amount: tokenBAmount, input: "b" }))).toBeCloseTo(1);
  });

  it("converts an existing V3 NFT tick range into locked display prices", () => {
    const [bnb, usdt] = defaultPoolTokens;
    const prices = getV3PositionRangePrices({
      tokenA: bnb,
      tokenB: usdt,
      tickLower: 153180,
      tickUpper: 154260,
      direction: "quote"
    });

    expect(Number(prices.minPrice)).toBeGreaterThan(4_000_000);
    expect(Number(prices.maxPrice)).toBeGreaterThan(Number(prices.minPrice));
  });
});
