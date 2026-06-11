import { ArrowLeftRight } from "lucide-react";
import { formatUnits, parseUnits, type Address } from "viem";
import type { Token } from "../../types/token";
import { factoryAddress, routerAddress, v3PositionManagerAddress } from "../../lib/contracts";
import { uniswapV2FactoryAbi } from "../../lib/abis";
import { useMulticallTokenBalances } from "../../hooks/useMulticallTokenBalances";
import { useMulticallTokenAllowances } from "../../hooks/useMulticallTokenAllowances";
import { useApproveToken } from "../../hooks/useApproveToken";
import { useAddLiquidity } from "../../hooks/useAddLiquidity";
import { useAddV3Liquidity } from "../../hooks/useAddV3Liquidity";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useV3PoolInfo } from "../../hooks/useV3PoolInfo";
import { useV3Position } from "../../hooks/useV3Position";
import { useTransactionMessage } from "../../hooks/useTransactionMessage";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { TokenAmountInput } from "../token/TokenAmountInput";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { isSameRouterToken, toRouterTokenAddress } from "../../lib/routerTokens";
import { formatInputPrice, formatPoolPrice, getPairReserves, invertPriceValue, quoteAmountByReserves } from "../../lib/ammMath";
import { toSafeAmount } from "../../lib/format";
import { isTargetChainId } from "../../lib/network";
import { formatV3PoolPrice, getV3DepositAvailability, getV3FullRangeTicks, getV3PoolPriceValue, getV3PositionRangePrices, quoteV3DepositAmount } from "../../lib/v3Routing";
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
  positionTokenId,
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
  positionTokenId?: bigint;
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
  onPositionAdded: (tokenA: Token, tokenB: Token, pairAddress: Address, protocol?: "V2" | "V3", fee?: number) => void;
  onV3FeeTier: (value: string) => void;
  onInitialPrice: (value: string) => void;
  onInitialPriceDirection: (value: V3PriceDirection) => void;
  onRangeMode: (value: V3RangeMode) => void;
  onMinPrice: (value: string) => void;
  onMaxPrice: (value: string) => void;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const balances = useMulticallTokenBalances([tokenA, tokenB]);
  const isV3 = liquidityMode === "V3";
  const liquiditySpender = isV3 ? v3PositionManagerAddress : routerAddress;
  const allowances = useMulticallTokenAllowances([tokenA, tokenB], liquiditySpender);
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const v3Pool = useV3PoolInfo(tokenA, tokenB, v3FeeTier);
  const v3Position = useV3Position(positionTokenId);
  const [priceDirection, setPriceDirection] = useState<"a" | "b">("a");
  const v3PoolExists = Boolean(v3Pool.data?.address);
  const existingV3Position = v3Position.data;
  const isV3Increase = isV3 && positionTokenId !== undefined;
  const effectiveV3PriceDirection: V3PriceDirection = v3PoolExists
    ? priceDirection === "b" ? "quote" : "base"
    : initialPriceDirection;
  const effectiveV3Price = v3PoolExists
    ? getV3PoolPriceValue({ tokenA, tokenB, sqrtPriceX96: v3Pool.data?.sqrtPriceX96, quoteToken: priceDirection })
    : initialPrice;
  const existingFullRange = existingV3Position
    ? (() => {
        const fullRange = getV3FullRangeTicks(existingV3Position.fee);
        return existingV3Position.tickLower === fullRange.tickLower && existingV3Position.tickUpper === fullRange.tickUpper;
      })()
    : false;
  const lockedRangePrices = existingV3Position && !existingFullRange
    ? getV3PositionRangePrices({
        tokenA,
        tokenB,
        tickLower: existingV3Position.tickLower,
        tickUpper: existingV3Position.tickUpper,
        direction: effectiveV3PriceDirection
      })
    : undefined;
  const effectiveRangeMode: V3RangeMode = isV3Increase ? existingFullRange ? "full" : "custom" : rangeMode;
  const effectiveMinPrice = lockedRangePrices?.minPrice ?? minPrice;
  const effectiveMaxPrice = lockedRangePrices?.maxPrice ?? maxPrice;
  const v3DepositAvailability = getV3DepositAvailability({
    price: effectiveV3Price,
    direction: effectiveV3PriceDirection,
    rangeMode: effectiveRangeMode,
    minPrice: effectiveMinPrice,
    maxPrice: effectiveMaxPrice
  });
  const approveA = useApproveToken(tokenA.address, liquiditySpender);
  const approveB = useApproveToken(tokenB.address, liquiditySpender);
  const add = useAddLiquidity(tokenA, tokenB, Number(slippage) * 100, Number(deadline));
  const addV3 = useAddV3Liquidity({
    tokenA,
    tokenB,
    feeLabel: v3FeeTier,
    poolExists: Boolean(v3Pool.data?.address),
    initialPrice: effectiveV3Price,
    initialPriceDirection: effectiveV3PriceDirection,
    rangeMode: effectiveRangeMode,
    minPrice: effectiveMinPrice,
    maxPrice: effectiveMaxPrice,
    positionTokenId,
    slippageBps: Number(slippage) * 100,
    deadlineMinutes: Number(deadline)
  });
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
  useTransactionMessage({
    hash: addV3.hash,
    isSuccess: addV3.isSuccess,
    readableError: addV3.readableError,
    successTitle: "V3 liquidity added",
    failureTitle: "Add V3 liquidity failed"
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
  const isCorrectChain = isTargetChainId(chainId);
  const cta = !isConnected ? "Connect Wallet" : !isCorrectChain ? "Switch to BSC Testnet" : sameRouterToken ? "Select different tokens" : !amountA || !amountB ? "Enter Amounts" : insufficient ? "Insufficient Balance" : needA ? `Approve ${tokenA.symbol}` : needB ? `Approve ${tokenB.symbol}` : add.isPending ? "Pending" : "Supply";
  const currentV3Price = formatV3PoolPrice({
    tokenA,
    tokenB,
    sqrtPriceX96: v3Pool.data?.sqrtPriceX96,
    quoteToken: priceDirection
  });
  const initialPriceRelation = Number(initialPrice) > 0
    ? initialPriceDirection === "quote"
      ? `1 ${tokenA.symbol} = ${initialPrice} ${tokenB.symbol}`
      : `1 ${tokenB.symbol} = ${initialPrice} ${tokenA.symbol}`
    : "";
  const initialPriceReady = !isV3 || v3PoolExists || Number(initialPrice) > 0;
  const rangeReady = !isV3 || effectiveRangeMode === "full" || (Number(effectiveMinPrice) > 0 && Number(effectiveMaxPrice) > Number(effectiveMinPrice));
  const positionReady = !isV3Increase || Boolean(existingV3Position);
  const v3HasAmount = amountA !== "" || amountB !== "";
  const v3Cta = !isConnected ? "Connect Wallet" : !isCorrectChain ? "Switch to BSC Testnet" : sameRouterToken ? "Select different tokens" : !positionReady ? "Loading position" : !initialPriceReady ? "Set initial price" : !rangeReady ? "Set valid range" : !v3HasAmount ? "Enter Amounts" : insufficient ? "Insufficient Balance" : needA ? `Approve ${tokenA.symbol}` : needB ? `Approve ${tokenB.symbol}` : addV3.isPending ? "Pending" : isV3Increase ? "Increase V3 Liquidity" : v3PoolExists ? "Add V3 Liquidity" : "Create V3 Pool";
  const v3Disabled = !isConnected || !isCorrectChain || sameRouterToken || insufficient || !positionReady || v3Cta === "Set initial price" || v3Cta === "Set valid range" || v3Cta === "Enter Amounts";

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
    if (!isV3) return;
    if (!v3DepositAvailability.a && amountA) onAmountA("");
    if (!v3DepositAvailability.b && amountB) onAmountB("");
  }, [amountA, amountB, isV3, onAmountA, onAmountB, v3DepositAvailability.a, v3DepositAvailability.b]);

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

  useEffect(() => {
    if (!addV3.isSuccess || !v3Pool.data?.address) return;
    onPositionAdded(tokenA, tokenB, v3Pool.data.address, "V3", v3Pool.data.fee);
  }, [addV3.isSuccess, onPositionAdded, tokenA, tokenB, v3Pool.data?.address, v3Pool.data?.fee]);

  function setPercentAmount(target: "a" | "b", value: number) {
    if (isV3 && !v3DepositAvailability[target]) return;
    const token = target === "a" ? tokenA : tokenB;
    const balance = balances.data?.[token.address] ?? 0n;
    const next = formatInputAmount(value === 100 ? balance : (balance * BigInt(value)) / 100n, token.decimals);
    setDepositAmount(target, next);
  }

  function setDepositAmount(target: "a" | "b", value: string) {
    if (isV3 && !v3DepositAvailability[target]) return;
    if (target === "a") onAmountA(value);
    else onAmountB(value);

    if (!isV3) return;
    const quoted = quoteV3DepositAmount({
      amount: value,
      input: target,
      price: effectiveV3Price,
      direction: effectiveV3PriceDirection,
      rangeMode: effectiveRangeMode,
      minPrice: effectiveMinPrice,
      maxPrice: effectiveMaxPrice
    });
    if (target === "a") onAmountB(quoted);
    else onAmountA(quoted);
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
    if (initialPrice) onInitialPrice(invertPriceValue(initialPrice));
    onInitialPriceDirection(direction);
  }

  function setV3PoolPriceDirection(direction: "a" | "b") {
    if (direction === priceDirection) return;
    flipCustomRange();
    setPriceDirection(direction);
  }

  return (
    <Card>
      <div className="detail-head">
        <Button className="icon-btn back-icon" aria-label="Back" onClick={onBack}>←</Button>
      </div>
      <div className="card-head">
        <div>
          <h2 className="card-title">{isV3Increase ? "Increase V3 Liquidity" : isV3 ? "Create V3 Position" : "Add Liquidity"}</h2>
          <p className="card-subtitle">{isV3Increase ? `Add liquidity to V3 NFT #${positionTokenId}. Position settings are locked.` : isV3 ? "Set fee, pool initialization, and range before entering token amounts." : "V2 pools use the router addLiquidity flow."}</p>
        </div>
        <span className="network-pill">{isV3 ? "V3" : "0.3%"}</span>
      </div>
      {isV3 ? (
        <div className="v3-config">
          <div className="v3-step">
            <p className="card-subtitle">Fee tier</p>
            <div className="percent-grid fee-grid">
              {["0.05%", "0.3%", "1.0%"].map((tier) => (
                <button key={tier} type="button" disabled={isV3Increase} className={v3FeeTier === tier ? "is-active" : ""} onClick={() => onV3FeeTier(tier)}>{tier}</button>
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
                <button type="button" className={priceDirection === "a" ? "is-active" : ""} onClick={() => setV3PoolPriceDirection("a")}>{tokenA.symbol}</button>
                <button type="button" className={priceDirection === "b" ? "is-active" : ""} onClick={() => setV3PoolPriceDirection("b")}>{tokenB.symbol}</button>
              </div>
            </div>
          ) : (
            <div className="v3-step">
              <div className="initial-price-heading">
                <p className="card-subtitle">Initial price</p>
                {initialPriceRelation ? <strong>{initialPriceRelation}</strong> : null}
              </div>
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
              <button type="button" disabled={isV3Increase} className={effectiveRangeMode === "full" ? "is-active" : ""} onClick={() => onRangeMode("full")}>Full range</button>
              <button type="button" disabled={isV3Increase} className={effectiveRangeMode === "custom" ? "is-active" : ""} onClick={() => onRangeMode("custom")}>Custom range</button>
            </div>
            {effectiveRangeMode === "custom" ? (
              <div className="range-inputs">
                <label><span>Min price</span><input className="plain-input" value={effectiveMinPrice} readOnly={isV3Increase} onChange={(event) => onMinPrice(toSafeAmount(event.target.value))} inputMode="decimal" /></label>
                <label><span>Max price</span><input className="plain-input" value={effectiveMaxPrice} readOnly={isV3Increase} onChange={(event) => onMaxPrice(toSafeAmount(event.target.value))} inputMode="decimal" /></label>
              </div>
            ) : null}
          </div>
          <div className="v3-step">
            <p className="card-subtitle">Deposit amounts</p>
            <div className="v3-token-stage">
              <TokenAmountInput label="Token A" token={tokenA} amount={amountA} balance={balances.data?.[tokenA.address] ?? 0n} disabled={!v3DepositAvailability.a} tokenLocked={isV3Increase} onAmountChange={(value) => setDepositAmount("a", value)} onSelect={onTokenA} />
              <PercentShortcuts disabled={!v3DepositAvailability.a} onSelect={(value) => setPercentAmount("a", value)} />
              <div className="swap-arrow">+</div>
              <TokenAmountInput label="Token B" token={tokenB} amount={amountB} balance={balances.data?.[tokenB.address] ?? 0n} disabled={!v3DepositAvailability.b} tokenLocked={isV3Increase} onAmountChange={(value) => setDepositAmount("b", value)} onSelect={onTokenB} />
              <PercentShortcuts disabled={!v3DepositAvailability.b} onSelect={(value) => setPercentAmount("b", value)} />
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
        disabled={isV3 ? v3Disabled : (!isConnected || !isCorrectChain || !amountA || !amountB || insufficient || sameRouterToken)}
        isLoading={approveA.isPending || approveB.isPending || (isV3 ? addV3.isPending : add.isPending)}
        onClick={() => {
          if (isV3) {
            return needA ? approveA.approve(parsed.a) : needB ? approveB.approve(parsed.b) : addV3.addLiquidity(amountA, amountB);
          }
          return needA ? approveA.approve(parsed.a) : needB ? approveB.approve(parsed.b) : add.addLiquidity(amountA, amountB);
        }}
      >
        {approveA.isPending || approveB.isPending ? "Approving" : isV3 ? v3Cta : cta}
      </Button>
    </Card>
  );
}

function PercentShortcuts({ disabled = false, onSelect }: { disabled?: boolean; onSelect: (value: number) => void }) {
  return (
    <div className={`liquidity-shortcuts${disabled ? " is-disabled" : ""}`}>
      {[25, 50, 75].map((value) => (
        <button type="button" key={value} disabled={disabled} onClick={() => onSelect(value)}>{value}%</button>
      ))}
      <button type="button" disabled={disabled} onClick={() => onSelect(100)}>Max</button>
    </div>
  );
}

function formatInputAmount(value: bigint, decimals: number) {
  const raw = formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}
