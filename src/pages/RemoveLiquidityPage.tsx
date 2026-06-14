import type { Token, V4PoolKey } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { RemoveLiquidityForm } from "../components/liquidity/RemoveLiquidityForm";

export function RemoveLiquidityPage({ tokenA, tokenB, protocol, fee, tokenId, v4PoolKey, percent, onPercent, onBack }: { tokenA: Token; tokenB: Token; protocol?: "V2" | "V3" | "V4"; fee?: number; tokenId?: bigint; v4PoolKey?: V4PoolKey; percent: number; onPercent: (value: number) => void; onBack: () => void }) {
  return <section className="dex-layout" data-od-id="remove-liquidity-page"><div><NetworkGuard /><RemoveLiquidityForm tokenA={tokenA} tokenB={tokenB} protocol={protocol} fee={fee} tokenId={tokenId} v4PoolKey={v4PoolKey} percent={percent} onPercent={onPercent} onBack={onBack} /></div></section>;
}
