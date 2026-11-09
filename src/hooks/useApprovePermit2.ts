import { supportsV4, targetChain } from "../lib/chains";
import { useMemo } from "react";
import { maxUint160, type Address } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import { permit2Abi } from "../lib/abis";
import { permit2Address } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { useSimulatedWriteContract } from "./useSimulatedWriteContract";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useApprovePermit2(token?: Address, spender?: Address) {
  const write = useSimulatedWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: targetChain.id });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  return useMemo(() => ({
    approve: (amount: bigint) => {
      if (!supportsV4 || !token || !spender || amount <= 0n || amount > maxUint160) return;
      write.writeContract({
        chainId: targetChain.id,
        address: permit2Address,
        abi: permit2Abi,
        functionName: "approve",
        args: [token, spender, amount, Math.floor(Date.now() / 1000) + 60 * 60]
      });
    },
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  }), [receipt.error, receipt.isLoading, receipt.isSuccess, spender, token, write]);
}
