import type { Token } from "../types/token";
import type { TrackedPoolPosition } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { PoolList } from "../components/liquidity/PoolList";
import { Button } from "../components/ui/Button";
import type { Address } from "viem";

export function PoolPage({ positions, onCreate, onImport, onTrack, onOpen, discoveryLoading, discoveryError, onRetryDiscovery }: { discoveryLoading?: boolean; discoveryError?: boolean; onRetryDiscovery?: () => void; positions: TrackedPoolPosition[]; onCreate: () => void; onImport: () => void; onTrack: (tokenA: Token, tokenB: Token, pairAddress: Address) => void; onOpen: (position: TrackedPoolPosition) => void }) {
  return <section className="dex-layout pool-layout" data-od-id="pool-page"><div><NetworkGuard />{discoveryLoading ? <p className="notice" role="status">Loading wallet V3 positions...</p> : null}{discoveryError ? <div className="notice danger" role="alert">Unable to load wallet V3 positions. <Button onClick={onRetryDiscovery}>Retry</Button></div> : null}<PoolList positions={positions} onCreate={onCreate} onImport={onImport} onTrack={onTrack} onOpen={onOpen} /></div></section>;
}
