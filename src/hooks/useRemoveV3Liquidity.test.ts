import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeFunctionData } from "viem";
import { nonfungiblePositionManagerAbi } from "../lib/abis";
import type { V3PositionInfo } from "../types/token";
import { useRemoveV3Liquidity } from "./useRemoveV3Liquidity";

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

const position: V3PositionInfo = {
  tokenId: 7n,
  token0: "0x0000000000000000000000000000000000000001",
  token1: "0x0000000000000000000000000000000000000002",
  fee: 3000,
  tickLower: -120,
  tickUpper: 120,
  liquidity: 1000n,
  feeGrowthInside0LastX128: 0n,
  feeGrowthInside1LastX128: 0n,
  tokensOwed0: 0n,
  tokensOwed1: 0n
};

beforeEach(() => {
  writeContract.mockReset();
});

describe("useRemoveV3Liquidity", () => {
  it("encodes caller-provided minimum outputs in decreaseLiquidity", () => {
    const { result } = renderHook(() => useRemoveV3Liquidity());

    act(() => {
      result.current.removeLiquidity(position, 50, { amount0Min: 12n, amount1Min: 34n });
    });

    const call = writeContract.mock.calls[0]?.[0];
    const [decreaseCall] = call.args[0];
    const decoded = decodeFunctionData({ abi: nonfungiblePositionManagerAbi, data: decreaseCall });
    const params = decoded.args?.[0] as { amount0Min: bigint; amount1Min: bigint };

    expect(decoded.functionName).toBe("decreaseLiquidity");
    expect(params.amount0Min).toBe(12n);
    expect(params.amount1Min).toBe(34n);
  });
});
