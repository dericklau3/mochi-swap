import { ArrowLeftRight } from "lucide-react";
import type { Token } from "../../types/token";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useApproveToken } from "../../hooks/useApproveToken";
import { useRemoveLiquidity } from "../../hooks/useRemoveLiquidity";
import { useTransactionMessage } from "../../hooks/useTransactionMessage";
import { erc20Abi, uniswapV2PairAbi } from "../../lib/abis";
import { routerAddress } from "../../lib/contracts";
import { calculateLiquidityPosition, formatPoolPrice, getPairReserves } from "../../lib/ammMath";
import { formatTokenAmountFixed } from "../../lib/format";
import { getReadableError } from "../../lib/errors";
import { buildLiquidityPermitTypedData, parsePermitSignature } from "../../lib/permit";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Info } from "../swap/SwapPreview";
import { TokenIcon } from "../token/TokenIcon";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useAccount, useChainId, usePublicClient, useSignTypedData } from "wagmi";

export function RemoveLiquidityForm({ tokenA, tokenB, percent, onPercent, onBack }: { tokenA: Token; tokenB: Token; percent: number; onPercent: (value: number) => void; onBack: () => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const signPermit = useSignTypedData();
  const [priceDirection, setPriceDirection] = useState<"base" | "quote">("base");
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const approve = useApproveToken(pair.data?.address ?? undefined, routerAddress, true);
  const remove = useRemoveLiquidity(tokenA, tokenB);
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
    isSuccess: false,
    readableError: signPermit.error ? getReadableError(signPermit.error) : undefined,
    successTitle: "Permit signed",
    failureTitle: "Permit signature failed"
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
  const cta = !isConnected ? "Connect Wallet" : !pair.data?.address ? "Pair not found" : remove.isPending ? "Pending" : "Remove Liquidity";

  async function removeWithPermit() {
    if (!address || !publicClient || !pair.data?.address || lpAmount === 0n) return;
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      const [nonce, lpName] = await Promise.all([
        publicClient.readContract({ address: pair.data.address, abi: uniswapV2PairAbi, functionName: "nonces", args: [address] }) as Promise<bigint>,
        publicClient.readContract({ address: pair.data.address, abi: erc20Abi, functionName: "name" }).catch(() => "Uniswap V2") as Promise<string>
      ]);
      const signature = await signPermit.signTypedDataAsync(buildLiquidityPermitTypedData({
        chainId,
        pairAddress: pair.data.address,
        owner: address,
        spender: routerAddress,
        value: lpAmount,
        nonce,
        deadline,
        name: lpName
      }));
      remove.removeLiquidityWithPermit(lpAmount, {
        ...parsePermitSignature(signature),
        approveMax: false,
        deadline
      });
    } catch {
      // Wagmi exposes signature errors through signPermit.error for the message toast.
    }
  }

  function submit() {
    if (needsApproval) {
      void removeWithPermit();
      return;
    }
    remove.removeLiquidity(lpAmount);
  }

  return (
    <Card>
      <div className="detail-head">
        <Button className="icon-btn back-icon" aria-label="Back" onClick={onBack}>←</Button>
      </div>
      <div className="card-head"><div><h2 className="card-title">Remove Liquidity</h2><p className="card-subtitle">{tokenA.symbol} / {tokenB.symbol} LP balance: <span className="num">{formatTokenAmountFixed(lpBalance, 18)}</span></p></div></div>
      <div className="pool-card" style={{ boxShadow: "var(--elev-ring)", marginBottom: 16 }}>
        <div className="pair-head">
          <div className="row"><div className="pair-icons"><TokenIcon token={tokenA} /><TokenIcon token={tokenB} /></div><div><h3>{tokenA.symbol} / {tokenB.symbol}</h3><p className="card-subtitle">Selected LP position</p></div></div>
          <strong className="state-value">{normalizedPercent}%</strong>
        </div>
      </div>
      <PercentSlider percent={normalizedPercent} setPercent={onPercent} />
      <div className="info-list">
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
      </div>
      <Button variant="primary" className="btn-wide" disabled={!isConnected || !pair.data?.address || lpAmount === 0n} isLoading={approve.isPending || remove.isPending || signPermit.isPending} onClick={submit}>
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
