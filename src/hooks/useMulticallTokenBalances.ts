import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { erc20Abi } from "../lib/abis";
import type { Token } from "../types/token";

export function useMulticallTokenBalances(tokens: Token[], owner?: Address) {
  const account = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const address = owner ?? account.address;

  return useQuery({
    queryKey: ["token-balances", chainId, address, tokens.map((t) => t.address).join(",")],
    enabled: Boolean(publicClient && address && tokens.length),
    staleTime: 15_000,
    queryFn: async () => {
      if (!publicClient || !address) return {};
      const balances: Record<Address, bigint> = {};
      const nativeTokens = tokens.filter((token) => token.isNative);
      const erc20Tokens = tokens.filter((token) => !token.isNative);
      await Promise.all(nativeTokens.map(async (token) => {
        balances[token.address] = await publicClient.getBalance({ address });
      }));
      if (!erc20Tokens.length) return balances;
      try {
        const results = await publicClient.multicall({
          allowFailure: true,
          contracts: erc20Tokens.map((token) => ({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address]
          }))
        });
        results.forEach((result, index) => {
          if (result.status === "success") balances[erc20Tokens[index].address] = result.result as unknown as bigint;
        });
      } catch {
        await Promise.all(
          erc20Tokens.map(async (token) => {
            try {
              balances[token.address] = await publicClient.readContract({
                address: token.address,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address]
              });
            } catch {
              balances[token.address] = 0n;
            }
          })
        );
      }
      return balances;
    }
  });
}
