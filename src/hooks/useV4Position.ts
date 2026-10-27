import { supportsV4, targetChain } from "../lib/chains";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { v4PositionManagerAbi } from "../lib/abis";
import { v4PositionManagerAddress } from "../lib/contracts";
import { decodeV4PositionInfo } from "../lib/v4";
import type { V4PositionInfo } from "../types/token";

export function useV4Position(tokenId?: bigint) {
  const chainId = targetChain.id;
  const publicClient = usePublicClient({ chainId: targetChain.id });

  return useQuery({
    queryKey: ["v4-position", chainId, tokenId?.toString()],
    enabled: supportsV4 && Boolean(publicClient && tokenId !== undefined),
    staleTime: 12_000,
    queryFn: async (): Promise<V4PositionInfo | undefined> => {
      if (!publicClient || tokenId === undefined) return undefined;
      const [position, liquidity, owner] = await Promise.all([
        publicClient.readContract({ address: v4PositionManagerAddress, abi: v4PositionManagerAbi, functionName: "getPoolAndPositionInfo", args: [tokenId] }),
        publicClient.readContract({ address: v4PositionManagerAddress, abi: v4PositionManagerAbi, functionName: "getPositionLiquidity", args: [tokenId] }),
        publicClient.readContract({ address: v4PositionManagerAddress, abi: v4PositionManagerAbi, functionName: "ownerOf", args: [tokenId] })
      ]);
      const ticks = decodeV4PositionInfo(position[1]);
      return {
        tokenId,
        poolKey: position[0],
        tickLower: ticks.tickLower,
        tickUpper: ticks.tickUpper,
        liquidity,
        owner
      };
    }
  });
}
