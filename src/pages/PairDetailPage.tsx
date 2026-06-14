import { useState } from "react";
import { ArrowLeftRight, Minus, Plus } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import type { Token, V4PoolKey } from "../types/token";
import { NetworkGuard } from "../components/wallet/NetworkGuard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Info } from "../components/swap/SwapPreview";
import { TokenIcon } from "../components/token/TokenIcon";
import { useMulticallPairInfo } from "../hooks/useMulticallPairInfo";
import { useV3PoolInfo } from "../hooks/useV3PoolInfo";
import { useV3Position } from "../hooks/useV3Position";
import { useV3Positions } from "../hooks/useV3Positions";
import { useV4Position } from "../hooks/useV4Position";
import { useV4PoolInfo } from "../hooks/useV4PoolInfo";
import { useRemoveV4Liquidity } from "../hooks/useRemoveV4Liquidity";
import { useTransactionMessage } from "../hooks/useTransactionMessage";
import { calculateLiquidityPosition, formatPoolPrice, formatPoolShare, getPairReserves } from "../lib/ammMath";
import { formatAddress, formatTokenAmountFixed } from "../lib/format";
import { isTargetChainId } from "../lib/network";
import { calculateV3PositionAmounts, getSqrtRatioAtTick, sortV3Tokens } from "../lib/v3Routing";
import { sortV4Tokens } from "../lib/v4";

export function PairDetailPage({
  tokenA,
  tokenB,
  protocol = "V2",
  fee,
  tokenId,
  v4PoolKey,
  onBack,
  onAdd,
  onRemove
}: {
  tokenA: Token;
  tokenB: Token;
  protocol?: "V2" | "V3" | "V4";
  fee?: number;
  tokenId?: bigint;
  v4PoolKey?: V4PoolKey;
  onBack: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [priceDirection, setPriceDirection] = useState<"base" | "quote">("base");
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const v3Positions = useV3Positions(protocol === "V3" ? tokenA : undefined, protocol === "V3" ? tokenB : undefined, fee);
  const directV3Position = useV3Position(protocol === "V3" ? tokenId : undefined);
  const v3Pool = useV3PoolInfo(protocol === "V3" ? tokenA : undefined, protocol === "V3" ? tokenB : undefined, fee ?? 3000);
  const v4PositionQuery = useV4Position(protocol === "V4" ? tokenId : undefined);
  const v4Position = v4PositionQuery.data;
  const v4Pool = useV4PoolInfo(protocol === "V4" ? (v4PoolKey ?? v4Position?.poolKey) : undefined);
  const collectV4Fees = useRemoveV4Liquidity();
  useTransactionMessage({
    hash: collectV4Fees.hash,
    isSuccess: collectV4Fees.isSuccess,
    readableError: collectV4Fees.readableError,
    successTitle: "V4 fees collected",
    failureTitle: "Collect V4 fees failed"
  });
  const info = pair.data;
  const v3Position = tokenId === undefined
    ? v3Positions.data?.[0]
    : directV3Position.data;
  const hasPosition = protocol === "V4" ? Boolean(v4Position) : protocol === "V3" ? Boolean(v3Position) : Boolean(info?.address && (info.lpBalance ?? 0n) > 0n);
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
  const sortedV4Tokens = sortV4Tokens(tokenA, tokenB);
  const v4Amounts = v4Position && v4Pool.data?.sqrtPriceX96
    ? calculateV3PositionAmounts({
        liquidity: v4Position.liquidity,
        sqrtPriceX96: v4Pool.data.sqrtPriceX96,
        sqrtRatioAX96: getSqrtRatioAtTick(v4Position.tickLower),
        sqrtRatioBX96: getSqrtRatioAtTick(v4Position.tickUpper)
      })
    : undefined;
  const v4AmountA = sortedV4Tokens.aIsCurrency0 ? v4Amounts?.amount0 : v4Amounts?.amount1;
  const v4AmountB = sortedV4Tokens.aIsCurrency0 ? v4Amounts?.amount1 : v4Amounts?.amount0;

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
          {protocol === "V4" ? (
            <div className="metric-grid">
              <div className="metric"><span>NFT token ID</span><strong>{v4PositionQuery.isLoading ? "Loading..." : v4Position?.tokenId.toString() ?? "-"}</strong></div>
              <div className="metric"><span>Liquidity</span><strong>{v4PositionQuery.isLoading ? "Loading..." : v4Position?.liquidity.toString() ?? "0"}</strong></div>
              <div className="metric"><span>{tokenA.symbol} deposited</span><strong>{v4PositionQuery.isLoading || v4Pool.isLoading ? "Loading..." : formatTokenAmountFixed(v4AmountA ?? 0n, tokenA.decimals)}</strong></div>
              <div className="metric"><span>{tokenB.symbol} deposited</span><strong>{v4PositionQuery.isLoading || v4Pool.isLoading ? "Loading..." : formatTokenAmountFixed(v4AmountB ?? 0n, tokenB.decimals)}</strong></div>
            </div>
          ) : protocol === "V3" ? (
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
            <Info label={protocol !== "V2" ? "Position manager" : "Pair address"} value={protocol === "V4" ? `NFT #${v4Position?.tokenId ?? "-"}` : protocol === "V3" ? `NFT #${v3Position?.tokenId ?? "-"}` : info?.address ? formatAddress(info.address) : "Pair not found"} />
            <Info label="Fee tier" value={protocol !== "V2" && fee ? `${fee / 10_000}%` : "0.3%"} />
            <Info label="Range" value={protocol !== "V2" ? "Concentrated" : "Full range"} />
            {protocol === "V3" ? <Info label="Ticks" value={v3Position ? `${v3Position.tickLower} to ${v3Position.tickUpper}` : "-"} /> : null}
            {protocol === "V4" ? <Info label="Ticks" value={v4Position ? `${v4Position.tickLower} to ${v4Position.tickUpper}` : "-"} /> : null}
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
          {protocol === "V4" ? (
            <Button
              className="btn-wide"
              disabled={!isConnected || !isTargetChainId(chainId) || !v4Position}
              isLoading={collectV4Fees.isPending}
              onClick={() => v4Position ? collectV4Fees.collectFees(v4Position) : undefined}
            >
              Collect fees
            </Button>
          ) : null}
          {!hasPosition ? <p className="notice warn">No wallet {protocol === "V4" ? "V4 NFT" : protocol === "V3" ? "V3 NFT" : "LP"} balance was found for this pair. Add liquidity before removing.</p> : null}
        </Card>
      </div>
    </section>
  );
}
