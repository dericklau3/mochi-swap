import { useMemo } from "react";
import type { Address } from "viem";
import { maxUint256 } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20Abi, uniswapV2PairAbi } from "../lib/abis";
import { getReadableError } from "../lib/errors";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useApproveToken(token?: Address, spender?: Address, isLp = false) {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  return useMemo(() => ({
    approve: (amount: bigint = maxUint256) => {
      if (!token || !spender) return;
      write.writeContract({
        address: token,
        abi: isLp ? uniswapV2PairAbi : erc20Abi,
        functionName: "approve",
        args: [spender, amount]
      });
    },
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  }), [isLp, receipt.error, receipt.isLoading, receipt.isSuccess, spender, token, write]);
}
