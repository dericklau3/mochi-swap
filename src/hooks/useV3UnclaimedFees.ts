import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useChainId, usePublicClient } from "wagmi";
import { uniswapV3PoolAbi } from "../lib/abis";
import { calculateV3FeeGrowthInside, calculateV3UnclaimedFees } from "../lib/liquidityFees";
import type { V3PositionInfo } from "../types/token";

export function useV3UnclaimedFees(poolAddress?: Address | null, position?: V3PositionInfo) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["v3-unclaimed-fees", chainId, poolAddress, position?.tokenId.toString()],
    enabled: Boolean(publicClient && poolAddress && position),
    staleTime: 12_000,
    queryFn: async () => {
      if (!publicClient || !poolAddress || !position) return undefined;
      const [slot0, feeGrowthGlobal0X128, feeGrowthGlobal1X128, lower, upper] = await Promise.all([
        publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolAbi, functionName: "slot0" }),
        publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolAbi, functionName: "feeGrowthGlobal0X128" }),
        publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolAbi, functionName: "feeGrowthGlobal1X128" }),
        publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolAbi, functionName: "ticks", args: [position.tickLower] }),
        publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolAbi, functionName: "ticks", args: [position.tickUpper] })
      ]);
      const current = calculateV3FeeGrowthInside({
        currentTick: slot0[1],
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        feeGrowthGlobal0X128,
        feeGrowthGlobal1X128,
        feeGrowthOutsideLower0X128: lower[2],
        feeGrowthOutsideLower1X128: lower[3],
        feeGrowthOutsideUpper0X128: upper[2],
        feeGrowthOutsideUpper1X128: upper[3]
      });
      return calculateV3UnclaimedFees({
        liquidity: position.liquidity,
        ...current,
        feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
        feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
        tokensOwed0: position.tokensOwed0,
        tokensOwed1: position.tokensOwed1
      });
    }
  });
}
