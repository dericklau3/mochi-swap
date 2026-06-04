import type { Token } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { RemoveLiquidityForm } from "../components/liquidity/RemoveLiquidityForm";

export function RemoveLiquidityPage({ tokenA, tokenB, percent, onPercent, onBack }: { tokenA: Token; tokenB: Token; percent: number; onPercent: (value: number) => void; onBack: () => void }) {
  return <section className="dex-layout" data-od-id="remove-liquidity-page"><div><NetworkGuard /><RemoveLiquidityForm tokenA={tokenA} tokenB={tokenB} percent={percent} onPercent={onPercent} onBack={onBack} /></div></section>;
}
