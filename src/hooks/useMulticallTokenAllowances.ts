import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { erc20Abi } from "../lib/abis";
import type { Token } from "../types/token";

export function useMulticallTokenAllowances(tokens: Token[], spender: Address, owner?: Address) {
  const account = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const address = owner ?? account.address;

  return useQuery({
    queryKey: ["token-allowances", chainId, address, spender, tokens.map((t) => t.address).join(",")],
    enabled: Boolean(publicClient && address && spender && tokens.length),
    staleTime: 15_000,
    queryFn: async () => {
      if (!publicClient || !address) return {};
      const allowances: Record<Address, bigint> = {};
      const erc20Tokens = tokens.filter((token) => !token.isNative);
      tokens.filter((token) => token.isNative).forEach((token) => {
        allowances[token.address] = 0n;
      });
      if (!erc20Tokens.length) return allowances;
      try {
        const results = await publicClient.multicall({
          allowFailure: true,
          contracts: erc20Tokens.map((token) => ({
            address: token.address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, spender]
          }))
        });
        results.forEach((result, index) => {
          if (result.status === "success") allowances[erc20Tokens[index].address] = result.result as unknown as bigint;
        });
      } catch {
        await Promise.all(
          erc20Tokens.map(async (token) => {
            try {
              allowances[token.address] = await publicClient.readContract({
                address: token.address,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address, spender]
              });
            } catch {
              allowances[token.address] = 0n;
            }
          })
        );
      }
      return allowances;
    }
  });
}
