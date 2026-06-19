import { useState } from "react";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { v4PositionManagerAbi } from "../lib/abis";
import { v4PositionManagerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { encodeV4DecreaseActions } from "../lib/v4";
import type { V4PositionInfo } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useRemoveV4Liquidity(deadlineMinutes = 20) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const [prepareError, setPrepareError] = useState<unknown>();
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  async function modify(position: V4PositionInfo, percent: number, minimums: { amount0Min: bigint; amount1Min: bigint } = { amount0Min: 0n, amount1Min: 0n }) {
    if (!address || !publicClient) return;
    const normalized = Math.min(100, Math.max(0, Math.round(percent)));
    const liquidity = position.liquidity * BigInt(normalized) / 100n;
    const unlockData = encodeV4DecreaseActions({
      tokenId: position.tokenId,
      liquidity,
      amount0Min: minimums.amount0Min,
      amount1Min: minimums.amount1Min,
      poolKey: position.poolKey,
      recipient: address
    });
    try {
      setPrepareError(undefined);
      const gasPrice = await publicClient.getGasPrice();
      write.writeContract({
        address: v4PositionManagerAddress,
        abi: v4PositionManagerAbi,
        functionName: "modifyLiquidities",
        args: [unlockData, BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60)],
        gasPrice,
        type: "legacy"
      });
    } catch (error) {
      setPrepareError(error);
    }
  }

  const error = prepareError || write.error || receipt.error;
  return {
    removeLiquidity: (position: V4PositionInfo, percent: number, minimums?: { amount0Min: bigint; amount1Min: bigint }) => modify(position, percent, minimums),
    collectFees: (position: V4PositionInfo) => modify(position, 0),
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    readableError: error ? getReadableError(error) : undefined
  };
}
