import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
