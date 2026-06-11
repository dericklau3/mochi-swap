import type { Token } from "../types/token";
import { SwapForm } from "../components/swap/SwapForm";

export function SwapPage(props: { from: Token; to: Token; amount: string; slippage: string; deadline: string; onAmount: (value: string) => void; onFrom: () => void; onTo: () => void; onFlip: () => void; onSettings: () => void }) {
  return <section className="dex-layout" data-od-id="swap-page"><div><SwapForm {...props} /></div></section>;
}
