import { Fragment, useEffect } from "react";
import type { Address } from "viem";
import type { Token } from "../../types/token";
import type { TrackedPoolPosition } from "../../types/token";
import { formatAddress } from "../../lib/format";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useV3PoolInfo } from "../../hooks/useV3PoolInfo";
import { useV3Positions } from "../../hooks/useV3Positions";
import { getV3PositionRangeStatus } from "../../lib/v3Routing";
import { TokenIcon } from "../token/TokenIcon";

export function PoolCard({ position, onTrack, onOpen }: { position: TrackedPoolPosition; onTrack: (tokenA: Token, tokenB: Token, pairAddress: Address) => void; onOpen: (position: TrackedPoolPosition) => void }) {
  const { tokenA, tokenB } = position;
  const protocol = position.protocol ?? "V2";
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const v3Positions = useV3Positions(tokenA, tokenB, protocol === "V3" ? position.fee : undefined);
  const v3Pool = useV3PoolInfo(protocol === "V3" ? tokenA : undefined, protocol === "V3" ? tokenB : undefined, position.fee ?? 3000);
  const info = pair.data;
  const hasV2Position = Boolean(info?.address && (info.lpBalance ?? 0n) > 0n);
  const hasV3Position = Boolean(v3Positions.data?.length);
  const hasPosition = protocol === "V3" ? hasV3Position : hasV2Position;

  useEffect(() => {
    if (info?.address && hasV2Position) onTrack(tokenA, tokenB, info.address);
  }, [hasV2Position, info?.address, onTrack, tokenA, tokenB]);

  if (pair.isLoading || v3Positions.isLoading || (protocol === "V3" && v3Pool.isLoading)) {
    return <article className="pool-card"><div className="pool-row"><div className="card-subtitle">Loading {tokenA.symbol} / {tokenB.symbol}...</div></div></article>;
  }
  if (!hasPosition) return null;

  if (protocol === "V3") {
    return (
      <>
        {v3Positions.data?.map((v3Position) => (
          <Fragment key={v3Position.tokenId.toString()}>
            <article className="pool-card">
              <div className="pool-row">
                <button className="pair-link" onClick={() => onOpen({ ...position, protocol: "V3", fee: v3Position.fee, tokenId: v3Position.tokenId })}>
                  <div className="pair-icons">
                    <TokenIcon token={tokenA} />
                    <TokenIcon token={tokenB} />
                  </div>
                  <div>
                    <h3>{tokenA.symbol} / {tokenB.symbol}</h3>
                    <p className="card-subtitle">V3 NFT #{v3Position.tokenId.toString()}</p>
                  </div>
                </button>
                <div>
                  <span className="pool-row-label">Fee tier</span>
                  <strong className="pool-row-value">{v3Position.fee / 10_000}%</strong>
                </div>
                <div>
                  <span className="pool-row-label">Range</span>
                  <strong className="pool-row-value">{getV3PositionRangeStatus({
                    liquidity: v3Position.liquidity,
                    currentTick: v3Pool.data?.tick,
                    tickLower: v3Position.tickLower,
                    tickUpper: v3Position.tickUpper,
                    fee: v3Position.fee
                  })}</strong>
                </div>
              </div>
            </article>
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <article className="pool-card">
      <div className="pool-row">
        <button className="pair-link" onClick={() => onOpen({ ...position, protocol })}>
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
