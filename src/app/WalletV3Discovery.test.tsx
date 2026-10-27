import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const state = vi.hoisted(() => ({ address: "0xD524a42103c81abEe242870058F4A28b192d5720" as string | undefined, readContract: vi.fn(), usePublicClient: vi.fn() }));
vi.mock("wagmi", () => ({ useAccount: () => ({ address: state.address, isConnected: Boolean(state.address) }), usePublicClient: state.usePublicClient }));
vi.mock("../components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("../components/wallet/NetworkGuard", () => ({ NetworkGuard: () => null }));
vi.mock("../hooks/useMulticallPairInfo", () => ({ useMulticallPairInfo: () => ({ data: undefined, isLoading: false }) }));
vi.mock("../hooks/useV3PoolInfo", () => ({ useV3PoolInfo: () => ({ data: { tick: 221000 }, isLoading: false }) }));
vi.mock("../hooks/useV4Position", () => ({ useV4Position: () => ({ data: undefined, isLoading: false }) }));
vi.mock("../hooks/useV4PoolInfo", () => ({ useV4PoolInfo: () => ({ data: undefined, isLoading: false }) }));
vi.mock("../pages/PairDetailPage", () => ({ PairDetailPage: ({ tokenA, tokenB, tokenId }: { tokenA: { symbol: string }; tokenB: { symbol: string }; tokenId?: bigint }) => <p>Opened {tokenA.symbol}/{tokenB.symbol} #{tokenId?.toString()}</p> }));

vi.mock("../pages/AddLiquidityPage", () => ({ AddLiquidityPage: ({ tokenA, tokenB, positionTokenId }: { tokenA: { symbol: string }; tokenB: { symbol: string }; positionTokenId?: bigint }) => <p>Adding {tokenA.symbol}/{tokenB.symbol} #{positionTokenId?.toString()}</p> }));
vi.mock("../pages/RemoveLiquidityPage", () => ({ RemoveLiquidityPage: ({ tokenA, tokenB, tokenId }: { tokenA: { symbol: string }; tokenB: { symbol: string }; tokenId?: bigint }) => <p>Removing {tokenA.symbol}/{tokenB.symbol} #{tokenId?.toString()}</p> }));

const nvda = "0xC54442660F8B7f8E741f2B0f466084b5FeA8B5Aa";
const usdg = "0x3095d36DfE71EEa8b73028809973d3dC53C1c2aA";
beforeEach(() => {
  window.history.replaceState(null, "", "/?network=robinhoodTestnet#/pool");
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); }
  });
  vi.resetModules();
  state.address = "0xD524a42103c81abEe242870058F4A28b192d5720";
  state.usePublicClient.mockReturnValue({ readContract: state.readContract });
  state.readContract.mockReset().mockImplementation(async ({ functionName, address }) => {
    if (functionName === "balanceOf") return state.address?.endsWith("5720") ? 1n : 0n;
    if (functionName === "tokenOfOwnerByIndex") return 1n;
    if (functionName === "positions") return [0n, usdg, usdg, nvda, 500, -887270, 887270, 148323969741913272n, 0n, 0n, 0n, 0n];
    if (functionName === "getPool") return "0x6B96D847F71B801A64C44f74bAdc53629eE3784B";
    if (functionName === "decimals") return address === nvda ? 18 : 6;
    if (functionName === "symbol") return address === nvda ? "NVDA" : "USDG";
    if (functionName === "name") return address === nvda ? "NVIDIA Robinhood Token" : "Global Dollar";
    throw new Error(functionName);
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });
async function renderApp() {
  const { default: App } = await import("./App");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const tree = () => <QueryClientProvider client={client}><App /></QueryClientProvider>;
  const view = render(tree());
  return { ...view, tree, client };
}
describe("Robinhood wallet portfolio", () => {
  it("shows and opens NVDA/USDG NFT #1 with empty browser storage", async () => {
    const view = await renderApp();
    expect(await screen.findByText("V3 NFT #1")).toBeInTheDocument();
    expect(screen.getAllByText("V3 NFT #1")).toHaveLength(1);
    expect(state.usePublicClient).toHaveBeenCalledWith({ chainId: 46630 });
    expect(state.readContract).toHaveBeenCalledWith(expect.objectContaining({ address: "0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe", functionName: "balanceOf" }));
    fireEvent.click(screen.getByRole("button", { name: /USDG \/ NVDA/ }));
    expect(screen.getByText("Opened USDG/NVDA #1")).toBeInTheDocument();
    view.unmount();
  });
  it("restores a directly opened NFT detail route after token discovery", async () => {
    window.history.replaceState(null, "", `/?network=robinhoodTestnet#/pair?tokenA=${usdg}&tokenB=${nvda}&protocol=V3&fee=500&tokenId=1`);
    await renderApp();
    expect(await screen.findByText("Opened USDG/NVDA #1")).toBeInTheDocument();
  });
  it.each([
    { path: "add/v3", query: "", expected: "Adding" },
    { path: "remove", query: "&protocol=V3", expected: "Removing" }
  ])("restores the $path NFT route with empty token storage", async ({ path, query, expected }) => {
    window.history.replaceState(null, "", `/?network=robinhoodTestnet#/${path}?tokenA=${usdg}&tokenB=${nvda}&fee=500&tokenId=1${query}`);
    await renderApp();
    expect(await screen.findByText(`${expected} USDG/NVDA #1`)).toBeInTheDocument();
  });
  it("does not show another wallet's NFTs after switching or disconnecting", async () => {
    const view = await renderApp();
    await screen.findByText("V3 NFT #1");
    state.address = "0x00000000000000000000000000000000000000bb";
    view.rerender(view.tree());
    await waitFor(() => expect(screen.queryByText("V3 NFT #1")).not.toBeInTheDocument());
    state.address = undefined;
    view.rerender(view.tree());
    expect(screen.queryByText("V3 NFT #1")).not.toBeInTheDocument();
  });
  it("shows a retriable error instead of silently hiding RPC failures", async () => {
    state.readContract.mockRejectedValue(new Error("RPC unavailable"));
    await renderApp();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load wallet V3 positions");
    state.readContract.mockResolvedValue(0n);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
