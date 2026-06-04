import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { erc20Abi, uniswapV2FactoryAbi, uniswapV2PairAbi } from "../lib/abis";
import { factoryAddress, routerAddress } from "../lib/contracts";
import { isSameRouterToken, toRouterTokenAddress } from "../lib/routerTokens";
import type { PairInfo, Token } from "../types/token";

export function useMulticallPairInfo(tokenA?: Token, tokenB?: Token) {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["pair-info", chainId, address, tokenA?.address, tokenB?.address],
    enabled: Boolean(publicClient && tokenA && tokenB && !isSameRouterToken(tokenA, tokenB)),
    staleTime: 12_000,
    queryFn: async (): Promise<PairInfo> => {
      if (!publicClient || !tokenA || !tokenB) return { address: null, error: "pair not found" };
      const pair = await publicClient.readContract({
        address: factoryAddress,
        abi: uniswapV2FactoryAbi,
        functionName: "getPair",
        args: [toRouterTokenAddress(tokenA), toRouterTokenAddress(tokenB)]
      }) as Address;

      if (!pair || pair === zeroAddress) return { address: null, error: "pair not found" };

      const readPairDetails = async (): Promise<PairInfo> => {
        const [token0, token1, reserves, totalSupply, lpBalance, lpAllowance] = await Promise.all([
          publicClient.readContract({ address: pair, abi: uniswapV2PairAbi, functionName: "token0" }) as Promise<Address>,
          publicClient.readContract({ address: pair, abi: uniswapV2PairAbi, functionName: "token1" }) as Promise<Address>,
          publicClient.readContract({ address: pair, abi: uniswapV2PairAbi, functionName: "getReserves" }) as Promise<readonly [bigint, bigint, number]>,
          publicClient.readContract({ address: pair, abi: uniswapV2PairAbi, functionName: "totalSupply" }) as Promise<bigint>,
          address ? publicClient.readContract({ address: pair, abi: erc20Abi, functionName: "balanceOf", args: [address] }) as Promise<bigint> : Promise.resolve(0n),
          address ? publicClient.readContract({ address: pair, abi: erc20Abi, functionName: "allowance", args: [address, routerAddress] }) as Promise<bigint> : Promise.resolve(0n)
        ]);
        return {
          address: pair,
          token0,
          token1,
          reserve0: reserves[0],
          reserve1: reserves[1],
          totalSupply,
          lpBalance,
          lpAllowance
        };
      };

      try {
        const contracts = [
          { address: pair, abi: uniswapV2PairAbi, functionName: "token0" },
          { address: pair, abi: uniswapV2PairAbi, functionName: "token1" },
          { address: pair, abi: uniswapV2PairAbi, functionName: "getReserves" },
          { address: pair, abi: uniswapV2PairAbi, functionName: "totalSupply" },
          ...(address ? [
            { address: pair, abi: erc20Abi, functionName: "balanceOf", args: [address] },
            { address: pair, abi: erc20Abi, functionName: "allowance", args: [address, routerAddress] }
          ] : [])
        ];
        const results = await publicClient.multicall({
          allowFailure: true,
          contracts: contracts as never
        }) as unknown as Array<{ status: "success"; result: unknown } | { status: "failure"; error: unknown }>;
        const token0Result = results[0];
        const token1Result = results[1];
        const reservesResult = results[2];
        const totalSupplyResult = results[3];
        const hasCoreData = token0Result?.status === "success" && token1Result?.status === "success" && reservesResult?.status === "success" && totalSupplyResult?.status === "success";
        if (!hasCoreData) return await readPairDetails();
        const reserves = reservesResult.result as readonly [bigint, bigint, number];
        return {
          address: pair,
          token0: token0Result.result as Address,
          token1: token1Result.result as Address,
          reserve0: reserves[0],
          reserve1: reserves[1],
          totalSupply: totalSupplyResult.result as bigint,
          lpBalance: results[4]?.status === "success" ? results[4].result as bigint : 0n,
          lpAllowance: results[5]?.status === "success" ? results[5].result as bigint : 0n
        };
      } catch {
        return await readPairDetails();
      }
    }
  });
}
