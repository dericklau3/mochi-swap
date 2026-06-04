import type { Token } from "../types/token";
import { useMulticallTokenBalances } from "./useMulticallTokenBalances";

export function useTokenBalance(token: Token | undefined) {
  const query = useMulticallTokenBalances(token ? [token] : []);
  return {
    ...query,
    balance: token ? query.data?.[token.address] ?? 0n : 0n
  };
}
