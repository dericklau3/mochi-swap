import { encodeFunctionData, parseUnits } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { quoterV2Abi, swapRouterV3Abi, uniswapV2RouterAbi } from "../lib/abis";
import { routerAddress, v3QuoterAddress, v3SwapRouterAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { isSameRouterToken, toRouterPath } from "../lib/routerTokens";
import { applySlippage, chooseBestSwapRoute, v3FeeOptions, type SwapRouteQuote } from "../lib/v3Routing";
import type { Token } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export type BestSwapQuote = SwapRouteQuote & { amountOut: bigint };

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
    const quotes: SwapRouteQuote[] = await Promise.all([
      publicClient.readContract({
        address: routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: "getAmountsOut",
        args: [amountIn, path]
      }).then((amounts): SwapRouteQuote => ({ protocol: "V2", amountOut: amounts[amounts.length - 1] })).catch((): SwapRouteQuote => ({ protocol: "V2" })),
      ...v3FeeOptions.map((option) => publicClient.readContract({
        address: v3QuoterAddress,
        abi: quoterV2Abi,
        functionName: "quoteExactInputSingle",
        args: [{
          tokenIn: path[0],
          tokenOut: path[1],
          amountIn,
          fee: option.fee,
          sqrtPriceLimitX96: 0n
        }]
      }).then((result): SwapRouteQuote => ({ protocol: "V3", fee: option.fee, amountOut: result[0] })).catch((): SwapRouteQuote => ({ protocol: "V3", fee: option.fee })))
    ]);
    return chooseBestSwapRoute(quotes) as BestSwapQuote | undefined;
  }

  function swap(amount: string, quote: BestSwapQuote) {
    if (!address || !from || !to) return;
    if (isSameRouterToken(from, to)) return;
    const amountIn = parseUnits(amount || "0", from.decimals);
    const minOut = applySlippage(quote.amountOut, slippageBps);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    const path = toRouterPath(from, to);
    if (quote.protocol === "V3") {
      const params = {
        tokenIn: path[0],
        tokenOut: path[1],
        fee: quote.fee,
        recipient: to.isNative ? v3SwapRouterAddress : address,
        deadline,
        amountIn,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0n
      };
      if (to.isNative) {
        const swapCall = encodeFunctionData({
          abi: swapRouterV3Abi,
          functionName: "exactInputSingle",
          args: [params]
        });
        const unwrapCall = encodeFunctionData({
          abi: swapRouterV3Abi,
          functionName: "unwrapWETH9",
          args: [minOut, address]
        });
        write.writeContract({
          address: v3SwapRouterAddress,
          abi: swapRouterV3Abi,
          functionName: "multicall",
          args: [[swapCall, unwrapCall]],
          value: from.isNative ? amountIn : undefined
        });
        return;
      }
      write.writeContract({
        address: v3SwapRouterAddress,
        abi: swapRouterV3Abi,
        functionName: "exactInputSingle",
        args: [params],
        value: from.isNative ? amountIn : undefined
      });
      return;
    }
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
