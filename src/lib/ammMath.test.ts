import { describe, expect, it } from "vitest";
import { zeroAddress } from "viem";
import { CONTRACTS } from "./contracts";
import { calculateLiquidityPosition, calculateMinimumReceived, calculatePriceImpact, formatInputPrice, formatPoolPrice, formatPoolShare, getPairReserves, invertPriceValue, quoteAmountByReserves } from "./ammMath";
import type { PairInfo, Token } from "../types/token";

const bnb: Token = { address: zeroAddress, symbol: "BNB", name: "BNB", decimals: 18, isNative: true };
const usdt: Token = { address: CONTRACTS.bscTestnet.usdt.address, symbol: "USDT", name: "USDT", decimals: 18 };

describe("AMM math helpers", () => {
  it("orders reserves for native BNB through the wrapped token address", () => {
    const pair: PairInfo = {
      address: "0x0000000000000000000000000000000000000001",
      token0: CONTRACTS.bscTestnet.usdt.address,
      token1: CONTRACTS.bscTestnet.weth.address,
      reserve0: 600n * 10n ** 18n,
      reserve1: 2n * 10n ** 18n
    };

    expect(getPairReserves(pair, bnb, usdt)).toEqual({
      reserveA: 2n * 10n ** 18n,
      reserveB: 600n * 10n ** 18n
    });
  });

  it("quotes proportional liquidity amounts and display prices", () => {
    const reserveBnb = 2n * 10n ** 18n;
    const reserveUsdt = 600n * 10n ** 18n;

    expect(quoteAmountByReserves("1", 18, 18, reserveBnb, reserveUsdt)).toBe("300");
    expect(formatPoolPrice(bnb, usdt, reserveBnb, reserveUsdt)).toBe("1 BNB = 300 USDT");
  });

  it("formats implied prices from user-entered amounts for new pairs", () => {
    expect(formatInputPrice(bnb, usdt, "0.01", "100000")).toBe("1 BNB = 10000000 USDT");
    expect(formatInputPrice(usdt, bnb, "100000", "0.01")).toBe("1 USDT = 0.0000001 BNB");
  });

  it("inverts user-entered prices without scientific notation", () => {
    expect(invertPriceValue("100")).toBe("0.01");
    expect(invertPriceValue("0.01")).toBe("100");
    expect(invertPriceValue("")).toBe("");
  });

  it("calculates deposited token amounts from LP share and reserves", () => {
    const pair: PairInfo = {
      address: "0x0000000000000000000000000000000000000001",
      token0: CONTRACTS.bscTestnet.weth.address,
      token1: CONTRACTS.bscTestnet.usdt.address,
      reserve0: 2n * 10n ** 18n,
      reserve1: 600n * 10n ** 18n,
      totalSupply: 10n * 10n ** 18n,
      lpBalance: 1n * 10n ** 18n
    };

    const position = calculateLiquidityPosition(pair, bnb, usdt);

    expect(position.amountA).toBe(2n * 10n ** 17n);
    expect(position.amountB).toBe(60n * 10n ** 18n);
    expect(formatPoolShare(position.poolShareHundredths, true)).toBe("10.00%");
    expect(formatPoolShare(0n, true)).toBe("<0.01%");
    expect(formatPoolShare(0n, false)).toBe("0%");
  });

  it("calculates swap price impact and minimum received from router quote", () => {
    const amountIn = 1n * 10n ** 18n;
    const quotedOut = 90n * 10n ** 18n;
    const reserveIn = 10n * 10n ** 18n;
    const reserveOut = 1_000n * 10n ** 18n;

    expect(calculatePriceImpact(amountIn, quotedOut, reserveIn, reserveOut)).toBe("10.00%");
    expect(calculateMinimumReceived(quotedOut, 50n)).toBe(8955n * 10n ** 16n);
  });
});
