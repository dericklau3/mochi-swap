import type { QueryKey } from "@tanstack/react-query";

const DEX_MUTATION_QUERY_KEYS = new Set([
  "token-balances",
  "token-allowances",
  "permit2-allowance",
  "pair-info",
  "v4-pool-info",
  "v4-position"
]);

export function shouldInvalidateAfterDexMutation(queryKey: QueryKey) {
  return DEX_MUTATION_QUERY_KEYS.has(String(queryKey[0]));
}
