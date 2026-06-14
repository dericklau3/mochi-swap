import { describe, expect, it } from "vitest";
import { decodeAbiParameters, parseAbiParameters, zeroAddress } from "viem";
import { defaultTokens } from "./tokens";
import {
  V4_ACTIONS,
  V4_ROUTER_COMMAND,
  buildV4PoolKey,
  decodeV4PositionInfo,
  encodeV4MintActions,
  encodeV4SwapInput,
  formatV4PoolPrice,
  formatV4RouteLabel,
  getV4PoolPriceValue,
  getV4PoolId,
  getV4LiquidityForAmounts,
  sortV4Tokens
} from "./v4";
import { getSqrtRatioAtTick } from "./v3Routing";

describe("v4 helpers", () => {
  it("uses the zero address for native BNB and sorts it first", () => {
    const native = defaultTokens.find((token) => token.isNative)!;
    const usdt = defaultTokens.find((token) => token.symbol === "USDT")!;
    const sorted = sortV4Tokens(usdt, native);

    expect(sorted.currency0).toBe(zeroAddress);
    expect(sorted.token0.symbol).toBe("BNB");
    expect(sorted.aIsCurrency0).toBe(false);
  });

  it("builds a stable PoolKey and pool id", () => {
    const key = buildV4PoolKey(defaultTokens[0], defaultTokens[2], 3000);

    expect(key.fee).toBe(3000);
    expect(key.tickSpacing).toBe(60);
    expect(key.hooks).toBe(zeroAddress);
    expect(getV4PoolId(key)).toMatch(/^0x[0-9a-f]{64}$/);
    expect(getV4PoolId(key)).toBe(getV4PoolId({ ...key }));
  });

  it("decodes packed V4 position ticks", () => {
    const lower = -120;
    const upper = 240;
    const packed = (BigInt(lower & 0xffffff) << 8n) | (BigInt(upper & 0xffffff) << 32n);

    expect(decodeV4PositionInfo(packed)).toMatchObject({ tickLower: lower, tickUpper: upper });
  });

  it("encodes mint, settle, and V4 swap actions with official command bytes", () => {
    const key = buildV4PoolKey(defaultTokens[0], defaultTokens[2], 3000);
    const owner = "0x0000000000000000000000000000000000000001";
    const mint = encodeV4MintActions({
      poolKey: key,
      tickLower: -120,
      tickUpper: 120,
      liquidity: 100n,
      amount0Max: 10n,
      amount1Max: 20n,
      owner
    });

    const [actions, params] = decodeAbiParameters(
      [{ type: "bytes" }, { type: "bytes[]" }],
      mint
    );
    expect(actions).toBe(`0x${V4_ACTIONS.MINT_POSITION.toString(16).padStart(2, "0")}${V4_ACTIONS.SETTLE_PAIR.toString(16).padStart(2, "0")}${V4_ACTIONS.SWEEP.toString(16).padStart(2, "0")}`);
    expect(params).toHaveLength(3);

    const swap = encodeV4SwapInput({
      poolKey: key,
      zeroForOne: true,
      amountIn: 10n,
      amountOutMinimum: 9n
    });
    const [swapActions, swapParams] = decodeAbiParameters(
      [{ type: "bytes" }, { type: "bytes[]" }],
      swap
    );
    expect(V4_ROUTER_COMMAND).toBe(0x10);
    expect(swapActions).toBe("0x060c0f");
    expect(swapParams).toHaveLength(3);
    const [swapConfig] = decodeAbiParameters(
      parseAbiParameters("((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,uint256 minHopPriceX36,bytes hookData) params"),
      swapParams[0]
    );
    expect(swapConfig.minHopPriceX36).toBe(0n);
    expect(swapConfig.hookData).toBe("0x");
  });

  it("formats a fee-only V4 route label", () => {
    expect(formatV4RouteLabel(3000)).toBe("V4 0.3%");
  });

  it("uses the selected token as the V4 current-price quote unit", () => {
    const bnb = defaultTokens.find((token) => token.symbol === "BNB")!;
    const usdt = defaultTokens.find((token) => token.symbol === "USDT")!;
    const sqrtPriceX96 = (2n ** 96n) * 2n;

    expect(formatV4PoolPrice({ tokenA: bnb, tokenB: usdt, sqrtPriceX96, quoteToken: "b" })).toBe("1 BNB = 4 USDT");
    expect(formatV4PoolPrice({ tokenA: bnb, tokenB: usdt, sqrtPriceX96, quoteToken: "a" })).toBe("1 USDT = 0.25 BNB");
    expect(getV4PoolPriceValue({ tokenA: bnb, tokenB: usdt, sqrtPriceX96, quoteToken: "b" })).toBe("4");
  });

  it("keeps useful precision for small concentrated-liquidity amounts", () => {
    const ticks = { tickLower: -120, tickUpper: 120 };
    expect(getV4LiquidityForAmounts({
      sqrtPriceX96: getSqrtRatioAtTick(ticks.tickLower),
      ...ticks,
      amount0: 1n,
      amount1: 0n
    })).toBeGreaterThan(0n);
  });
});
