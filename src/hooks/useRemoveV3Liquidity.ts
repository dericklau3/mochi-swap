import { encodeFunctionData, maxUint128 } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { nonfungiblePositionManagerAbi } from "../lib/abis";
import { v3PositionManagerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import type { V3PositionInfo } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useRemoveV3Liquidity(deadlineMinutes = 20) {
  const { address } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  function removeLiquidity(position: V3PositionInfo, percent: number) {
    if (!address || position.liquidity <= 0n) return;
    const normalizedPercent = Math.min(100, Math.max(0, Math.round(percent)));
    const liquidity = position.liquidity * BigInt(normalizedPercent) / 100n;
    if (liquidity <= 0n) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    const decreaseCall = encodeFunctionData({
      abi: nonfungiblePositionManagerAbi,
      functionName: "decreaseLiquidity",
      args: [{
        tokenId: position.tokenId,
        liquidity,
        amount0Min: 0n,
        amount1Min: 0n,
        deadline
      }]
    });
    const collectCall = encodeFunctionData({
      abi: nonfungiblePositionManagerAbi,
      functionName: "collect",
      args: [{
        tokenId: position.tokenId,
        recipient: address,
        amount0Max: maxUint128,
        amount1Max: maxUint128
      }]
    });
    write.writeContract({
      address: v3PositionManagerAddress,
      abi: nonfungiblePositionManagerAbi,
      functionName: "multicall",
      args: [[decreaseCall, collectCall]]
    });
  }

  return {
    removeLiquidity,
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  };
}
