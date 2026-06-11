import type { Token } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { RemoveLiquidityForm } from "../components/liquidity/RemoveLiquidityForm";

export function RemoveLiquidityPage({ tokenA, tokenB, protocol, fee, tokenId, percent, onPercent, onBack }: { tokenA: Token; tokenB: Token; protocol?: "V2" | "V3"; fee?: number; tokenId?: bigint; percent: number; onPercent: (value: number) => void; onBack: () => void }) {
  return <section className="dex-layout" data-od-id="remove-liquidity-page"><div><NetworkGuard /><RemoveLiquidityForm tokenA={tokenA} tokenB={tokenB} protocol={protocol} fee={fee} tokenId={tokenId} percent={percent} onPercent={onPercent} onBack={onBack} /></div></section>;
}
