import { useQuery } from "@tanstack/react-query";
import { useChainId, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { erc20Abi } from "../lib/abis";
import type { Token } from "../types/token";

type Metadata = Pick<Token, "address" | "name" | "symbol" | "decimals">;

export function useMulticallTokenMetadata(addresses: Address[]) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["token-metadata", chainId, addresses.join(",")],
    enabled: Boolean(publicClient && addresses.length),
    staleTime: 60_000,
    queryFn: async () => {
      if (!publicClient) return [];
      const metadata: Metadata[] = [];
      try {
        const results = await publicClient.multicall({
          allowFailure: true,
          contracts: addresses.flatMap((address) => [
            { address, abi: erc20Abi, functionName: "name" },
            { address, abi: erc20Abi, functionName: "symbol" },
            { address, abi: erc20Abi, functionName: "decimals" }
          ])
        });
        addresses.forEach((address, index) => {
          const [name, symbol, decimals] = results.slice(index * 3, index * 3 + 3);
          if (name?.status === "success" && symbol?.status === "success" && decimals?.status === "success") {
            metadata.push({ address, name: String(name.result), symbol: String(symbol.result), decimals: Number(decimals.result) });
          }
        });
      } catch {
        await Promise.all(
          addresses.map(async (address) => {
            const [name, symbol, decimals] = await Promise.all([
              publicClient.readContract({ address, abi: erc20Abi, functionName: "name" }),
              publicClient.readContract({ address, abi: erc20Abi, functionName: "symbol" }),
              publicClient.readContract({ address, abi: erc20Abi, functionName: "decimals" })
            ]);
            metadata.push({ address, name, symbol, decimals });
          })
        );
      }
      return metadata;
    }
  });
}
