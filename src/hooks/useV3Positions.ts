import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { nonfungiblePositionManagerAbi } from "../lib/abis";
import { v3PositionManagerAddress } from "../lib/contracts";
import { isSameRouterToken } from "../lib/routerTokens";
import { sortV3Tokens } from "../lib/v3Routing";
import type { Token, V3PositionInfo } from "../types/token";

export function useV3Positions(tokenA?: Token, tokenB?: Token, fee?: number) {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["v3-positions", chainId, address, tokenA?.address, tokenB?.address, fee ?? "all"],
    enabled: Boolean(publicClient && address && tokenA && tokenB && !isSameRouterToken(tokenA, tokenB)),
    staleTime: 12_000,
    queryFn: async (): Promise<V3PositionInfo[]> => {
      if (!publicClient || !address || !tokenA || !tokenB) return [];
      const balance = await publicClient.readContract({
        address: v3PositionManagerAddress,
        abi: nonfungiblePositionManagerAbi,
        functionName: "balanceOf",
        args: [address]
      });
      const count = Number(balance > 50n ? 50n : balance);
      if (!count) return [];
      const tokenIds = await Promise.all(Array.from({ length: count }, (_, index) => publicClient.readContract({
        address: v3PositionManagerAddress,
        abi: nonfungiblePositionManagerAbi,
        functionName: "tokenOfOwnerByIndex",
        args: [address, BigInt(index)]
      })));
      const positions = await Promise.all(tokenIds.map(async (tokenId) => {
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
      const sorted = sortV3Tokens(tokenA, tokenB);
      return positions.filter((position) => (
        position.token0.toLowerCase() === sorted.token0Address.toLowerCase() &&
        position.token1.toLowerCase() === sorted.token1Address.toLowerCase() &&
        (fee === undefined || position.fee === fee)
      ));
    }
  });
}
