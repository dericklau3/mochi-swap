import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { targetChain } from "../lib/chains";
import { discoverV3Pools } from "../lib/v3WalletPools";
import type { Token } from "../types/token";
import { useV3Positions } from "./useV3Positions";

export function useWalletV3Pools(knownTokens: Token[]) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: targetChain.id });
  const positions = useV3Positions();
  const pools = useQuery({
    queryKey: ["v3-wallet-pools", targetChain.id, address, positions.data?.map((position) => [position.tokenId.toString(), position.token0, position.token1, position.fee]), knownTokens],
    enabled: Boolean(address && publicClient && positions.data),
    staleTime: 12_000,
    queryFn: () => publicClient && positions.data ? discoverV3Pools(publicClient, positions.data, knownTokens) : Promise.resolve([])
  });
  return {
    data: pools.data,
    isLoading: positions.isLoading || pools.isLoading,
    error: positions.error || pools.error,
    refetch: () => { void positions.refetch(); void pools.refetch(); }
  };
}
