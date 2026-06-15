import type { QueryKey } from "@tanstack/react-query";

const DEX_MUTATION_QUERY_KEYS = new Set([
  "token-balances",
  "token-allowances",
  "permit2-allowance",
  "pair-info",
  "v3-pool-info",
  "v3-position",
  "v3-unclaimed-fees",
  "v4-pool-info",
  "v4-position",
  "v4-unclaimed-fees"
]);

export function shouldInvalidateAfterDexMutation(queryKey: QueryKey) {
  return DEX_MUTATION_QUERY_KEYS.has(String(queryKey[0]));
}
