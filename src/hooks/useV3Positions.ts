import { supportsV3, targetChain } from "../lib/chains";
import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { nonfungiblePositionManagerAbi } from "../lib/abis";
import { v3PositionManagerAddress } from "../lib/contracts";
import { isSameRouterToken } from "../lib/routerTokens";
import { sortV3Tokens } from "../lib/v3Routing";
import type { Token, V3PositionInfo } from "../types/token";

export function useV3Positions(tokenA?: Token, tokenB?: Token, fee?: number, enabled = true) {
  const chainId = targetChain.id;
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: targetChain.id });

  return useQuery({
    queryKey: ["v3-positions", chainId, address],
    enabled: supportsV3 && enabled && Boolean(publicClient && address) && (!tokenA || !tokenB || !isSameRouterToken(tokenA, tokenB)),
    staleTime: 12_000,
    queryFn: async (): Promise<V3PositionInfo[]> => {
      if (!publicClient || !address) return [];
      const balance = await publicClient.readContract({
        address: v3PositionManagerAddress,
        abi: nonfungiblePositionManagerAbi,
        functionName: "balanceOf",
        args: [address]
      });
      const positions: V3PositionInfo[] = [];
      // Read every NFT, in bounded batches so large wallets do not flood the RPC.
      for (let start = 0n; start < balance; start += 20n) {
        const count = Number(balance - start > 20n ? 20n : balance - start);
        const batch = await Promise.all(Array.from({ length: count }, async (_, index) => {
          const tokenId = await publicClient.readContract({
            address: v3PositionManagerAddress,
            abi: nonfungiblePositionManagerAbi,
            functionName: "tokenOfOwnerByIndex",
            args: [address, start + BigInt(index)]
          });
          const raw = await publicClient.readContract({
            address: v3PositionManagerAddress,
            abi: nonfungiblePositionManagerAbi,
            functionName: "positions",
            args: [tokenId]
          });
          return {
            tokenId,
            token0: raw[2],
            token1: raw[3],
            fee: raw[4],
            tickLower: raw[5],
            tickUpper: raw[6],
            liquidity: raw[7],
            feeGrowthInside0LastX128: raw[8],
            feeGrowthInside1LastX128: raw[9],
            tokensOwed0: raw[10],
            tokensOwed1: raw[11]
          } satisfies V3PositionInfo;
        }));
        positions.push(...batch);
      }
      return positions;
    },
    select: (positions) => {
      if (!tokenA && !tokenB) return positions;
      if (!tokenA || !tokenB) return [];
      const sorted = sortV3Tokens(tokenA, tokenB);
      return positions.filter((position) => (
        position.token0.toLowerCase() === sorted.token0Address.toLowerCase() &&
        position.token1.toLowerCase() === sorted.token1Address.toLowerCase() &&
        (fee === undefined || position.fee === fee)
      ));
    }
  });
}
