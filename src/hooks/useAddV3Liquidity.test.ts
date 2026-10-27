import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeFunctionData } from "viem";
import { nonfungiblePositionManagerAbi } from "../lib/abis";
import type { Token } from "../types/token";
import { useAddV3Liquidity } from "./useAddV3Liquidity";

const { writeContract } = vi.hoisted(() => ({
  writeContract: vi.fn()
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x00000000000000000000000000000000000000aa" }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: false }),
  useWriteContract: () => ({
    data: undefined,
    error: undefined,
    isPending: false,
    writeContract
  })
}));

vi.mock("./useInvalidateDexQueries", () => ({
  useInvalidateDexQueries: () => undefined
}));

const tokenA: Token = {
  address: "0x0000000000000000000000000000000000000001",
  symbol: "AAA",
  name: "Token AAA",
  decimals: 18
};

const tokenB: Token = {
  address: "0x0000000000000000000000000000000000000002",
  symbol: "BBB",
  name: "Token BBB",
  decimals: 18
};

beforeEach(() => {
  writeContract.mockReset();
});

describe("useAddV3Liquidity", () => {
  it("applies slippage minimums when adding to an existing V3 pool", () => {
    const { result } = renderHook(() => useAddV3Liquidity({
      tokenA,
      tokenB,
      feeLabel: "0.3%",
      poolExists: true,
      initialPrice: "2",
      initialPriceDirection: "quote",
      rangeMode: "full",
      minPrice: "",
      maxPrice: "",
      slippageBps: 100,
      deadlineMinutes: 20
    }));

    act(() => {
      result.current.addLiquidity("10", "20");
    });

    const call = writeContract.mock.calls[0]?.[0];
    const params = call.args[0];

    expect(params.amount0Min).toBe(9_900_000_000_000_000_000n);
    expect(params.amount1Min).toBe(19_800_000_000_000_000_000n);
  });
});


it("encodes the NVDA/USDG initialization and mint in consistent atomic units", () => {
  const nvda: Token = { address: "0xC54442660F8B7f8E741f2B0f466084b5FeA8B5Aa", symbol: "NVDA", name: "NVDA", decimals: 18 };
  const usdg: Token = { address: "0x3095d36DfE71EEa8b73028809973d3dC53C1c2aA", symbol: "USDG", name: "USDG", decimals: 6 };
  const { result } = renderHook(() => useAddV3Liquidity({
    tokenA: nvda, tokenB: usdg, feeLabel: "0.05%", poolExists: false,
    initialPrice: "220", initialPriceDirection: "quote", rangeMode: "full",
    minPrice: "", maxPrice: "", slippageBps: 50, deadlineMinutes: 20
  }));
  act(() => result.current.addLiquidity("10000", "2200000"));
  const call = writeContract.mock.calls[0][0];
  expect(call.functionName).toBe("multicall");
  expect(call.args[0]).toHaveLength(2);
  const init = decodeFunctionData({ abi: nonfungiblePositionManagerAbi, data: call.args[0][0] });
  const mint = decodeFunctionData({ abi: nonfungiblePositionManagerAbi, data: call.args[0][1] });
  if (init.functionName !== "createAndInitializePoolIfNecessary" || mint.functionName !== "mint") throw new Error("Expected initialize then mint");
  expect(init.args.slice(0, 3)).toEqual([usdg.address, nvda.address, 500]);
  const rawRatio = (Number(init.args[3]) / Number(2n ** 96n)) ** 2;
  const params = mint.args[0];
  expect(params).toMatchObject({ token0: usdg.address, token1: nvda.address, fee: 500,
    amount0Desired: 2200000000000n, amount1Desired: 10000000000000000000000n,
    amount0Min: 2189000000000n, amount1Min: 9950000000000000000000n,
    tickLower: -887270, tickUpper: 887270 });
  expect(rawRatio / (Number(params.amount1Desired) / Number(params.amount0Desired))).toBeCloseTo(1, 12);
});
