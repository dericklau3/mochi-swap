import { ArrowLeftRight } from "lucide-react";
import type { Token } from "../../types/token";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useApproveToken } from "../../hooks/useApproveToken";
import { useRemoveLiquidity } from "../../hooks/useRemoveLiquidity";
import { useRemoveV3Liquidity } from "../../hooks/useRemoveV3Liquidity";
import { useTransactionMessage } from "../../hooks/useTransactionMessage";
import { useV3PoolInfo } from "../../hooks/useV3PoolInfo";
import { useV3Position } from "../../hooks/useV3Position";
import { routerAddress } from "../../lib/contracts";
import { calculateLiquidityPosition, formatPoolPrice, getPairReserves } from "../../lib/ammMath";
import { formatTokenAmountFixed } from "../../lib/format";
import { isTargetChainId } from "../../lib/network";
import { calculateV3RemovalAmounts, getSqrtRatioAtTick, sortV3Tokens } from "../../lib/v3Routing";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Info } from "../swap/SwapPreview";
import { TokenIcon } from "../token/TokenIcon";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useAccount, useChainId } from "wagmi";

export function RemoveLiquidityForm({ tokenA, tokenB, protocol = "V2", fee, tokenId, percent, onPercent, onBack }: { tokenA: Token; tokenB: Token; protocol?: "V2" | "V3"; fee?: number; tokenId?: bigint; percent: number; onPercent: (value: number) => void; onBack: () => void }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [priceDirection, setPriceDirection] = useState<"base" | "quote">("base");
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const v3PositionQuery = useV3Position(tokenId);
  const v3Position = v3PositionQuery.data;
  const v3Pool = useV3PoolInfo(tokenA, tokenB, fee ?? 3000);
  const approve = useApproveToken(pair.data?.address ?? undefined, routerAddress, true);
  const remove = useRemoveLiquidity(tokenA, tokenB);
  const removeV3 = useRemoveV3Liquidity();
  useTransactionMessage({
    hash: approve.hash,
    isSuccess: approve.isSuccess,
    readableError: approve.readableError,
    successTitle: "LP token approved",
    failureTitle: "LP token approval failed"
  });
  useTransactionMessage({
    hash: remove.hash,
    isSuccess: remove.isSuccess,
    readableError: remove.readableError,
    successTitle: "Liquidity removed",
    failureTitle: "Remove liquidity failed"
  });
  useTransactionMessage({
    hash: removeV3.hash,
    isSuccess: removeV3.isSuccess,
    readableError: removeV3.readableError,
    successTitle: "V3 liquidity removed",
    failureTitle: "Remove V3 liquidity failed"
  });
  const normalizedPercent = clampPercent(percent);
  const lpBalance = pair.data?.lpBalance ?? 0n;
  const lpAmount = lpBalance * BigInt(normalizedPercent) / 100n;
  const position = calculateLiquidityPosition(pair.data, tokenA, tokenB, lpAmount);
  const reserves = getPairReserves(pair.data, tokenA, tokenB);
  const price = !reserves
    ? "-"
    : priceDirection === "base"
      ? formatPoolPrice(tokenA, tokenB, reserves.reserveA, reserves.reserveB)
      : formatPoolPrice(tokenB, tokenA, reserves.reserveB, reserves.reserveA);
  const needsApproval = (pair.data?.lpAllowance ?? 0n) < lpAmount && lpAmount > 0n;
  const sortedV3Tokens = sortV3Tokens(tokenA, tokenB);
  const v3RemovalAmounts = v3Position && v3Pool.data?.sqrtPriceX96
    ? calculateV3RemovalAmounts({
        liquidity: v3Position.liquidity,
        percent: normalizedPercent,
        sqrtPriceX96: v3Pool.data.sqrtPriceX96,
        sqrtRatioAX96: getSqrtRatioAtTick(v3Position.tickLower),
        sqrtRatioBX96: getSqrtRatioAtTick(v3Position.tickUpper),
        tokensOwed0: v3Position.tokensOwed0,
        tokensOwed1: v3Position.tokensOwed1,
        aIsToken0: sortedV3Tokens.aIsToken0
      })
    : undefined;
  const v3LiquidityAmount = v3RemovalAmounts?.liquidity ?? 0n;
  const v3AmountsLoading = v3PositionQuery.isLoading || v3Pool.isLoading;
  const isV3 = protocol === "V3";
  const isCorrectChain = isTargetChainId(chainId);
  const cta = !isConnected ? "Connect Wallet" : !isCorrectChain ? "Switch to BSC Testnet" : isV3 && !v3Position ? "Position not found" : !isV3 && !pair.data?.address ? "Pair not found" : !isV3 && needsApproval ? "Approve LP" : remove.isPending || removeV3.isPending ? "Pending" : "Remove Liquidity";

  function submit() {
    if (isV3) {
      if (v3Position) removeV3.removeLiquidity(v3Position, normalizedPercent);
      return;
    }
    if (needsApproval) {
      approve.approve(lpAmount);
      return;
    }
    remove.removeLiquidity(lpAmount);
  }

  return (
    <Card>
      <div className="detail-head">
        <Button className="icon-btn back-icon" aria-label="Back" onClick={onBack}>←</Button>
      </div>
      <div className="card-head"><div><h2 className="card-title">Remove Liquidity</h2><p className="card-subtitle">{tokenA.symbol} / {tokenB.symbol} {isV3 ? `V3 NFT: #${v3Position?.tokenId ?? "-"}` : <>LP balance: <span className="num">{formatTokenAmountFixed(lpBalance, 18)}</span></>}</p></div></div>
      <div className="pool-card" style={{ boxShadow: "var(--elev-ring)", marginBottom: 16 }}>
        <div className="pair-head">
          <div className="row"><div className="pair-icons"><TokenIcon token={tokenA} /><TokenIcon token={tokenB} /></div><div><h3>{tokenA.symbol} / {tokenB.symbol}</h3><p className="card-subtitle">Selected LP position</p></div></div>
          <strong className="state-value">{normalizedPercent}%</strong>
        </div>
      </div>
      <PercentSlider percent={normalizedPercent} setPercent={onPercent} />
      <div className="info-list">
        {isV3 ? (
          <>
            <Info label={`You receive ${tokenA.symbol}`} value={v3AmountsLoading ? "Loading..." : formatTokenAmountFixed(v3RemovalAmounts?.amountA ?? 0n, tokenA.decimals)} />
            <Info label={`You receive ${tokenB.symbol}`} value={v3AmountsLoading ? "Loading..." : formatTokenAmountFixed(v3RemovalAmounts?.amountB ?? 0n, tokenB.decimals)} />
            <Info label="Liquidity to remove" value={v3PositionQuery.isLoading ? "Loading..." : v3LiquidityAmount.toString()} />
            <Info label="NFT token ID" value={v3Position?.tokenId.toString() ?? "-"} />
            <Info label="Fee tier" value={fee ? `${fee / 10_000}%` : "-"} />
          </>
        ) : (
          <>
            <Info label={`You receive ${tokenA.symbol}`} value={formatTokenAmountFixed(position.amountA, tokenA.decimals)} />
            <Info label={`You receive ${tokenB.symbol}`} value={formatTokenAmountFixed(position.amountB, tokenB.decimals)} />
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
            <Info label="Fee tier" value="0.3%" />
          </>
        )}
      </div>
      <Button variant="primary" className="btn-wide" disabled={!isConnected || !isCorrectChain || (isV3 ? !v3Position || v3LiquidityAmount === 0n : !pair.data?.address || lpAmount === 0n)} isLoading={approve.isPending || remove.isPending || removeV3.isPending} onClick={submit}>
        {approve.isPending ? "Approving" : cta}
      </Button>
    </Card>
  );
}

function PercentSlider({ percent, setPercent }: { percent: number; setPercent: (value: number) => void }) {
  const normalizedPercent = clampPercent(percent);
  const quickValues = [
    { label: "25%", value: 25 },
    { label: "50%", value: 50 },
    { label: "75%", value: 75 },
    { label: "Max", value: 100 }
  ];

  return (
    <div className="liquidity-percent-card">
      <div className="percent-display">{normalizedPercent}%</div>
      <div className="drag-percent-wrap" style={{ "--pct": `${normalizedPercent}%` } as CSSProperties}>
        <div className="drag-percent-track" />
        <div className="drag-percent-thumb" />
        <input
          className="drag-percent-input"
          type="range"
          min="0"
          max="100"
          step="1"
          value={normalizedPercent}
          onChange={(event) => setPercent(clampPercent(event.target.value))}
          aria-label="Remove liquidity percentage"
        />
      </div>
      <div className="drag-percent-actions">
        {quickValues.map((item) => (
          <button
            key={item.value}
            type="button"
            className={normalizedPercent === item.value ? "is-active" : ""}
            onClick={() => setPercent(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function clampPercent(value: number | string) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.min(100, Math.max(0, Math.round(next)));
}
