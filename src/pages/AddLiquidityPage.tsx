import type { Token, TrackedPoolPosition, V4PoolKey } from "../types/token";
import type { Address } from "viem";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { AddLiquidityForm } from "../components/liquidity/AddLiquidityForm";
import type { LiquidityMode } from "../components/liquidity/CreatePositionModal";

export type V3RangeMode = "full" | "custom";
export type V3PriceDirection = "base" | "quote";

export function AddLiquidityPage(props: { tokenA: Token; tokenB: Token; amountA: string; amountB: string; slippage: string; deadline: string; liquidityMode: LiquidityMode; v3FeeTier: string; positionTokenId?: bigint; v4PoolKey?: V4PoolKey; v4TickLower?: number; v4TickUpper?: number; initialPrice: string; initialPriceDirection: V3PriceDirection; rangeMode: V3RangeMode; minPrice: string; maxPrice: string; onAmountA: (value: string) => void; onAmountB: (value: string) => void; onTokenA: () => void; onTokenB: () => void; onBack: () => void; onPositionAdded: (tokenA: Token, tokenB: Token, pairAddress: Address, protocol?: "V2" | "V3" | "V4", fee?: number) => void; onV4PositionAdded: (position: TrackedPoolPosition) => void; onV3FeeTier: (value: string) => void; onInitialPrice: (value: string) => void; onInitialPriceDirection: (value: V3PriceDirection) => void; onRangeMode: (value: V3RangeMode) => void; onMinPrice: (value: string) => void; onMaxPrice: (value: string) => void }) {
  return <section className="dex-layout" data-od-id="add-liquidity-page"><div><NetworkGuard /><AddLiquidityForm {...props} /></div></section>;
}
