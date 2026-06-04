import type { Token } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { SwapForm } from "../components/swap/SwapForm";

export function SwapPage(props: { from: Token; to: Token; amount: string; slippage: string; deadline: string; onAmount: (value: string) => void; onFrom: () => void; onTo: () => void; onFlip: () => void; onSettings: () => void }) {
  return <section className="dex-layout" data-od-id="swap-page"><div><NetworkGuard /><SwapForm {...props} /></div></section>;
}
