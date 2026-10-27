import { zeroAddress, type Address, type PublicClient } from "viem";
import { erc20Abi, uniswapV3FactoryAbi } from "./abis";
import { v3FactoryAddress } from "./contracts";
import type { Token, TrackedPoolPosition, V3PositionInfo } from "../types/token";

export async function discoverV3Pools(client: Pick<PublicClient, "readContract">, positions: V3PositionInfo[], knownTokens: Token[]): Promise<TrackedPoolPosition[]> {
  const tokens = new Map<string, Token>(knownTokens.filter((token) => !token.isNative).map((token) => [token.address.toLowerCase(), token]));
  const pools = new Map<string, TrackedPoolPosition>();
  async function resolveToken(address: Address): Promise<Token> {
    const cached = tokens.get(address.toLowerCase());
    if (cached) return cached;
    const fallback = `${address.slice(0, 6)}…${address.slice(-4)}`;
    const [decimals, symbol, name] = await Promise.all([
      client.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
      client.readContract({ address, abi: erc20Abi, functionName: "symbol" }).catch(() => fallback),
      client.readContract({ address, abi: erc20Abi, functionName: "name" }).catch(() => fallback)
    ]);
    const token = { address, decimals, symbol: symbol || fallback, name: name || fallback };
    tokens.set(address.toLowerCase(), token);
    return token;
  }
  for (const position of positions) {
    const key = `${position.token0.toLowerCase()}:${position.token1.toLowerCase()}:${position.fee}`;
    if (pools.has(key)) continue;
    const pairAddress = await client.readContract({
      address: v3FactoryAddress, abi: uniswapV3FactoryAbi, functionName: "getPool",
      args: [position.token0, position.token1, position.fee]
    });
    if (pairAddress === zeroAddress) throw new Error("V3 position pool was not found.");
    const [tokenA, tokenB] = await Promise.all([resolveToken(position.token0), resolveToken(position.token1)]);
    // One candidate per pool: PoolCard renders every owned NFT in that pool.
    pools.set(key, { pairAddress, tokenA, tokenB, protocol: "V3", fee: position.fee });
  }
  return [...pools.values()];
}
