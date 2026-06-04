import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Hash } from "viem";
import { shouldInvalidateAfterDexMutation } from "../lib/queryInvalidation";

export function useInvalidateDexQueries(hash: Hash | undefined, isSuccess: boolean) {
  const queryClient = useQueryClient();
  const lastInvalidated = useRef<Hash>();

  useEffect(() => {
    if (!hash || !isSuccess || lastInvalidated.current === hash) return;
    lastInvalidated.current = hash;
    void queryClient.invalidateQueries({
      predicate: (query) => shouldInvalidateAfterDexMutation(query.queryKey)
    });
  }, [hash, isSuccess, queryClient]);
}
