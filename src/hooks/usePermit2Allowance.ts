import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { permit2Abi } from "../lib/abis";
import { permit2Address } from "../lib/contracts";

export function usePermit2Allowance(token?: Address, spender?: Address) {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["permit2-allowance", chainId, address, token, spender],
    enabled: Boolean(publicClient && address && token && spender),
    staleTime: 12_000,
    queryFn: async () => {
      if (!publicClient || !address || !token || !spender) return undefined;
      const result = await publicClient.readContract({
        address: permit2Address,
        abi: permit2Abi,
        functionName: "allowance",
        args: [address, token, spender]
      });
      return { amount: result[0], expiration: result[1], nonce: result[2] };
    }
  });
}
