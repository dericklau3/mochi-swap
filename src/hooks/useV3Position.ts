import { useQuery } from "@tanstack/react-query";
import { useChainId, usePublicClient } from "wagmi";
import { nonfungiblePositionManagerAbi } from "../lib/abis";
import { v3PositionManagerAddress } from "../lib/contracts";
import type { V3PositionInfo } from "../types/token";

export function useV3Position(tokenId?: bigint) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["v3-position", chainId, tokenId?.toString()],
    enabled: Boolean(publicClient && tokenId !== undefined),
    staleTime: 12_000,
    queryFn: async (): Promise<V3PositionInfo | undefined> => {
      if (!publicClient || tokenId === undefined) return undefined;
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
        tokensOwed0: raw[10],
        tokensOwed1: raw[11]
      };
    }
  });
}
