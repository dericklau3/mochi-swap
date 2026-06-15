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
import { useV3UnclaimedFees } from "../hooks/useV3UnclaimedFees";
import { useV4UnclaimedFees } from "../hooks/useV4UnclaimedFees";
import { useRemoveV3Liquidity } from "../hooks/useRemoveV3Liquidity";
import { useRemoveV4Liquidity } from "../hooks/useRemoveV4Liquidity";
import { useTransactionMessage } from "../hooks/useTransactionMessage";
import { calculateLiquidityPosition, formatPoolPrice, formatPoolShare, getPairReserves } from "../lib/ammMath";
import { formatAddress, formatTokenAmount, formatTokenAmountFixed } from "../lib/format";
import { isTargetChainId } from "../lib/network";
import { calculateV3PositionAmounts, formatV3PoolPrice, getSqrtRatioAtTick, sortV3Tokens } from "../lib/v3Routing";
import { formatV4PoolPrice, getV4PoolId, sortV4Tokens } from "../lib/v4";

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
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [priceDirection, setPriceDirection] = useState<"base" | "quote">("base");
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const v3Positions = useV3Positions(protocol === "V3" ? tokenA : undefined, protocol === "V3" ? tokenB : undefined, fee);
  const directV3Position = useV3Position(protocol === "V3" ? tokenId : undefined);
  const v3Pool = useV3PoolInfo(protocol === "V3" ? tokenA : undefined, protocol === "V3" ? tokenB : undefined, fee ?? 3000);
  const v4PositionQuery = useV4Position(protocol === "V4" ? tokenId : undefined);
  const v4Position = v4PositionQuery.data;
  const v4Pool = useV4PoolInfo(protocol === "V4" ? (v4PoolKey ?? v4Position?.poolKey) : undefined);
  const collectV3Fees = useRemoveV3Liquidity();
  const collectV4Fees = useRemoveV4Liquidity();
  useTransactionMessage({
    hash: collectV3Fees.hash,
    isSuccess: collectV3Fees.isSuccess,
    readableError: collectV3Fees.readableError,
    successTitle: "V3 fees collected",
    failureTitle: "Collect V3 fees failed"
  });
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
  const v3Fees = useV3UnclaimedFees(protocol === "V3" ? v3Pool.data?.address : undefined, protocol === "V3" ? v3Position : undefined);
  const v4Fees = useV4UnclaimedFees(protocol === "V4" ? v4Position : undefined);
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
  const v3FeeA = sortedV3Tokens.aIsToken0 ? v3Fees.data?.amount0 : v3Fees.data?.amount1;
  const v3FeeB = sortedV3Tokens.aIsToken0 ? v3Fees.data?.amount1 : v3Fees.data?.amount0;
  const v4FeeA = sortedV4Tokens.aIsCurrency0 ? v4Fees.data?.amount0 : v4Fees.data?.amount1;
  const v4FeeB = sortedV4Tokens.aIsCurrency0 ? v4Fees.data?.amount1 : v4Fees.data?.amount0;
  const concentratedPrice = protocol === "V4"
    ? formatV4PoolPrice({
        tokenA,
        tokenB,
        sqrtPriceX96: v4Pool.data?.sqrtPriceX96,
        quoteToken: priceDirection === "base" ? "b" : "a"
      })
    : formatV3PoolPrice({
        tokenA,
        tokenB,
        sqrtPriceX96: v3Pool.data?.sqrtPriceX96,
        quoteToken: priceDirection === "base" ? "b" : "a"
      });
  const poolIdentity = protocol === "V4"
    ? v4Position ? getV4PoolId(v4Position.poolKey) : undefined
    : v3Pool.data?.address;
  const feesLoading = protocol === "V4" ? v4Fees.isLoading : v3Fees.isLoading;
  const feeA = protocol === "V4" ? v4FeeA : v3FeeA;
  const feeB = protocol === "V4" ? v4FeeB : v3FeeB;
  const feePosition = protocol === "V4" ? v4Position : v3Position;
  const feeCollector = protocol === "V4" ? collectV4Fees : collectV3Fees;
  const v4OwnerMismatch = protocol === "V4"
    && Boolean(address && v4Position?.owner)
    && address?.toLowerCase() !== v4Position?.owner?.toLowerCase();

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
          <div className="info-list pool-detail-info">
            {protocol !== "V2" ? (
              <>
                <Info label={protocol === "V4" ? "Pool ID" : "Pool address"} value={poolIdentity ? formatAddress(poolIdentity) : "-"} />
                <Info label="Fee tier" value={fee ? `${fee / 10_000}%` : "-"} />
                <Info
                  label="Unclaimed fees"
                  value={(
                    <span className="fee-info-value">
                      <span>
                        {feesLoading
                          ? "Loading..."
                          : `${formatTokenAmount(feeA, tokenA.decimals)} ${tokenA.symbol} + ${formatTokenAmount(feeB, tokenB.decimals)} ${tokenB.symbol}`}
                      </span>
                      <Button
                        className="mini-btn fee-collect-btn"
                        aria-label="Collect fees"
                        disabled={!isConnected || !isTargetChainId(chainId) || !feePosition || v4OwnerMismatch}
                        isLoading={feeCollector.isPending}
                        onClick={() => {
                          if (protocol === "V4" && v4Position && !v4OwnerMismatch) collectV4Fees.collectFees(v4Position);
                          if (protocol === "V3" && v3Position) collectV3Fees.collectFees(v3Position);
                        }}
                      >
                        Collect fees
                      </Button>
                    </span>
                  )}
                />
                <Info
                  label="Price"
                  value={(
                    <span className="price-info-value">
                      <span>{concentratedPrice}</span>
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
              </>
            ) : (
              <>
                <Info label="Pair address" value={info?.address ? formatAddress(info.address) : "Pair not found"} />
                <Info label="Fee tier" value="0.3%" />
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
              </>
            )}
          </div>
          {v4OwnerMismatch && v4Position?.owner ? (
            <p className="notice warn">Only NFT owner {formatAddress(v4Position.owner)} can collect these fees.</p>
          ) : null}
          {!hasPosition ? <p className="notice warn">No wallet {protocol === "V4" ? "V4 NFT" : protocol === "V3" ? "V3 NFT" : "LP"} balance was found for this pair. Add liquidity before removing.</p> : null}
        </Card>
      </div>
    </section>
  );
}
