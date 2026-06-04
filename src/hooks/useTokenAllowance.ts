import type { Address } from "viem";
import type { Token } from "../types/token";
import { useMulticallTokenAllowances } from "./useMulticallTokenAllowances";

export function useTokenAllowance(token: Token | undefined, spender: Address) {
  const query = useMulticallTokenAllowances(token ? [token] : [], spender);
  return {
    ...query,
    allowance: token ? query.data?.[token.address] ?? 0n : 0n
  };
}
