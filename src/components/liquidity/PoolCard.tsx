import { Fragment, useEffect } from "react";
import type { Address } from "viem";
import type { Token } from "../../types/token";
import type { TrackedPoolPosition } from "../../types/token";
import { formatAddress } from "../../lib/format";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useV3PoolInfo } from "../../hooks/useV3PoolInfo";
import { useV3Positions } from "../../hooks/useV3Positions";
import { useV4Position } from "../../hooks/useV4Position";
import { useV4PoolInfo } from "../../hooks/useV4PoolInfo";
import { getV3PositionRangeStatus } from "../../lib/v3Routing";
import { TokenIcon } from "../token/TokenIcon";
import { useAccount } from "wagmi";

export function PoolCard({ position, onTrack, onOpen }: { position: TrackedPoolPosition; onTrack: (tokenA: Token, tokenB: Token, pairAddress: Address) => void; onOpen: (position: TrackedPoolPosition) => void }) {
  const { tokenA, tokenB } = position;
  const protocol = position.protocol ?? "V2";
  const { address } = useAccount();
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const v3Positions = useV3Positions(protocol === "V3" ? tokenA : undefined, protocol === "V3" ? tokenB : undefined, protocol === "V3" ? position.fee : undefined);
  const v3Pool = useV3PoolInfo(protocol === "V3" ? tokenA : undefined, protocol === "V3" ? tokenB : undefined, position.fee ?? 3000);
  const v4Position = useV4Position(protocol === "V4" ? position.tokenId : undefined);
  const v4Pool = useV4PoolInfo(protocol === "V4" ? (position.v4PoolKey ?? v4Position.data?.poolKey) : undefined);
  const info = pair.data;
  const hasV2Position = Boolean(info?.address && (info.lpBalance ?? 0n) > 0n);
  const hasV3Position = Boolean(v3Positions.data?.length);
  const hasV4Position = Boolean(v4Position.data && address && v4Position.data.owner?.toLowerCase() === address.toLowerCase());
  const hasPosition = protocol === "V4" ? hasV4Position : protocol === "V3" ? hasV3Position : hasV2Position;

  useEffect(() => {
    if (info?.address && hasV2Position) onTrack(tokenA, tokenB, info.address);
  }, [hasV2Position, info?.address, onTrack, tokenA, tokenB]);

  if (pair.isLoading || v3Positions.isLoading || (protocol === "V3" && v3Pool.isLoading) || (protocol === "V4" && (v4Position.isLoading || v4Pool.isLoading))) {
    return <article className="pool-card"><div className="pool-row"><div className="card-subtitle">Loading {tokenA.symbol} / {tokenB.symbol}...</div></div></article>;
  }
  if (!hasPosition) return null;

  if (protocol === "V4" && v4Position.data) {
    const currentTick = v4Pool.data?.tick;
    const range = v4Position.data.liquidity <= 0n
      ? "Closed"
      : currentTick === undefined
        ? "V4 range"
        : currentTick < v4Position.data.tickLower || currentTick >= v4Position.data.tickUpper ? "Out of range" : "In range";
    return (
      <article className="pool-card">
        <div className="pool-row">
          <button className="pair-link" onClick={() => onOpen({ ...position, v4PoolKey: v4Position.data?.poolKey, tickLower: v4Position.data?.tickLower, tickUpper: v4Position.data?.tickUpper })}>
            <div className="pair-icons"><TokenIcon token={tokenA} /><TokenIcon token={tokenB} /></div>
            <div>
              <h3>{tokenA.symbol} / {tokenB.symbol}</h3>
              <p className="card-subtitle">V4 NFT #{v4Position.data.tokenId.toString()}</p>
            </div>
          </button>
          <div><span className="pool-row-label">Fee tier</span><strong className="pool-row-value">{v4Position.data.poolKey.fee / 10_000}%</strong></div>
          <div><span className="pool-row-label">Range</span><strong className="pool-row-value">{range}</strong></div>
        </div>
      </article>
    );
  }

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
