import { useEffect } from "react";
import type { Address } from "viem";
import type { Token } from "../../types/token";
import type { TrackedPoolPosition } from "../../types/token";
import { formatAddress } from "../../lib/format";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { TokenIcon } from "../token/TokenIcon";

export function PoolCard({ position, onTrack, onOpen }: { position: TrackedPoolPosition; onTrack: (tokenA: Token, tokenB: Token, pairAddress: Address) => void; onOpen: (tokenA: Token, tokenB: Token) => void }) {
  const { tokenA, tokenB } = position;
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const info = pair.data;
  const hasPosition = Boolean(info?.address && (info.lpBalance ?? 0n) > 0n);

  useEffect(() => {
    if (info?.address && hasPosition) onTrack(tokenA, tokenB, info.address);
  }, [hasPosition, info?.address, onTrack, tokenA, tokenB]);

  if (pair.isLoading) {
    return <article className="pool-card"><div className="pool-row"><div className="card-subtitle">Loading {tokenA.symbol} / {tokenB.symbol}...</div></div></article>;
  }
  if (!hasPosition) return null;

  return (
    <article className="pool-card">
      <div className="pool-row">
        <button className="pair-link" onClick={() => onOpen(tokenA, tokenB)}>
          <div className="pair-icons">
            <TokenIcon token={tokenA} />
            <TokenIcon token={tokenB} />
          </div>
          <div>
            <h3>{tokenA.symbol} / {tokenB.symbol}</h3>
            <p className="card-subtitle">{info?.address ? formatAddress(info.address) : "Pair not found"}</p>
          </div>
        </button>
        <div>
          <span className="pool-row-label">Fee tier</span>
          <strong className="pool-row-value">0.3%</strong>
        </div>
        <div>
          <span className="pool-row-label">Range</span>
          <strong className="pool-row-value">Full range</strong>
        </div>
      </div>
    </article>
  );
}
