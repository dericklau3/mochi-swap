import { useQuery } from "@tanstack/react-query";
import { useChainId, usePublicClient } from "wagmi";
import { v4StateViewAbi } from "../lib/abis";
import { v4StateViewAddress } from "../lib/contracts";
import { getV4PoolId } from "../lib/v4";
import type { V4PoolKey } from "../types/token";

export function useV4PoolInfo(poolKey?: V4PoolKey) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const poolId = poolKey ? getV4PoolId(poolKey) : undefined;

  return useQuery({
    queryKey: ["v4-pool-info", chainId, poolId],
    enabled: Boolean(publicClient && poolId),
    retry: false,
    staleTime: 12_000,
    queryFn: async () => {
      if (!publicClient || !poolId) return undefined;
      const [slot0, liquidity] = await Promise.all([
        publicClient.readContract({ address: v4StateViewAddress, abi: v4StateViewAbi, functionName: "getSlot0", args: [poolId] }),
        publicClient.readContract({ address: v4StateViewAddress, abi: v4StateViewAbi, functionName: "getLiquidity", args: [poolId] })
      ]);
      return {
        poolId,
        sqrtPriceX96: slot0[0],
        tick: slot0[1],
        protocolFee: slot0[2],
        lpFee: slot0[3],
        liquidity,
        initialized: slot0[0] > 0n
      };
    }
  });
}
