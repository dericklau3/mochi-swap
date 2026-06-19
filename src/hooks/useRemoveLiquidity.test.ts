import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Token } from "../types/token";
import { useRemoveLiquidity } from "./useRemoveLiquidity";

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

describe("useRemoveLiquidity", () => {
  it("passes caller-provided minimum outputs to the V2 router", () => {
    const { result } = renderHook(() => useRemoveLiquidity(tokenA, tokenB));

    act(() => {
      result.current.removeLiquidity(1000n, { amountAMin: 12n, amountBMin: 34n });
    });

    const call = writeContract.mock.calls[0]?.[0];

    expect(call.functionName).toBe("removeLiquidity");
    expect(call.args[3]).toBe(12n);
    expect(call.args[4]).toBe(34n);
  });
});
