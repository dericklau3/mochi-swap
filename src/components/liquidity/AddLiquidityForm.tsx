import { ArrowLeftRight } from "lucide-react";
import { formatUnits, parseUnits, type Address } from "viem";
import type { Token } from "../../types/token";
import { factoryAddress, routerAddress } from "../../lib/contracts";
import { uniswapV2FactoryAbi } from "../../lib/abis";
import { useMulticallTokenBalances } from "../../hooks/useMulticallTokenBalances";
import { useMulticallTokenAllowances } from "../../hooks/useMulticallTokenAllowances";
import { useApproveToken } from "../../hooks/useApproveToken";
import { useAddLiquidity } from "../../hooks/useAddLiquidity";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useTransactionMessage } from "../../hooks/useTransactionMessage";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { TokenAmountInput } from "../token/TokenAmountInput";
import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { isSameRouterToken, toRouterTokenAddress } from "../../lib/routerTokens";
import { formatInputPrice, formatPoolPrice, getPairReserves, quoteAmountByReserves } from "../../lib/ammMath";
import { toSafeAmount } from "../../lib/format";
import { useMessage } from "../ui/messageContext";
import type { LiquidityMode } from "./CreatePositionModal";
import type { V3PriceDirection, V3RangeMode } from "../../pages/AddLiquidityPage";

export function AddLiquidityForm({
  tokenA,
  tokenB,
  amountA,
  amountB,
  slippage,
  deadline,
  liquidityMode,
  v3FeeTier,
  initialPrice,
  initialPriceDirection,
  rangeMode,
  minPrice,
  maxPrice,
  onAmountA,
  onAmountB,
  onTokenA,
  onTokenB,
  onBack,
  onPositionAdded,
  onV3FeeTier,
  onInitialPrice,
  onInitialPriceDirection,
  onRangeMode,
  onMinPrice,
  onMaxPrice
}: {
  tokenA: Token;
  tokenB: Token;
  amountA: string;
  amountB: string;
  slippage: string;
  deadline: string;
  liquidityMode: LiquidityMode;
  v3FeeTier: string;
  initialPrice: string;
  initialPriceDirection: V3PriceDirection;
  rangeMode: V3RangeMode;
  minPrice: string;
  maxPrice: string;
  onAmountA: (value: string) => void;
  onAmountB: (value: string) => void;
  onTokenA: () => void;
  onTokenB: () => void;
  onBack: () => void;
  onPositionAdded: (tokenA: Token, tokenB: Token, pairAddress: Address) => void;
  onV3FeeTier: (value: string) => void;
  onInitialPrice: (value: string) => void;
  onInitialPriceDirection: (value: V3PriceDirection) => void;
  onRangeMode: (value: V3RangeMode) => void;
  onMinPrice: (value: string) => void;
  onMaxPrice: (value: string) => void;
}) {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { pushMessage } = useMessage();
  const balances = useMulticallTokenBalances([tokenA, tokenB]);
  const allowances = useMulticallTokenAllowances([tokenA, tokenB], routerAddress);
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const approveA = useApproveToken(tokenA.address, routerAddress);
  const approveB = useApproveToken(tokenB.address, routerAddress);
  const add = useAddLiquidity(tokenA, tokenB, Number(slippage) * 100, Number(deadline));
  const [priceDirection, setPriceDirection] = useState<"a" | "b">("a");
  const isV3 = liquidityMode === "V3";
  useTransactionMessage({
    hash: approveA.hash,
    isSuccess: approveA.isSuccess,
    readableError: approveA.readableError,
    successTitle: `${tokenA.symbol} approved`,
    failureTitle: `${tokenA.symbol} approval failed`
  });
  useTransactionMessage({
    hash: approveB.hash,
    isSuccess: approveB.isSuccess,
    readableError: approveB.readableError,
    successTitle: `${tokenB.symbol} approved`,
    failureTitle: `${tokenB.symbol} approval failed`
  });
  useTransactionMessage({
    hash: add.hash,
    isSuccess: add.isSuccess,
    readableError: add.readableError,
    successTitle: "Liquidity added",
    failureTitle: "Add liquidity failed"
  });
  const reserves = useMemo(() => getPairReserves(pair.data, tokenA, tokenB), [pair.data, tokenA, tokenB]);
  const hasPoolLiquidity = Boolean(reserves && reserves.reserveA > 0n && reserves.reserveB > 0n);
  const poolPrice = (() => {
    if (reserves && hasPoolLiquidity) {
      return priceDirection === "a"
        ? formatPoolPrice(tokenA, tokenB, reserves.reserveA, reserves.reserveB)
        : formatPoolPrice(tokenB, tokenA, reserves.reserveB, reserves.reserveA);
    }
    return priceDirection === "a"
      ? formatInputPrice(tokenA, tokenB, amountA, amountB)
      : formatInputPrice(tokenB, tokenA, amountB, amountA);
  })();
  const showPrice = poolPrice !== "-";
  const parsed = useMemo(() => {
    try {
      return { a: amountA ? parseUnits(amountA, tokenA.decimals) : 0n, b: amountB ? parseUnits(amountB, tokenB.decimals) : 0n };
    } catch {
      return { a: 0n, b: 0n };
    }
  }, [amountA, amountB, tokenA.decimals, tokenB.decimals]);
  const sameRouterToken = isSameRouterToken(tokenA, tokenB);
  const needA = !tokenA.isNative && parsed.a > 0n && (allowances.data?.[tokenA.address] ?? 0n) < parsed.a;
  const needB = !tokenB.isNative && parsed.b > 0n && (allowances.data?.[tokenB.address] ?? 0n) < parsed.b;
  const insufficient = parsed.a > (balances.data?.[tokenA.address] ?? 0n) || parsed.b > (balances.data?.[tokenB.address] ?? 0n);
  const cta = !isConnected ? "Connect Wallet" : sameRouterToken ? "Select different tokens" : !amountA || !amountB ? "Enter Amounts" : insufficient ? "Insufficient Balance" : needA ? `Approve ${tokenA.symbol}` : needB ? `Approve ${tokenB.symbol}` : add.isPending ? "Pending" : "Supply";
  const v3PoolExists = isV3 && v3FeeTier === "0.05%";
  const currentV3Price = poolPrice === "-" ? `1 ${tokenA.symbol} = - ${tokenB.symbol}` : poolPrice;
  const initialPriceReady = !isV3 || v3PoolExists || Number(initialPrice) > 0;
  const rangeReady = !isV3 || rangeMode === "full" || (Number(minPrice) > 0 && Number(maxPrice) > Number(minPrice));
  const v3HasAmount = amountA !== "" || amountB !== "";
  const v3Cta = !isConnected ? "Connect Wallet" : sameRouterToken ? "Select different tokens" : !initialPriceReady ? "Set initial price" : !rangeReady ? "Set valid range" : !v3HasAmount ? "Enter Amounts" : v3PoolExists ? "Add V3 Liquidity" : "Create V3 Pool";
  const v3Disabled = sameRouterToken || v3Cta === "Set initial price" || v3Cta === "Set valid range" || v3Cta === "Enter Amounts";

  useEffect(() => {
    if (isV3) return;
    if (!reserves || !hasPoolLiquidity) return;
    if (!amountA) {
      if (amountB) onAmountB("");
      return;
    }
    try {
      const quotedB = quoteAmountByReserves(amountA, tokenA.decimals, tokenB.decimals, reserves.reserveA, reserves.reserveB);
      if (quotedB !== amountB) onAmountB(quotedB);
    } catch {
      // Invalid transient input is already handled by parsed amount state.
    }
  }, [amountA, amountB, hasPoolLiquidity, isV3, onAmountB, reserves, tokenA.decimals, tokenB.decimals]);

  useEffect(() => {
    let cancelled = false;
    if (!add.isSuccess || !add.hash || !publicClient) return;
    const readPair = async () => {
      const pairAddress = await publicClient.readContract({
        address: factoryAddress,
        abi: uniswapV2FactoryAbi,
        functionName: "getPair",
        args: [toRouterTokenAddress(tokenA), toRouterTokenAddress(tokenB)]
      }) as Address;
      if (!cancelled) onPositionAdded(tokenA, tokenB, pairAddress);
    };
    void readPair();
    return () => {
      cancelled = true;
    };
  }, [add.hash, add.isSuccess, onPositionAdded, publicClient, tokenA, tokenB]);

  function setPercentAmount(target: "a" | "b", value: number) {
    const token = target === "a" ? tokenA : tokenB;
    const balance = balances.data?.[token.address] ?? 0n;
    const next = formatInputAmount(value === 100 ? balance : (balance * BigInt(value)) / 100n, token.decimals);
    if (target === "a") onAmountA(next);
    else onAmountB(next);
  }

  function formatRangeValue(value: string) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return "";
    return numericValue >= 1 ? String(Number(numericValue.toFixed(6))) : String(Number(numericValue.toFixed(10)));
  }

  function flipCustomRange() {
    if (rangeMode !== "custom") return;
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) return;
    onMinPrice(formatRangeValue(String(1 / max)));
    onMaxPrice(formatRangeValue(String(1 / min)));
  }

  function setV3InitialPriceDirection(direction: V3PriceDirection) {
    if (direction === initialPriceDirection) return;
    flipCustomRange();
    onInitialPriceDirection(direction);
  }

  function showV3NotConfigured() {
    pushMessage({
      tone: "error",
      title: "V3 contracts not configured",
      description: "V3 create position UI is ready, but no V3 position manager contract address has been configured."
    });
  }

  return (
    <Card>
      <div className="detail-head">
        <Button className="icon-btn back-icon" aria-label="Back" onClick={onBack}>←</Button>
      </div>
      <div className="card-head">
        <div>
          <h2 className="card-title">{isV3 ? "Create V3 Position" : "Add Liquidity"}</h2>
          <p className="card-subtitle">{isV3 ? "Set fee, pool initialization, and range before entering token amounts." : "V2 pools use the router addLiquidity flow."}</p>
        </div>
        <span className="network-pill">{isV3 ? "V3" : "0.3%"}</span>
      </div>
      {isV3 ? (
        <div className="v3-config">
          <div className="v3-step">
            <p className="card-subtitle">Fee tier</p>
            <div className="percent-grid fee-grid">
              {["0.05%", "0.3%", "1.0%"].map((tier) => (
                <button key={tier} type="button" className={v3FeeTier === tier ? "is-active" : ""} onClick={() => onV3FeeTier(tier)}>{tier}</button>
              ))}
            </div>
          </div>
          {v3PoolExists ? (
            <div className="pool-check price-card">
              <div className="price-card-copy">
                <strong>Current price</strong>
                <p>{currentV3Price}</p>
              </div>
              <div className="price-direction" aria-label="Price display direction">
                <button type="button" className={priceDirection === "a" ? "is-active" : ""} onClick={() => setPriceDirection("a")}>{tokenA.symbol}</button>
                <button type="button" className={priceDirection === "b" ? "is-active" : ""} onClick={() => setPriceDirection("b")}>{tokenB.symbol}</button>
              </div>
            </div>
          ) : (
            <div className="v3-step">
              <p className="card-subtitle">Initial price</p>
              <div className="pool-check price-card is-new initial-price-card">
                <p className="initial-price-line">
                  <input className="initial-price-input" value={initialPrice} onChange={(event) => onInitialPrice(toSafeAmount(event.target.value))} inputMode="decimal" placeholder="0.00" aria-label="Initial price" />
                </p>
                <div className="price-direction" aria-label="Initial price direction">
                  <button type="button" className={initialPriceDirection === "base" ? "is-active" : ""} onClick={() => setV3InitialPriceDirection("base")}>{tokenA.symbol}</button>
                  <button type="button" className={initialPriceDirection === "quote" ? "is-active" : ""} onClick={() => setV3InitialPriceDirection("quote")}>{tokenB.symbol}</button>
                </div>
              </div>
            </div>
          )}
          <div className="v3-step">
            <p className="card-subtitle">Price range</p>
            <div className="segmented range-segment">
              <button type="button" className={rangeMode === "full" ? "is-active" : ""} onClick={() => onRangeMode("full")}>Full range</button>
              <button type="button" className={rangeMode === "custom" ? "is-active" : ""} onClick={() => onRangeMode("custom")}>Custom range</button>
            </div>
            {rangeMode === "custom" ? (
              <div className="range-inputs">
                <label><span>Min price</span><input className="plain-input" value={minPrice} onChange={(event) => onMinPrice(toSafeAmount(event.target.value))} inputMode="decimal" /></label>
                <label><span>Max price</span><input className="plain-input" value={maxPrice} onChange={(event) => onMaxPrice(toSafeAmount(event.target.value))} inputMode="decimal" /></label>
              </div>
            ) : null}
          </div>
          <div className="v3-step">
            <p className="card-subtitle">Deposit amounts</p>
            <div className="v3-token-stage">
              <TokenAmountInput label="Token A" token={tokenA} amount={amountA} balance={balances.data?.[tokenA.address] ?? 0n} onAmountChange={onAmountA} onSelect={onTokenA} />
              <PercentShortcuts onSelect={(value) => setPercentAmount("a", value)} />
              <div className="swap-arrow">+</div>
              <TokenAmountInput label="Token B" token={tokenB} amount={amountB} balance={balances.data?.[tokenB.address] ?? 0n} onAmountChange={onAmountB} onSelect={onTokenB} />
              <PercentShortcuts onSelect={(value) => setPercentAmount("b", value)} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <TokenAmountInput label="Token A" token={tokenA} amount={amountA} balance={balances.data?.[tokenA.address] ?? 0n} onAmountChange={onAmountA} onSelect={onTokenA} />
          <PercentShortcuts onSelect={(value) => setPercentAmount("a", value)} />
          <div className="swap-arrow">+</div>
          <TokenAmountInput label="Token B" token={tokenB} amount={amountB} balance={balances.data?.[tokenB.address] ?? 0n} onAmountChange={onAmountB} onSelect={onTokenB} />
          <PercentShortcuts onSelect={(value) => setPercentAmount("b", value)} />
        </>
      )}
      {!isV3 && showPrice ? (
        <div className="info-list">
          <div className="info-line">
            <span>Price</span>
            <strong className="price-value">
              {poolPrice}
              <button type="button" className="mini-btn price-toggle" aria-label="Switch price direction" onClick={() => setPriceDirection((current) => current === "a" ? "b" : "a")}>
                <ArrowLeftRight size={14} strokeWidth={2.4} />
              </button>
            </strong>
          </div>
        </div>
      ) : null}
      {sameRouterToken ? <p className="notice warn">BNB and WBNB use the same wrapped asset. Select a different token pair.</p> : null}
      <Button
        variant="primary"
        className="btn-wide"
        disabled={isV3 ? v3Disabled : (!isConnected || !amountA || !amountB || insufficient || sameRouterToken)}
        isLoading={!isV3 && (approveA.isPending || approveB.isPending || add.isPending)}
        onClick={() => {
          if (isV3) {
            if (!isConnected) return;
            showV3NotConfigured();
            return;
          }
          return needA ? approveA.approve(parsed.a) : needB ? approveB.approve(parsed.b) : add.addLiquidity(amountA, amountB);
        }}
      >
        {isV3 ? v3Cta : approveA.isPending || approveB.isPending ? "Approving" : cta}
      </Button>
    </Card>
  );
}

function PercentShortcuts({ onSelect }: { onSelect: (value: number) => void }) {
  return (
    <div className="liquidity-shortcuts">
      {[25, 50, 75].map((value) => (
        <button key={value} onClick={() => onSelect(value)}>{value}%</button>
      ))}
      <button onClick={() => onSelect(100)}>Max</button>
    </div>
  );
}

function formatInputAmount(value: bigint, decimals: number) {
  const raw = formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}
