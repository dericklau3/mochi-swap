import { parseUnits } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { uniswapV2RouterAbi } from "../lib/abis";
import { routerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { isSameRouterToken, toRouterPath } from "../lib/routerTokens";
import type { Token } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useSwap(from?: Token, to?: Token, slippageBps = 50, deadlineMinutes = 20) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  async function quote(amount: string) {
    if (!publicClient || !from || !to || !amount) return undefined;
    if (isSameRouterToken(from, to)) return undefined;
    const amountIn = parseUnits(amount, from.decimals);
    const path = toRouterPath(from, to);
    const amounts = await publicClient.readContract({
      address: routerAddress,
      abi: uniswapV2RouterAbi,
      functionName: "getAmountsOut",
      args: [amountIn, path]
    });
    return amounts[amounts.length - 1];
  }

  function swap(amount: string, quotedOut: bigint) {
    if (!address || !from || !to) return;
    if (isSameRouterToken(from, to)) return;
    const amountIn = parseUnits(amount || "0", from.decimals);
    const minOut = quotedOut - (quotedOut * BigInt(slippageBps)) / 10_000n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    const path = toRouterPath(from, to);
    if (from.isNative) {
      write.writeContract({
        address: routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: "swapExactETHForTokens",
        args: [minOut, path, address, deadline],
        value: amountIn
      });
      return;
    }
    if (to.isNative) {
      write.writeContract({
        address: routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: "swapExactTokensForETH",
        args: [amountIn, minOut, path, address, deadline]
      });
      return;
    }
    write.writeContract({
      address: routerAddress,
      abi: uniswapV2RouterAbi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, minOut, path, address, deadline]
    });
  }

  return {
    quote,
    swap,
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  };
}
