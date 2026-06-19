import { encodeFunctionData, parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { nonfungiblePositionManagerAbi } from "../lib/abis";
import { v3PositionManagerAddress } from "../lib/contracts";
import { getReadableError } from "../lib/errors";
import { getV3CustomRangeTicks, getV3FeeOption, getV3FullRangeTicks, getV3InitialSqrtPriceX96, getV3MintAmountMinimums, sortV3Tokens } from "../lib/v3Routing";
import type { Token } from "../types/token";
import { useInvalidateDexQueries } from "./useInvalidateDexQueries";

export function useAddV3Liquidity({
  tokenA,
  tokenB,
  feeLabel,
  poolExists,
  initialPrice,
  initialPriceDirection,
  rangeMode,
  minPrice,
  maxPrice,
  positionTokenId,
  slippageBps,
  deadlineMinutes
}: {
  tokenA?: Token;
  tokenB?: Token;
  feeLabel: string;
  poolExists: boolean;
  initialPrice: string;
  initialPriceDirection: "base" | "quote";
  rangeMode: "full" | "custom";
  minPrice: string;
  maxPrice: string;
  positionTokenId?: bigint;
  slippageBps: number;
  deadlineMinutes: number;
}) {
  const { address } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  useInvalidateDexQueries(write.data, receipt.isSuccess);

  function addLiquidity(amountA: string, amountB: string) {
    if (!address || !tokenA || !tokenB) return;
    const desiredA = parseUnits(amountA || "0", tokenA.decimals);
    const desiredB = parseUnits(amountB || "0", tokenB.decimals);
    if (desiredA <= 0n && desiredB <= 0n) return;
    const fee = getV3FeeOption(feeLabel).fee;
    const sorted = sortV3Tokens(tokenA, tokenB);
    const amount0Desired = sorted.aIsToken0 ? desiredA : desiredB;
    const amount1Desired = sorted.aIsToken0 ? desiredB : desiredA;
    const ticks = rangeMode === "custom"
      ? getV3CustomRangeTicks({ tokenA, tokenB, minPrice, maxPrice, direction: initialPriceDirection, fee })
      : getV3FullRangeTicks(fee);
    const minimums = getV3MintAmountMinimums({
          amountA,
          amountB,
          decimalsA: tokenA.decimals,
          decimalsB: tokenB.decimals,
          price: initialPrice,
          direction: initialPriceDirection,
          rangeMode,
          minPrice,
          maxPrice,
          slippageBps
        });
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    const mintParams = {
      token0: sorted.token0Address,
      token1: sorted.token1Address,
      fee,
      tickLower: ticks.tickLower,
      tickUpper: ticks.tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min: sorted.aIsToken0 ? minimums.amountAMin : minimums.amountBMin,
      amount1Min: sorted.aIsToken0 ? minimums.amountBMin : minimums.amountAMin,
      recipient: address,
      deadline
    };
    const nativeValue = tokenA.isNative ? desiredA : tokenB.isNative ? desiredB : undefined;
    if (positionTokenId !== undefined) {
      const increaseParams = {
        tokenId: positionTokenId,
        amount0Desired,
        amount1Desired,
        amount0Min: sorted.aIsToken0 ? minimums.amountAMin : minimums.amountBMin,
        amount1Min: sorted.aIsToken0 ? minimums.amountBMin : minimums.amountAMin,
        deadline
      };
      if (nativeValue) {
        const increaseCall = encodeFunctionData({
          abi: nonfungiblePositionManagerAbi,
          functionName: "increaseLiquidity",
          args: [increaseParams]
        });
        const refundCall = encodeFunctionData({
          abi: nonfungiblePositionManagerAbi,
          functionName: "refundETH"
        });
        write.writeContract({
          address: v3PositionManagerAddress,
          abi: nonfungiblePositionManagerAbi,
          functionName: "multicall",
          args: [[increaseCall, refundCall]],
          value: nativeValue
        });
        return;
      }
      write.writeContract({
        address: v3PositionManagerAddress,
        abi: nonfungiblePositionManagerAbi,
        functionName: "increaseLiquidity",
        args: [increaseParams]
      });
      return;
    }
    const mintCall = encodeFunctionData({
      abi: nonfungiblePositionManagerAbi,
      functionName: "mint",
      args: [mintParams]
    });
    const refundCall = encodeFunctionData({
      abi: nonfungiblePositionManagerAbi,
      functionName: "refundETH"
    });
    if (!poolExists) {
      const sqrtPriceX96 = getV3InitialSqrtPriceX96({ tokenA, tokenB, price: initialPrice, direction: initialPriceDirection });
      if (!sqrtPriceX96) return;
      const initializeCall = encodeFunctionData({
        abi: nonfungiblePositionManagerAbi,
        functionName: "createAndInitializePoolIfNecessary",
        args: [sorted.token0Address, sorted.token1Address, fee, sqrtPriceX96]
      });
      write.writeContract({
        address: v3PositionManagerAddress,
        abi: nonfungiblePositionManagerAbi,
        functionName: "multicall",
        args: [nativeValue ? [initializeCall, mintCall, refundCall] : [initializeCall, mintCall]],
        value: nativeValue
      });
      return;
    }
    if (nativeValue) {
      write.writeContract({
        address: v3PositionManagerAddress,
        abi: nonfungiblePositionManagerAbi,
        functionName: "multicall",
        args: [[mintCall, refundCall]],
        value: nativeValue
      });
      return;
    }
    write.writeContract({
      address: v3PositionManagerAddress,
      abi: nonfungiblePositionManagerAbi,
      functionName: "mint",
      args: [mintParams],
      value: nativeValue
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
