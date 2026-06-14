import { encodeFunctionData, parseUnits, type Hex } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { v4PositionManagerAbi } from "../lib/abis";
import { v4PositionManagerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import type { Permit2PermitBatch } from "../lib/permit2";
import {
  buildV4PoolKey,
  encodeV4IncreaseActions,
  encodeV4MintActions,
  getV4CustomRangeTicks,
  getV4FullRangeTicks,
  getV4InitialSqrtPriceX96,
  getV4LiquidityForAmounts,
  sortV4Tokens
} from "../lib/v4";
import type { Token, V4PoolKey } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useAddV4Liquidity({
  tokenA,
  tokenB,
  fee,
  poolKey: existingPoolKey,
  sqrtPriceX96,
  initialPrice,
  initialPriceDirection,
  rangeMode,
  minPrice,
  maxPrice,
  positionTokenId,
  tickLower: existingTickLower,
  tickUpper: existingTickUpper,
  deadlineMinutes
}: {
  tokenA?: Token;
  tokenB?: Token;
  fee: number;
  poolKey?: V4PoolKey;
  sqrtPriceX96?: bigint;
  initialPrice: string;
  initialPriceDirection: "base" | "quote";
  rangeMode: "full" | "custom";
  minPrice: string;
  maxPrice: string;
  positionTokenId?: bigint;
  tickLower?: number;
  tickUpper?: number;
  deadlineMinutes: number;
}) {
  const { address } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  function addLiquidity(amountA: string, amountB: string, permit?: { batch: Permit2PermitBatch; signature: Hex }) {
    if (!address || !tokenA || !tokenB) return;
    const amountAValue = parseUnits(amountA || "0", tokenA.decimals);
    const amountBValue = parseUnits(amountB || "0", tokenB.decimals);
    const sorted = sortV4Tokens(tokenA, tokenB);
    const amount0Max = sorted.aIsCurrency0 ? amountAValue : amountBValue;
    const amount1Max = sorted.aIsCurrency0 ? amountBValue : amountAValue;
    const poolKey = existingPoolKey ?? buildV4PoolKey(tokenA, tokenB, fee);
    const ticks = existingTickLower !== undefined && existingTickUpper !== undefined
      ? { tickLower: existingTickLower, tickUpper: existingTickUpper }
      : rangeMode === "custom"
        ? getV4CustomRangeTicks({ tokenA, tokenB, minPrice, maxPrice, direction: initialPriceDirection, fee })
        : getV4FullRangeTicks(fee);
    const effectiveSqrtPrice = sqrtPriceX96 || getV4InitialSqrtPriceX96({ tokenA, tokenB, price: initialPrice, direction: initialPriceDirection });
    if (effectiveSqrtPrice <= 0n) return;
    const liquidity = getV4LiquidityForAmounts({ sqrtPriceX96: effectiveSqrtPrice, ...ticks, amount0: amount0Max, amount1: amount1Max });
    if (liquidity <= 0n) return;
    const unlockData = positionTokenId === undefined
      ? encodeV4MintActions({ poolKey, ...ticks, liquidity, amount0Max, amount1Max, owner: address })
      : encodeV4IncreaseActions({ tokenId: positionTokenId, liquidity, amount0Max, amount1Max, poolKey, recipient: address });
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    const modifyCall = encodeFunctionData({
      abi: v4PositionManagerAbi,
      functionName: "modifyLiquidities",
      args: [unlockData, deadline]
    });
    const value = poolKey.currency0 === "0x0000000000000000000000000000000000000000"
      ? amount0Max
      : poolKey.currency1 === "0x0000000000000000000000000000000000000000"
        ? amount1Max
        : undefined;
    const calls = permit ? [encodeFunctionData({
      abi: v4PositionManagerAbi,
      functionName: "permitBatch",
      args: [address, permit.batch, permit.signature]
    })] : [];

    if (!sqrtPriceX96 && positionTokenId === undefined) {
      const initializeCall = encodeFunctionData({
        abi: v4PositionManagerAbi,
        functionName: "initializePool",
        args: [poolKey, effectiveSqrtPrice]
      });
      calls.push(initializeCall);
    }
    calls.push(modifyCall);
    if (calls.length > 1) {
      write.writeContract({
        address: v4PositionManagerAddress,
        abi: v4PositionManagerAbi,
        functionName: "multicall",
        args: [calls],
        value
      });
      return;
    }
    write.writeContract({
      address: v4PositionManagerAddress,
      abi: v4PositionManagerAbi,
      functionName: "modifyLiquidities",
      args: [unlockData, deadline],
      value
    });
  }

  return {
    addLiquidity,
    hash: write.data,
    receipt: receipt.data,
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error || receipt.error,
    readableError: write.error || receipt.error ? getReadableError(write.error || receipt.error) : undefined
  };
}
