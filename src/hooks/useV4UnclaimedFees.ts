import { useQuery } from "@tanstack/react-query";
import { pad, toHex } from "viem";
import { useChainId, usePublicClient } from "wagmi";
import { v4StateViewAbi } from "../lib/abis";
import { v4PositionManagerAddress, v4StateViewAddress } from "../lib/contracts";
import { calculateAccruedFees } from "../lib/liquidityFees";
import { getV4PoolId } from "../lib/v4";
import type { V4PositionInfo } from "../types/token";

export function useV4UnclaimedFees(position?: V4PositionInfo) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const poolId = position ? getV4PoolId(position.poolKey) : undefined;

  return useQuery({
    queryKey: ["v4-unclaimed-fees", chainId, poolId, position?.tokenId.toString()],
    enabled: Boolean(publicClient && poolId && position),
    staleTime: 12_000,
    queryFn: async () => {
      if (!publicClient || !poolId || !position) return undefined;
      const salt = pad(toHex(position.tokenId), { size: 32 });
      const [current, snapshot] = await Promise.all([
        publicClient.readContract({
          address: v4StateViewAddress,
          abi: v4StateViewAbi,
          functionName: "getFeeGrowthInside",
          args: [poolId, position.tickLower, position.tickUpper]
        }),
        publicClient.readContract({
          address: v4StateViewAddress,
          abi: v4StateViewAbi,
          functionName: "getPositionInfo",
          args: [poolId, v4PositionManagerAddress, position.tickLower, position.tickUpper, salt]
        })
      ]);
      return calculateAccruedFees({
        liquidity: snapshot[0],
        feeGrowthInside0X128: current[0],
        feeGrowthInside1X128: current[1],
        feeGrowthInside0LastX128: snapshot[1],
        feeGrowthInside1LastX128: snapshot[2]
      });
    }
  });
}
