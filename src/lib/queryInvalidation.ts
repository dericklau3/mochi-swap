import type { QueryKey } from "@tanstack/react-query";

const DEX_MUTATION_QUERY_KEYS = new Set(["token-balances", "token-allowances", "pair-info"]);

export function shouldInvalidateAfterDexMutation(queryKey: QueryKey) {
  return DEX_MUTATION_QUERY_KEYS.has(String(queryKey[0]));
}
