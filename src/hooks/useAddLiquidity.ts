import { parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { uniswapV2RouterAbi } from "../lib/abis";
import { routerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { isSameRouterToken, toRouterTokenAddress } from "../lib/routerTokens";
import type { Token } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useAddLiquidity(tokenA?: Token, tokenB?: Token, slippageBps = 50, deadlineMinutes = 20) {
  const { address } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  function addLiquidity(amountA: string, amountB: string) {
    if (!address || !tokenA || !tokenB) return;
    if (isSameRouterToken(tokenA, tokenB)) return;
    const desiredA = parseUnits(amountA || "0", tokenA.decimals);
    const desiredB = parseUnits(amountB || "0", tokenB.decimals);
    const minA = desiredA - (desiredA * BigInt(slippageBps)) / 10_000n;
    const minB = desiredB - (desiredB * BigInt(slippageBps)) / 10_000n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    if (tokenA.isNative || tokenB.isNative) {
      const erc20Token = tokenA.isNative ? tokenB : tokenA;
      const desiredNative = tokenA.isNative ? desiredA : desiredB;
      const desiredToken = tokenA.isNative ? desiredB : desiredA;
      const minNative = tokenA.isNative ? minA : minB;
      const minToken = tokenA.isNative ? minB : minA;
      write.writeContract({
        address: routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: "addLiquidityETH",
        args: [toRouterTokenAddress(erc20Token), desiredToken, minToken, minNative, address, deadline],
        value: desiredNative
      });
      return;
    }
    write.writeContract({
      address: routerAddress,
      abi: uniswapV2RouterAbi,
      functionName: "addLiquidity",
      args: [toRouterTokenAddress(tokenA), toRouterTokenAddress(tokenB), desiredA, desiredB, minA, minB, address, deadline]
    });
  }

  return {
    addLiquidity,
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  };
}
