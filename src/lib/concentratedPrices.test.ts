import { describe, expect, it } from "vitest";
import type { Token } from "../types/token";
import { getV3CustomRangeTicks, getV3InitialSqrtPriceX96, getV3PositionRangePrices } from "./v3Routing";
import { getV4CustomRangeTicks, getV4InitialSqrtPriceX96 } from "./v4";

const q96 = Number(2n ** 96n);
const cases = [
  { decimalsA: 18, decimalsB: 6 },
  { decimalsA: 6, decimalsB: 18 },
  { decimalsA: 8, decimalsB: 6 },
  { decimalsA: 18, decimalsB: 18 }
].flatMap((decimals) => [true, false].flatMap((aIsToken0) => ["quote", "base"].map((direction) => ({
  ...decimals, aIsToken0, direction: direction as "quote" | "base"
}))));

function tokens(decimalsA: number, decimalsB: number, aIsToken0: boolean): [Token, Token] {
  const low = "0x0000000000000000000000000000000000000001";
  const high = "0x0000000000000000000000000000000000000002";
  return [
    { address: aIsToken0 ? low : high, symbol: "A", name: "A", decimals: decimalsA },
    { address: aIsToken0 ? high : low, symbol: "B", name: "B", decimals: decimalsB }
  ];
}

// Independent oracle: an atomic-unit ratio represents a human price only after
// dividing each side by its own token's unit. Do not use production converters.
function humanBPerA(rawRatio: number, decimalsA: number, decimalsB: number, aIsToken0: boolean) {
  return (aIsToken0 ? rawRatio : 1 / rawRatio) * 10 ** (decimalsA - decimalsB);
}

for (const protocol of [
  { name: "V3", initial: getV3InitialSqrtPriceX96, range: getV3CustomRangeTicks },
  { name: "V4", initial: getV4InitialSqrtPriceX96, range: getV4CustomRangeTicks }
]) {
  describe(`${protocol.name} price units`, () => {
    it.each(cases)("initializes 220 B per A with $decimalsA/$decimalsB decimals, sorted=$aIsToken0, direction=$direction", (c) => {
      const [tokenA, tokenB] = tokens(c.decimalsA, c.decimalsB, c.aIsToken0);
      const sqrt = protocol.initial({ tokenA, tokenB, price: String(c.direction === "quote" ? 220 : 1 / 220), direction: c.direction });
      expect(sqrt).toBeDefined();
      const actual = humanBPerA((Number(sqrt) / q96) ** 2, c.decimalsA, c.decimalsB, c.aIsToken0);
      // V4 intentionally rounds the initial price to the nearest tick.
      expect(Math.abs(actual / 220 - 1)).toBeLessThan(protocol.name === "V4" ? 0.000051 : 1e-12);
    });

    it.each(cases)("preserves a 200–240 B per A custom range with $decimalsA/$decimalsB decimals, sorted=$aIsToken0, direction=$direction", (c) => {
      const [tokenA, tokenB] = tokens(c.decimalsA, c.decimalsB, c.aIsToken0);
      const ticks = protocol.range({ tokenA, tokenB, minPrice: String(c.direction === "quote" ? 200 : 1 / 240), maxPrice: String(c.direction === "quote" ? 240 : 1 / 200), direction: c.direction, fee: 500 });
      const prices = [ticks.tickLower, ticks.tickUpper].map((tick) => humanBPerA(1.0001 ** tick, c.decimalsA, c.decimalsB, c.aIsToken0)).sort((a, b) => a - b);
      expect(ticks.tickLower).toBeLessThan(ticks.tickUpper);
      expect(Math.abs(ticks.tickLower % 10)).toBe(0);
      expect(Math.abs(ticks.tickUpper % 10)).toBe(0);
      expect(Math.abs(prices[0] / 200 - 1)).toBeLessThan(0.00051);
      expect(Math.abs(prices[1] / 240 - 1)).toBeLessThan(0.00051);
    });
  });
}

describe("V3 position range display", () => {
  it.each(cases)("decodes atomic tick prices with $decimalsA/$decimalsB decimals, sorted=$aIsToken0, direction=$direction", (c) => {
    const [tokenA, tokenB] = tokens(c.decimalsA, c.decimalsB, c.aIsToken0);
    // Tick zero is always an atomic ratio of 1, independent of token decimals.
    const prices = getV3PositionRangePrices({ tokenA, tokenB, tickLower: 0, tickUpper: 10, direction: c.direction });
    const basePrice = 10 ** (c.direction === "quote" ? c.decimalsA - c.decimalsB : c.decimalsB - c.decimalsA);
    const increasing = c.aIsToken0 === (c.direction === "quote");
    expect(Number(prices.minPrice)).toBeCloseTo(basePrice * (increasing ? 1 : 1 / 1.0001 ** 10), Math.min(12, 5 - Math.log10(basePrice)));
    expect(Number(prices.maxPrice)).toBeCloseTo(basePrice * (increasing ? 1.0001 ** 10 : 1), Math.min(12, 5 - Math.log10(basePrice)));
  });
});
