import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { v4PositionManagerAbi } from "../lib/abis";
import { v4PositionManagerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { encodeV4DecreaseActions } from "../lib/v4";
import type { V4PositionInfo } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useRemoveV4Liquidity(deadlineMinutes = 20) {
  const { address } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  function modify(position: V4PositionInfo, percent: number) {
    if (!address) return;
    const normalized = Math.min(100, Math.max(0, Math.round(percent)));
    const liquidity = position.liquidity * BigInt(normalized) / 100n;
    const unlockData = encodeV4DecreaseActions({
      tokenId: position.tokenId,
      liquidity,
      amount0Min: 0n,
      amount1Min: 0n,
      poolKey: position.poolKey,
      recipient: address
    });
    write.writeContract({
      address: v4PositionManagerAddress,
      abi: v4PositionManagerAbi,
      functionName: "modifyLiquidities",
      args: [unlockData, BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60)]
    });
  }

  return {
    removeLiquidity: (position: V4PositionInfo, percent: number) => modify(position, percent),
    collectFees: (position: V4PositionInfo) => modify(position, 0),
    hash: write.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  };
}
