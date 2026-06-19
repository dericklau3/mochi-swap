import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeAbiParameters, parseAbiParameters } from "viem";
import type { V4PositionInfo } from "../types/token";
import { useRemoveV4Liquidity } from "./useRemoveV4Liquidity";

const { getGasPrice, writeContract } = vi.hoisted(() => ({
  getGasPrice: vi.fn(),
  writeContract: vi.fn()
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x00000000000000000000000000000000000000aa" }),
  usePublicClient: () => ({ getGasPrice }),
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

const position: V4PositionInfo = {
  tokenId: 1n,
  poolKey: {
    currency0: "0x0000000000000000000000000000000000000000",
    currency1: "0x0000000000000000000000000000000000000001",
    fee: 3000,
    tickSpacing: 60,
    hooks: "0x0000000000000000000000000000000000000000"
  },
  tickLower: -120,
  tickUpper: 120,
  liquidity: 1000n,
  owner: "0x00000000000000000000000000000000000000aa"
};

beforeEach(() => {
  getGasPrice.mockReset();
  getGasPrice.mockResolvedValue(120_000_000n);
  writeContract.mockReset();
});

describe("useRemoveV4Liquidity", () => {
  it("uses an explicit legacy gas price for V4 fee collection", async () => {
    const { result } = renderHook(() => useRemoveV4Liquidity());

    await act(async () => {
      await result.current.collectFees(position);
    });

    expect(getGasPrice).toHaveBeenCalledOnce();
    expect(writeContract).toHaveBeenCalledWith(expect.objectContaining({
      gasPrice: 120_000_000n,
      type: "legacy"
    }));
  });

  it("encodes caller-provided minimum outputs when removing V4 liquidity", async () => {
    const { result } = renderHook(() => useRemoveV4Liquidity());

    await act(async () => {
      await result.current.removeLiquidity(position, 50, { amount0Min: 12n, amount1Min: 34n });
    });

    const call = writeContract.mock.calls[0]?.[0];
    const unlockData = call.args[0];
    const [, params] = decodeAbiParameters(parseAbiParameters("bytes,bytes[]"), unlockData);
    const [, , amount0Min, amount1Min] = decodeAbiParameters(parseAbiParameters("uint256,uint256,uint128,uint128,bytes"), params[0]);

    expect(amount0Min).toBe(12n);
    expect(amount1Min).toBe(34n);
  });
});
