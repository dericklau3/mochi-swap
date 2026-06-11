import { useState } from "react";
import { ArrowLeftRight, Minus, Plus } from "lucide-react";
import type { Token } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Info } from "../components/swap/SwapPreview";
import { TokenIcon } from "../components/token/TokenIcon";
import { useMulticallPairInfo } from "../hooks/useMulticallPairInfo";
import { useV3PoolInfo } from "../hooks/useV3PoolInfo";
import { useV3Position } from "../hooks/useV3Position";
import { useV3Positions } from "../hooks/useV3Positions";
import { calculateLiquidityPosition, formatPoolPrice, formatPoolShare, getPairReserves } from "../lib/ammMath";
import { formatAddress, formatTokenAmountFixed } from "../lib/format";
import { calculateV3PositionAmounts, getSqrtRatioAtTick, sortV3Tokens } from "../lib/v3Routing";

export function PairDetailPage({
  tokenA,
  tokenB,
  protocol = "V2",
  fee,
  tokenId,
  onBack,
  onAdd,
  onRemove
}: {
  tokenA: Token;
  tokenB: Token;
  protocol?: "V2" | "V3";
  fee?: number;
  tokenId?: bigint;
  onBack: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [priceDirection, setPriceDirection] = useState<"base" | "quote">("base");
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const v3Positions = useV3Positions(tokenA, tokenB, fee);
  const directV3Position = useV3Position(tokenId);
  const v3Pool = useV3PoolInfo(tokenA, tokenB, fee ?? 3000);
  const info = pair.data;
  const v3Position = tokenId === undefined
    ? v3Positions.data?.[0]
    : directV3Position.data;
  const hasPosition = protocol === "V3" ? Boolean(v3Position) : Boolean(info?.address && (info.lpBalance ?? 0n) > 0n);
  const position = calculateLiquidityPosition(info, tokenA, tokenB);
  const reserves = getPairReserves(info, tokenA, tokenB);
  const price = !reserves
    ? "-"
    : priceDirection === "base"
      ? formatPoolPrice(tokenA, tokenB, reserves.reserveA, reserves.reserveB)
      : formatPoolPrice(tokenB, tokenA, reserves.reserveB, reserves.reserveA);
  const depositedA = pair.isLoading ? "Loading..." : formatTokenAmountFixed(position.amountA, tokenA.decimals);
  const depositedB = pair.isLoading ? "Loading..." : formatTokenAmountFixed(position.amountB, tokenB.decimals);
  const sortedV3Tokens = sortV3Tokens(tokenA, tokenB);
  const v3Amounts = v3Position && v3Pool.data?.sqrtPriceX96
    ? calculateV3PositionAmounts({
      liquidity: v3Position.liquidity,
      sqrtPriceX96: v3Pool.data.sqrtPriceX96,
      sqrtRatioAX96: getSqrtRatioAtTick(v3Position.tickLower),
      sqrtRatioBX96: getSqrtRatioAtTick(v3Position.tickUpper)
    })
    : undefined;
  const v3AmountA = sortedV3Tokens.aIsToken0 ? v3Amounts?.amount0 : v3Amounts?.amount1;
  const v3AmountB = sortedV3Tokens.aIsToken0 ? v3Amounts?.amount1 : v3Amounts?.amount0;
  const v3PositionLoading = tokenId === undefined ? v3Positions.isLoading : directV3Position.isLoading;
  const v3AmountsLoading = v3PositionLoading || v3Pool.isLoading;

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
              <p className="card-subtitle">{protocol} liquidity position</p>
            </div>
          </div>
          {protocol === "V3" ? (
            <div className="metric-grid">
              <div className="metric"><span>NFT token ID</span><strong>{v3PositionLoading ? "Loading..." : v3Position?.tokenId.toString() ?? "-"}</strong></div>
              <div className="metric"><span>Liquidity</span><strong>{v3PositionLoading ? "Loading..." : v3Position?.liquidity.toString() ?? "0"}</strong></div>
              <div className="metric"><span>{tokenA.symbol} deposited</span><strong>{v3AmountsLoading ? "Loading..." : formatTokenAmountFixed(v3AmountA ?? 0n, tokenA.decimals)}</strong></div>
              <div className="metric"><span>{tokenB.symbol} deposited</span><strong>{v3AmountsLoading ? "Loading..." : formatTokenAmountFixed(v3AmountB ?? 0n, tokenB.decimals)}</strong></div>
            </div>
          ) : (
            <div className="metric-grid">
              <div className="metric"><span>LP Token balance</span><strong>{pair.isLoading ? "Loading..." : formatTokenAmountFixed(info?.lpBalance ?? 0n, 18)}</strong></div>
              <div className="metric"><span>Pool share</span><strong>{pair.isLoading ? "Loading..." : formatPoolShare(position.poolShareHundredths, hasPosition)}</strong></div>
              <div className="metric"><span>{tokenA.symbol} deposited</span><strong>{depositedA}</strong></div>
              <div className="metric"><span>{tokenB.symbol} deposited</span><strong>{depositedB}</strong></div>
            </div>
          )}
          <div className="info-list">
            <Info label={protocol === "V3" ? "Position manager" : "Pair address"} value={protocol === "V3" ? `NFT #${v3Position?.tokenId ?? "-"}` : info?.address ? formatAddress(info.address) : "Pair not found"} />
            <Info label="Fee tier" value={protocol === "V3" && fee ? `${fee / 10_000}%` : "0.3%"} />
            <Info label="Range" value={protocol === "V3" ? "Concentrated" : "Full range"} />
            {protocol === "V3" ? <Info label="Ticks" value={v3Position ? `${v3Position.tickLower} to ${v3Position.tickUpper}` : "-"} /> : null}
            {protocol === "V2" ? (
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
            ) : null}
          </div>
          {!hasPosition ? <p className="notice warn">No wallet {protocol === "V3" ? "V3 NFT" : "LP"} balance was found for this pair. Add liquidity before removing.</p> : null}
        </Card>
      </div>
    </section>
  );
}
