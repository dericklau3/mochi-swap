import { useMemo } from "react";
import { useMulticallPairInfo } from "./useMulticallPairInfo";
import type { Token } from "../types/token";

export function useMulticallLiquidityPositions(tokens: Token[]) {
  const pairInfo = useMulticallPairInfo(tokens[0], tokens[1]);
  return useMemo(() => ({
    ...pairInfo,
    positions: pairInfo.data?.address ? [{ tokenA: tokens[0], tokenB: tokens[1], info: pairInfo.data }] : []
  }), [pairInfo, tokens]);
}
