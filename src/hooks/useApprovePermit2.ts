import { useMemo } from "react";
import { maxUint48, maxUint160, type Address } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { permit2Abi } from "../lib/abis";
import { permit2Address } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useApprovePermit2(token?: Address, spender?: Address) {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  return useMemo(() => ({
    approve: () => {
      if (!token || !spender) return;
      write.writeContract({
        address: permit2Address,
        abi: permit2Abi,
        functionName: "approve",
        args: [token, spender, maxUint160, Number(maxUint48)]
      });
    },
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  }), [receipt.error, receipt.isLoading, receipt.isSuccess, spender, token, write]);
}
