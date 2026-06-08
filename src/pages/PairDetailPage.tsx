import { useState } from "react";
import { ArrowLeftRight, Minus, Plus } from "lucide-react";
import type { Token } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Info } from "../components/swap/SwapPreview";
import { TokenIcon } from "../components/token/TokenIcon";
import { useMulticallPairInfo } from "../hooks/useMulticallPairInfo";
import { calculateLiquidityPosition, formatPoolPrice, formatPoolShare, getPairReserves } from "../lib/ammMath";
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
  const [priceDirection, setPriceDirection] = useState<"base" | "quote">("base");
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const info = pair.data;
  const hasPosition = Boolean(info?.address && (info.lpBalance ?? 0n) > 0n);
  const position = calculateLiquidityPosition(info, tokenA, tokenB);
  const reserves = getPairReserves(info, tokenA, tokenB);
  const price = !reserves
    ? "-"
    : priceDirection === "base"
      ? formatPoolPrice(tokenA, tokenB, reserves.reserveA, reserves.reserveB)
      : formatPoolPrice(tokenB, tokenA, reserves.reserveB, reserves.reserveA);
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
              <Button className="liquidity-action-btn" aria-label="Add liquidity" title="Add liquidity" onClick={onAdd}>
                <Plus size={18} strokeWidth={2.6} />
              </Button>
              <Button className="liquidity-action-btn" aria-label="Remove liquidity" title="Remove liquidity" disabled={!hasPosition} onClick={onRemove}>
                <Minus size={18} strokeWidth={2.6} />
              </Button>
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
            <Info
              label="Price"
              value={(
                <span className="price-info-value">
                  <span>{pair.isLoading ? "Loading..." : price}</span>
                  <button
                    type="button"
                    className="price-toggle-btn"
                    aria-label="Switch price direction"
                    onClick={() => setPriceDirection((current) => current === "base" ? "quote" : "base")}
                  >
                    <ArrowLeftRight size={14} strokeWidth={2.4} />
                  </button>
                </span>
              )}
            />
          </div>
          {!hasPosition ? <p className="notice warn">No wallet LP balance was found for this pair. Add liquidity before removing.</p> : null}
        </Card>
      </div>
    </section>
  );
}
