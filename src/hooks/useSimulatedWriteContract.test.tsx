import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "viem";
import { getReadableError } from "../lib/errors";
import { useSimulatedWriteContract } from "./useSimulatedWriteContract";

const { wallet, simulateContract, writeContract } = vi.hoisted(() => ({
  wallet: {
    address: "0x00000000000000000000000000000000000000aa" as Address | undefined,
    chainId: 97
  },
  simulateContract: vi.fn(),
  writeContract: vi.fn()
}));
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: wallet.address }),
  useChainId: () => wallet.chainId,
  usePublicClient: () => ({ simulateContract }),
  useWriteContract: () => ({ data: undefined, error: null, isPending: false, writeContract })
}));

const transaction = {
  chainId: 97,
  address: "0x0000000000000000000000000000000000000001" as const,
  abi: [{
    type: "function", name: "transfer", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "value", type: "uint256" }],
    outputs: [{ type: "bool" }]
  }] as const,
  functionName: "transfer" as const,
  args: ["0x0000000000000000000000000000000000000002", 100n] as const
};

beforeEach(() => {
  simulateContract.mockReset();
  writeContract.mockReset();
  wallet.address = "0x00000000000000000000000000000000000000aa";
  wallet.chainId = 97;
});
describe("useSimulatedWriteContract", () => {
  it("blocks the wallet if simulation reverts and preserves the reason", async () => {
    simulateContract.mockRejectedValue(new Error("execution reverted: INSUFFICIENT_OUTPUT_AMOUNT"));
    const { result } = renderHook(() => useSimulatedWriteContract());
    await act(async () => { await result.current.writeContract(transaction); });
    expect(writeContract).not.toHaveBeenCalled();
    expect(getReadableError(result.current.error)).toContain("INSUFFICIENT_OUTPUT_AMOUNT");
  });
  it("submits the simulated request only after a successful simulation", async () => {
    const prepared = { ...transaction, account: wallet.address };
    simulateContract.mockResolvedValue({ request: prepared });
    const { result } = renderHook(() => useSimulatedWriteContract());
    await act(async () => { await result.current.writeContract(transaction); });
    expect(simulateContract).toHaveBeenCalledWith(expect.objectContaining({
      functionName: "transfer", account: wallet.address
    }));
    expect(writeContract).toHaveBeenCalledOnce();
    expect(writeContract).toHaveBeenCalledWith(prepared);
    expect(result.current.error).toBeNull();
  });
  it("blocks a wrong-network transaction before wallet confirmation", async () => {
    wallet.chainId = 1;
    const { result } = renderHook(() => useSimulatedWriteContract());
    await act(async () => { await result.current.writeContract(transaction); });
    expect(simulateContract).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
    expect(getReadableError(result.current.error)).toContain("Wrong network");
  });
  it("blocks confirmation if the wallet changes while RPC simulation is pending", async () => {
    let resolveSimulation!: (value: { request: typeof transaction }) => void;
    simulateContract.mockImplementation(() => new Promise((resolve) => { resolveSimulation = resolve; }));
    const { result, rerender } = renderHook(() => useSimulatedWriteContract());
    let pending!: Promise<void>;
    act(() => { pending = result.current.writeContract(transaction); });
    wallet.address = "0x00000000000000000000000000000000000000bb";
    rerender();
    await act(async () => { resolveSimulation({ request: transaction }); await pending; });
    expect(writeContract).not.toHaveBeenCalled();
    expect(getReadableError(result.current.error)).toContain("changed during simulation");
  });
});
