import type { Token } from "../../types/token";
import type { TrackedPoolPosition } from "../../types/token";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { PoolCard } from "./PoolCard";
import type { Address } from "viem";

export function PoolList({ positions, onCreate, onImport, onTrack, onOpen }: { positions: TrackedPoolPosition[]; onCreate: () => void; onImport: () => void; onTrack: (tokenA: Token, tokenB: Token, pairAddress: Address) => void; onOpen: (position: TrackedPoolPosition) => void }) {
  return (
    <Card className="pool-shell">
      <div className="card-head">
        <div>
          <h2 className="card-title">Pool</h2>
          <p className="card-subtitle">Manage V2, V3, and V4 liquidity positions.</p>
        </div>
        <div className="pool-actions">
          <Button variant="primary" onClick={onCreate}>Create position</Button>
          <Button onClick={onImport}>Import position</Button>
        </div>
      </div>
      <div className="pool-list">
        {positions.map((position) => (
          <PoolCard key={`${position.protocol ?? "V2"}-${position.fee ?? 0}-${position.pairAddress}-${position.tokenA.address}-${position.tokenB.address}`} position={position} onTrack={onTrack} onOpen={onOpen} />
        ))}
      </div>
    </Card>
  );
}
