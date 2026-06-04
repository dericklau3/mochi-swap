import type { Token } from "../types/token";
import type { TrackedPoolPosition } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { PoolList } from "../components/liquidity/PoolList";
import type { Address } from "viem";

export function PoolPage({ positions, onCreate, onImport, onTrack, onOpen }: { positions: TrackedPoolPosition[]; onCreate: () => void; onImport: () => void; onTrack: (tokenA: Token, tokenB: Token, pairAddress: Address) => void; onOpen: (tokenA: Token, tokenB: Token) => void }) {
  return <section className="dex-layout pool-layout" data-od-id="pool-page"><div><NetworkGuard /><PoolList positions={positions} onCreate={onCreate} onImport={onImport} onTrack={onTrack} onOpen={onOpen} /></div></section>;
}
