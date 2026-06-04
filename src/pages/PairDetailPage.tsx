import type { Token } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Info } from "../components/swap/SwapPreview";
import { TokenIcon } from "../components/token/TokenIcon";
import { useMulticallPairInfo } from "../hooks/useMulticallPairInfo";
import { calculateLiquidityPosition, formatPoolShare } from "../lib/ammMath";
import { formatAddress, formatTokenAmountFixed } from "../lib/format";

export function PairDetailPage({
  tokenA,
  tokenB,
  onBack,
  onAdd,
  onRemove
}: {
  tokenA: Token;
  tokenB: Token;
  onBack: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const info = pair.data;
  const hasPosition = Boolean(info?.address && (info.lpBalance ?? 0n) > 0n);
  const position = calculateLiquidityPosition(info, tokenA, tokenB);
  const depositedA = pair.isLoading ? "Loading..." : formatTokenAmountFixed(position.amountA, tokenA.decimals);
  const depositedB = pair.isLoading ? "Loading..." : formatTokenAmountFixed(position.amountB, tokenB.decimals);

  return (
    <section className="dex-layout pool-layout" data-od-id="pair-detail-page">
      <div>
        <NetworkGuard />
        <Card className="pool-shell">
          <div className="detail-head">
            <Button className="icon-btn back-icon" aria-label="Back" onClick={onBack}>←</Button>
            <div className="pool-actions">
              <Button onClick={onAdd}>Add</Button>
              <Button variant="primary" disabled={!hasPosition} onClick={onRemove}>Remove</Button>
            </div>
          </div>
          <div className="pair-detail-title">
            <div className="pair-icons">
              <TokenIcon token={tokenA} />
              <TokenIcon token={tokenB} />
            </div>
            <div>
              <h2 className="card-title">{tokenA.symbol} / {tokenB.symbol}</h2>
              <p className="card-subtitle">V2 liquidity position</p>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric"><span>LP Token balance</span><strong>{pair.isLoading ? "Loading..." : formatTokenAmountFixed(info?.lpBalance ?? 0n, 18)}</strong></div>
            <div className="metric"><span>Pool share</span><strong>{pair.isLoading ? "Loading..." : formatPoolShare(position.poolShareHundredths, hasPosition)}</strong></div>
            <div className="metric"><span>{tokenA.symbol} deposited</span><strong>{depositedA}</strong></div>
            <div className="metric"><span>{tokenB.symbol} deposited</span><strong>{depositedB}</strong></div>
          </div>
          <div className="info-list">
            <Info label="Pair address" value={info?.address ? formatAddress(info.address) : "Pair not found"} />
            <Info label="Fee tier" value="0.3%" />
            <Info label="Range" value="Full range" />
          </div>
          {!hasPosition ? <p className="notice warn">No wallet LP balance was found for this pair. Add liquidity before removing.</p> : null}
        </Card>
      </div>
    </section>
  );
}
