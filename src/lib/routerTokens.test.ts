import { describe, expect, it } from "vitest";
import { zeroAddress } from "viem";
import { CONTRACTS } from "./contracts";
import { isSameRouterToken, toRouterPath, toRouterTokenAddress } from "./routerTokens";
import type { Token } from "../types/token";

const bnb: Token = { address: zeroAddress, symbol: "BNB", name: "BNB", decimals: 18, isNative: true };
const wbnb: Token = { address: CONTRACTS.bscTestnet.weth.address, symbol: "WBNB", name: "Wrapped BNB", decimals: 18 };
const usdt: Token = { address: CONTRACTS.bscTestnet.usdt.address, symbol: "USDT", name: "USDT", decimals: 18 };

describe("router token helpers", () => {
  it("routes native BNB through the wrapped BNB address", () => {
    expect(toRouterTokenAddress(bnb)).toBe(CONTRACTS.bscTestnet.weth.address);
    expect(toRouterPath(bnb, usdt)).toEqual([CONTRACTS.bscTestnet.weth.address, CONTRACTS.bscTestnet.usdt.address]);
  });

  it("treats BNB and WBNB as the same V2 router token", () => {
    expect(isSameRouterToken(bnb, wbnb)).toBe(true);
    expect(isSameRouterToken(bnb, usdt)).toBe(false);
  });
});
