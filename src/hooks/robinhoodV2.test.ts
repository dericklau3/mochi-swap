import { act, renderHook } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Token } from "../types/token";
import { parseEther, zeroAddress } from "viem";

const { writeContract, readContract, usePublicClient, useWaitForTransactionReceipt } = vi.hoisted(() => {
  const readContract = vi.fn();
  return {
    writeContract: vi.fn(), readContract,
    usePublicClient: vi.fn(() => ({ readContract })),
    useWaitForTransactionReceipt: vi.fn(() => ({ isLoading: false, isSuccess: false }))
  };
});
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x00000000000000000000000000000000000000aa" }),
  usePublicClient, useWaitForTransactionReceipt,
  useWriteContract: () => ({ writeContract, isPending: false })
}));
vi.mock("./useInvalidateDexQueries", () => ({ useInvalidateDexQueries: () => undefined }));

const eth: Token = { address: zeroAddress, symbol: "ETH", name: "Ether", decimals: 18, isNative: true };
const token: Token = { address: "0x0000000000000000000000000000000000000001", symbol: "TEST", name: "Test", decimals: 18 };
const router = "0xdd67C669F804e36F496Eb228a361A465a1DDDAac";
const weth = "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4";

beforeAll(() => {
  window.history.replaceState(null, "", "/?network=robinhoodTestnet");
  vi.resetModules();
});
afterAll(() => window.history.replaceState(null, "", "/"));
beforeEach(() => {
  vi.clearAllMocks();
  readContract.mockResolvedValue([parseEther("1"), parseEther("2")]);
});

describe("Robinhood V2/V3 transaction boundaries", () => {
  it("falls back to V2 on the application chain and swaps ETH through its WETH", async () => {
    readContract.mockImplementation(({ functionName }) => functionName === "getAmountsOut" ? Promise.resolve([parseEther("1"), parseEther("2")]) : Promise.reject(new Error("No V3 pool")));
    const { useSwap } = await import("./useSwap");
    const { result } = renderHook(() => useSwap(eth, token));
    const quote = await result.current.quote("1");
    expect(readContract).toHaveBeenCalledTimes(4);
    expect(readContract).toHaveBeenCalledWith(expect.objectContaining({ address: router, functionName: "getAmountsOut", args: [parseEther("1"), [weth, token.address]] }));
    expect(usePublicClient).toHaveBeenCalledWith({ chainId: 46630 });
    act(() => result.current.swap("1", quote!));
    expect(writeContract).toHaveBeenCalledWith(expect.objectContaining({ chainId: 46630, address: router, functionName: "swapExactETHForTokens", value: parseEther("1") }));
    expect(useWaitForTransactionReceipt).toHaveBeenCalledWith(expect.objectContaining({ chainId: 46630 }));
  });

  it("selects a better V3 quote and uses the Robinhood V3 router for ETH input", async () => {
    readContract.mockImplementation(({ functionName }) => Promise.resolve(functionName === "getAmountsOut" ? [parseEther("1"), parseEther("2")] : [parseEther("3"), 0n, 0, 0n]));
    const { useSwap } = await import("./useSwap");
    const { result } = renderHook(() => useSwap(eth, token));
    const quote = await result.current.quote("1");
    expect(quote).toMatchObject({ protocol: "V3", amountOut: parseEther("3") });
    expect(readContract).toHaveBeenCalledWith(expect.objectContaining({ address: "0xe2eDbCdD87cd52b33a41d67434F6D6a6b3075291", functionName: "quoteExactInputSingle" }));
    act(() => result.current.swap("1", quote!));
    expect(writeContract).toHaveBeenCalledWith(expect.objectContaining({ chainId: 46630, address: "0xc98A0311Ba733fBd2f4b21397df598f9e5a814fc", functionName: "exactInputSingle", value: parseEther("1"), args: [expect.objectContaining({ tokenIn: weth, tokenOut: token.address, amountIn: parseEther("1"), amountOutMinimum: parseEther("2.985"), deadline: expect.any(BigInt) })] }));
  });

  it("removes V3 liquidity and collects fees through the Robinhood position manager", async () => {
    const { useRemoveV3Liquidity } = await import("./useRemoveV3Liquidity");
    const position = { tokenId: 7n, token0: token.address, token1: weth, fee: 3000, tickLower: -60, tickUpper: 60, liquidity: 100n, feeGrowthInside0LastX128: 0n, feeGrowthInside1LastX128: 0n, tokensOwed0: 0n, tokensOwed1: 0n } as const;
    const { result } = renderHook(() => useRemoveV3Liquidity());
    act(() => result.current.removeLiquidity(position, 50, { amount0Min: 1n, amount1Min: 2n }));
    expect(writeContract).toHaveBeenCalledWith(expect.objectContaining({ chainId: 46630, address: "0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe", functionName: "multicall" }));
    const { decodeFunctionData } = await import("viem");
    const { nonfungiblePositionManagerAbi } = await import("../lib/abis");
    const calls = writeContract.mock.calls[0][0].args[0];
    expect(decodeFunctionData({ abi: nonfungiblePositionManagerAbi, data: calls[0] })).toMatchObject({ functionName: "decreaseLiquidity", args: [{ tokenId: 7n, liquidity: 50n, amount0Min: 1n, amount1Min: 2n }] });
    expect(decodeFunctionData({ abi: nonfungiblePositionManagerAbi, data: calls[1] })).toMatchObject({ functionName: "collect" });
  });

  it("adds and removes ETH liquidity with the correct token amounts and chain", async () => {
    const { useAddLiquidity } = await import("./useAddLiquidity");
    const add = renderHook(() => useAddLiquidity(eth, token, 100));
    act(() => add.result.current.addLiquidity("1", "2"));
    expect(writeContract).toHaveBeenLastCalledWith(expect.objectContaining({ chainId: 46630, address: router, functionName: "addLiquidityETH", value: parseEther("1"), args: [token.address, parseEther("2"), parseEther("1.98"), parseEther("0.99"), "0x00000000000000000000000000000000000000aa", expect.any(BigInt)] }));
    const { useRemoveLiquidity } = await import("./useRemoveLiquidity");
    const remove = renderHook(() => useRemoveLiquidity(eth, token));
    act(() => remove.result.current.removeLiquidity(100n, { amountAMin: 11n, amountBMin: 22n }));
    expect(writeContract).toHaveBeenLastCalledWith(expect.objectContaining({ chainId: 46630, address: router, functionName: "removeLiquidityETH", args: [token.address, 100n, 22n, 11n, "0x00000000000000000000000000000000000000aa", expect.any(BigInt)] }));
  });

  it("enables V3 liquidity while rejecting undeployed V4 mutations", async () => {
    const { useAddV3Liquidity } = await import("./useAddV3Liquidity");
    const { useAddV4Liquidity } = await import("./useAddV4Liquidity");
    const settings = { tokenA: eth, tokenB: token, initialPrice: "2", initialPriceDirection: "quote" as const, rangeMode: "full" as const, minPrice: "", maxPrice: "", deadlineMinutes: 20 };
    const v3 = renderHook(() => useAddV3Liquidity({ ...settings, feeLabel: "0.3%", slippageBps: 50, poolExists: true }));
    const v4 = renderHook(() => useAddV4Liquidity({ ...settings, fee: 3000, sqrtPriceX96: 79228162514264337593543950336n }));
    act(() => v3.result.current.addLiquidity("1", "2"));
    expect(writeContract).toHaveBeenCalledWith(expect.objectContaining({ chainId: 46630, address: "0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe", functionName: "multicall", value: parseEther("1") }));
    writeContract.mockClear();
    act(() => v4.result.current.addLiquidity("1", "2"));
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("approves the Robinhood router on Robinhood", async () => {
    const { useApproveToken } = await import("./useApproveToken");
    const { result } = renderHook(() => useApproveToken(token.address, router));
    act(() => result.current.approve(123n));
    expect(writeContract).toHaveBeenCalledWith(expect.objectContaining({ chainId: 46630, address: token.address, args: [router, 123n] }));
  });
});
