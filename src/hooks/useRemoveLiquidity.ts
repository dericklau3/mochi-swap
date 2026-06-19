import type { Hex } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { uniswapV2RouterAbi } from "../lib/abis";
import { routerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { isSameRouterToken, toRouterTokenAddress } from "../lib/routerTokens";
import type { Token } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useRemoveLiquidity(tokenA?: Token, tokenB?: Token, deadlineMinutes = 20) {
  const { address } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  function removeLiquidity(lpAmount: bigint, minimums: { amountAMin: bigint; amountBMin: bigint } = { amountAMin: 0n, amountBMin: 0n }) {
    if (!address || !tokenA || !tokenB) return;
    if (isSameRouterToken(tokenA, tokenB)) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    if (tokenA.isNative || tokenB.isNative) {
      const erc20Token = tokenA.isNative ? tokenB : tokenA;
      const amountTokenMin = tokenA.isNative ? minimums.amountBMin : minimums.amountAMin;
      const amountETHMin = tokenA.isNative ? minimums.amountAMin : minimums.amountBMin;
      write.writeContract({
        address: routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: "removeLiquidityETH",
        args: [toRouterTokenAddress(erc20Token), lpAmount, amountTokenMin, amountETHMin, address, deadline]
      });
      return;
    }
    write.writeContract({
      address: routerAddress,
      abi: uniswapV2RouterAbi,
      functionName: "removeLiquidity",
      args: [toRouterTokenAddress(tokenA), toRouterTokenAddress(tokenB), lpAmount, minimums.amountAMin, minimums.amountBMin, address, deadline]
    });
  }

  function removeLiquidityWithPermit(lpAmount: bigint, permit: { deadline: bigint; approveMax: boolean; v: number; r: Hex; s: Hex }, minimums: { amountAMin: bigint; amountBMin: bigint } = { amountAMin: 0n, amountBMin: 0n }) {
    if (!address || !tokenA || !tokenB) return;
    if (isSameRouterToken(tokenA, tokenB)) return;
    if (tokenA.isNative || tokenB.isNative) {
      const erc20Token = tokenA.isNative ? tokenB : tokenA;
      const amountTokenMin = tokenA.isNative ? minimums.amountBMin : minimums.amountAMin;
      const amountETHMin = tokenA.isNative ? minimums.amountAMin : minimums.amountBMin;
      write.writeContract({
        address: routerAddress,
        abi: uniswapV2RouterAbi,
        functionName: "removeLiquidityETHWithPermit",
        args: [toRouterTokenAddress(erc20Token), lpAmount, amountTokenMin, amountETHMin, address, permit.deadline, permit.approveMax, permit.v, permit.r, permit.s]
      });
      return;
    }
    write.writeContract({
      address: routerAddress,
      abi: uniswapV2RouterAbi,
      functionName: "removeLiquidityWithPermit",
      args: [toRouterTokenAddress(tokenA), toRouterTokenAddress(tokenB), lpAmount, minimums.amountAMin, minimums.amountBMin, address, permit.deadline, permit.approveMax, permit.v, permit.r, permit.s]
    });
  }

  return {
    removeLiquidity,
    removeLiquidityWithPermit,
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  };
}
