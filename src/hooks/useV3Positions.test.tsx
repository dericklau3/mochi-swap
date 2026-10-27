import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useV3Positions } from "./useV3Positions";
import type { Token } from "../types/token";

const state = vi.hoisted(() => ({ address: "0x00000000000000000000000000000000000000aa" as string | undefined, readContract: vi.fn() }));
vi.mock("wagmi", () => ({ useAccount: () => ({ address: state.address }), usePublicClient: () => ({ readContract: state.readContract }) }));
const token0: Token = { address: "0x0000000000000000000000000000000000000001", symbol: "A", name: "A", decimals: 6 };
const token1: Token = { address: "0x0000000000000000000000000000000000000002", symbol: "B", name: "B", decimals: 18 };
function positionRaw(fee = 500) { return [0n, token0.address, token0.address, token1.address, fee, -887270, 887270, 100n, 0n, 0n, 0n, 0n]; }
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
beforeEach(() => {
  state.address = "0x00000000000000000000000000000000000000aa";
  state.readContract.mockReset().mockImplementation(async ({ functionName, args }) => {
    if (functionName === "balanceOf") return args[0] === state.address && state.address?.endsWith("aa") ? 1n : 0n;
    if (functionName === "tokenOfOwnerByIndex") return args[1] + 1n;
    if (functionName === "positions") return positionRaw();
    throw new Error(functionName);
  });
});
describe("wallet V3 enumeration", () => {
  it("discovers NFTs without a token pair or local storage", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useV3Positions(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data?.[0]).toMatchObject({ tokenId: 1n, token0: token0.address, token1: token1.address, fee: 500, liquidity: 100n });
  });
  it("finds holdings beyond the old fifty-NFT limit", async () => {
    state.readContract.mockImplementation(async ({ functionName, args }) => {
      if (functionName === "balanceOf") return 51n;
      if (functionName === "tokenOfOwnerByIndex") return args[1] + 1n;
      return positionRaw(args[0] === 51n ? 3000 : 500);
    });
    const { wrapper } = setup();
    const { result } = renderHook(() => useV3Positions(token1, token0, 3000), { wrapper });
    await waitFor(() => expect(result.current.data?.map((p) => p.tokenId)).toEqual([51n]));
  });
  it("shares wallet enumeration between pool filters", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => ({ all: useV3Positions(), pair: useV3Positions(token1, token0, 500), other: useV3Positions(token0, token1, 3000) }), { wrapper });
    await waitFor(() => expect(result.current.all.data).toHaveLength(1));
    expect(result.current.pair.data).toHaveLength(1);
    expect(result.current.other.data).toEqual([]);
    expect(state.readContract.mock.calls.filter(([call]) => call.functionName === "balanceOf")).toHaveLength(1);
  });
  it("clears the previous owner's holdings when switching or disconnecting wallets", async () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(() => useV3Positions(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    act(() => { state.address = "0x00000000000000000000000000000000000000bb"; });
    rerender();
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toEqual([]));
    act(() => { state.address = undefined; });
    rerender();
    expect(result.current.data).toBeUndefined();
  });
});
