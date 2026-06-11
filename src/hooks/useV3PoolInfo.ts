import { useQuery } from "@tanstack/react-query";
import { zeroAddress, type Address } from "viem";
import { useChainId, usePublicClient } from "wagmi";
import { uniswapV3FactoryAbi, uniswapV3PoolAbi } from "../lib/abis";
import { v3FactoryAddress } from "../lib/contracts";
import { isSameRouterToken } from "../lib/routerTokens";
import { getV3FeeOption, sortV3Tokens } from "../lib/v3Routing";
import type { Token } from "../types/token";

export type V3PoolInfo = {
  address: Address | null;
  fee: number;
  sqrtPriceX96?: bigint;
  tick?: number;
  liquidity?: bigint;
};

export function useV3PoolInfo(tokenA?: Token, tokenB?: Token, feeLabel: string | number = "0.3%") {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const fee = getV3FeeOption(feeLabel).fee;

  return useQuery({
    queryKey: ["v3-pool-info", chainId, tokenA?.address, tokenB?.address, fee],
    enabled: Boolean(publicClient && tokenA && tokenB && !isSameRouterToken(tokenA, tokenB)),
    staleTime: 12_000,
    queryFn: async (): Promise<V3PoolInfo> => {
      if (!publicClient || !tokenA || !tokenB) return { address: null, fee };
      const { token0Address, token1Address } = sortV3Tokens(tokenA, tokenB);
      const pool = await publicClient.readContract({
        address: v3FactoryAddress,
        abi: uniswapV3FactoryAbi,
        functionName: "getPool",
        args: [token0Address, token1Address, fee]
      }) as Address;
      if (!pool || pool === zeroAddress) return { address: null, fee };
      const [slot0, liquidity] = await Promise.all([
        publicClient.readContract({ address: pool, abi: uniswapV3PoolAbi, functionName: "slot0" }),
        publicClient.readContract({ address: pool, abi: uniswapV3PoolAbi, functionName: "liquidity" }) as Promise<bigint>
      ]);
      return {
        address: pool,
        fee,
        sqrtPriceX96: slot0[0],
        tick: slot0[1],
        liquidity
      };
    }
  });
}
