import { describe, expect, it, vi } from "vitest";
import type { PublicClient } from "viem";
import { discoverV3Pools } from "./v3WalletPools";
import type { Token, V3PositionInfo } from "../types/token";
const usdg: Token = { address: "0x3095d36DfE71EEa8b73028809973d3dC53C1c2aA", symbol: "USDG", name: "Global Dollar", decimals: 6 };
const nvda = "0xC54442660F8B7f8E741f2B0f466084b5FeA8B5Aa";
const pool = "0x6B96D847F71B801A64C44f74bAdc53629eE3784B";
const position: V3PositionInfo = { tokenId: 1n, token0: usdg.address, token1: nvda, fee: 500, tickLower: -887270, tickUpper: 887270, liquidity: 100n, feeGrowthInside0LastX128: 0n, feeGrowthInside1LastX128: 0n, tokensOwed0: 0n, tokensOwed1: 0n };
function reader(failMetadata = false) {
  const readContract = vi.fn(async ({ functionName }: { functionName: string }) => {
    if (functionName === "getPool") return pool;
    if (functionName === "decimals") return 18;
    if (failMetadata) throw new Error("optional metadata unavailable");
    if (functionName === "symbol") return "NVDA";
    if (functionName === "name") return "NVIDIA Robinhood Token";
    throw new Error(functionName);
  });
  return { client: { readContract } as unknown as PublicClient, readContract };
}
describe("V3 wallet pool discovery", () => {
  it("resolves a wallet's NVDA/USDG pool without stored tokens or pools", async () => {
    const { client } = reader();
    const result = await discoverV3Pools(client, [position], [usdg]);
    expect(result).toEqual([{ pairAddress: pool, protocol: "V3", fee: 500, tokenA: usdg, tokenB: { address: nvda, symbol: "NVDA", name: "NVIDIA Robinhood Token", decimals: 18 } }]);
  });
  it("groups NFTs in one pool while preserving different fee tiers and closed holdings", async () => {
    const { client, readContract } = reader();
    const result = await discoverV3Pools(client, [position, { ...position, tokenId: 2n }, { ...position, tokenId: 3n, fee: 3000, liquidity: 0n }], [usdg]);
    expect(result.map((p) => p.fee)).toEqual([500, 3000]);
    expect(readContract.mock.calls.filter(([call]) => call.functionName === "symbol")).toHaveLength(1);
  });
  it("uses address labels when optional token strings fail, with real decimals", async () => {
    const { client } = reader(true);
    const result = await discoverV3Pools(client, [position], [usdg]);
    expect(result[0].tokenB.decimals).toBe(18);
    expect(result[0].tokenB.symbol).toContain("0xC544");
  });
  it("reports RPC errors instead of returning a false empty portfolio", async () => {
    const { client, readContract } = reader();
    readContract.mockRejectedValue(new Error("RPC unavailable"));
    await expect(discoverV3Pools(client, [position], [])).rejects.toThrow("RPC unavailable");
  });
});
