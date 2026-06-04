import type { Token } from "../../types/token";
import type { TrackedPoolPosition } from "../../types/token";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { PoolCard } from "./PoolCard";
import type { Address } from "viem";

export function PoolList({ positions, onCreate, onImport, onTrack, onOpen }: { positions: TrackedPoolPosition[]; onCreate: () => void; onImport: () => void; onTrack: (tokenA: Token, tokenB: Token, pairAddress: Address) => void; onOpen: (tokenA: Token, tokenB: Token) => void }) {
  return (
    <Card className="pool-shell">
      <div className="card-head">
        <div>
          <h2 className="card-title">Pool</h2>
          <p className="card-subtitle">Manage V2 pairs and V3 concentrated liquidity positions.</p>
        </div>
        <div className="pool-actions">
          <Button variant="primary" onClick={onCreate}>Create position</Button>
          <Button onClick={onImport}>Import position</Button>
        </div>
      </div>
      <div className="pool-list">
        {positions.map((position) => (
          <PoolCard key={`${position.pairAddress}-${position.tokenA.address}-${position.tokenB.address}`} position={position} onTrack={onTrack} onOpen={onOpen} />
        ))}
      </div>
    </Card>
  );
}
