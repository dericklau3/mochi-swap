import type { Address } from "viem";
import { maxUint160, parseUnits } from "viem";
import type { Token } from "../types/token";
import { toRouterTokenAddress } from "./routerTokens";

export type V3FeeLabel = "0.05%" | "0.3%" | "1.0%";

export type V3FeeOption = {
  label: V3FeeLabel;
  fee: number;
  tickSpacing: number;
};

export type SwapRouteQuote =
  | { protocol: "V2"; amountOut?: bigint }
  | { protocol: "V3"; fee: number; amountOut?: bigint };

const minTick = -887272;
const maxTick = 887272;
const q96 = 2n ** 96n;
const q192 = q96 ** 2n;
const maxUint256 = (1n << 256n) - 1n;

export const v3FeeOptions: V3FeeOption[] = [
  { label: "0.05%", fee: 500, tickSpacing: 10 },
  { label: "0.3%", fee: 3000, tickSpacing: 60 },
  { label: "1.0%", fee: 10_000, tickSpacing: 200 }
];

export function chooseBestSwapRoute<T extends SwapRouteQuote>(quotes: T[]) {
  return quotes.reduce<T | undefined>((best, quote) => {
    if (!quote.amountOut || quote.amountOut <= 0n) return best;
    if (!best?.amountOut || quote.amountOut > best.amountOut) return quote;
    return best;
  }, undefined);
}

export function getV3FeeOption(labelOrFee: string | number) {
  const normalized = typeof labelOrFee === "number" ? labelOrFee : labelOrFee.trim();
  return v3FeeOptions.find((option) => option.label === normalized || option.fee === normalized) ?? v3FeeOptions[1];
}

export function getV3FullRangeTicks(labelOrFee: string | number) {
  const { tickSpacing } = getV3FeeOption(labelOrFee);
  return {
    tickLower: Math.ceil(minTick / tickSpacing) * tickSpacing,
    tickUpper: Math.floor(maxTick / tickSpacing) * tickSpacing
  };
}

export function getV3PositionRangeStatus({
  liquidity,
  currentTick,
  tickLower,
  tickUpper,
  fee
}: {
  liquidity: bigint;
  currentTick?: number;
  tickLower: number;
  tickUpper: number;
  fee: number;
}) {
  if (liquidity <= 0n) return "Closed";
  const fullRange = getV3FullRangeTicks(fee);
  if (tickLower === fullRange.tickLower && tickUpper === fullRange.tickUpper) return "Full range";
  if (currentTick !== undefined && (currentTick < tickLower || currentTick >= tickUpper)) return "Out of range";
  return currentTick === undefined ? "V3 range" : "In range";
}

export function getV3PositionRangePrices({
  tokenA,
  tokenB,
  tickLower,
  tickUpper,
  direction
}: {
  tokenA: Token;
  tokenB: Token;
  tickLower: number;
  tickUpper: number;
  direction: "base" | "quote";
}) {
  const sorted = sortV3Tokens(tokenA, tokenB);
  const decimalScale = 10 ** (sorted.token1.decimals - sorted.token0.decimals);
  const token1PerToken0AtTick = (tick: number) => 1.0001 ** tick * decimalScale;
  const lowerToken1PerToken0 = token1PerToken0AtTick(tickLower);
  const upperToken1PerToken0 = token1PerToken0AtTick(tickUpper);
  const lowerBPerA = sorted.aIsToken0 ? lowerToken1PerToken0 : 1 / upperToken1PerToken0;
  const upperBPerA = sorted.aIsToken0 ? upperToken1PerToken0 : 1 / lowerToken1PerToken0;
  const min = direction === "quote" ? lowerBPerA : 1 / upperBPerA;
  const max = direction === "quote" ? upperBPerA : 1 / lowerBPerA;
  return {
    minPrice: formatV3DepositAmount(min),
    maxPrice: formatV3DepositAmount(max)
  };
}

export function sortV3Tokens(tokenA: Token, tokenB: Token) {
  const addressA = toRouterTokenAddress(tokenA);
  const addressB = toRouterTokenAddress(tokenB);
  const aIsToken0 = addressA.toLowerCase() < addressB.toLowerCase();
  return {
    token0: aIsToken0 ? tokenA : tokenB,
    token1: aIsToken0 ? tokenB : tokenA,
    token0Address: (aIsToken0 ? addressA : addressB) as Address,
    token1Address: (aIsToken0 ? addressB : addressA) as Address,
    aIsToken0
  };
}

export function formatV3PoolPrice({
  tokenA,
  tokenB,
  sqrtPriceX96,
  quoteToken
}: {
  tokenA: Token;
  tokenB: Token;
  sqrtPriceX96?: bigint;
  quoteToken: "a" | "b";
}) {
  const base = quoteToken === "b" ? tokenA : tokenB;
  const quote = quoteToken === "b" ? tokenB : tokenA;
  const price = getV3PoolPriceValue({ tokenA, tokenB, sqrtPriceX96, quoteToken });
  return `1 ${base.symbol} = ${price || "-"} ${quote.symbol}`;
}

export function getV3PoolPriceValue({
  tokenA,
  tokenB,
  sqrtPriceX96,
  quoteToken
}: {
  tokenA: Token;
  tokenB: Token;
  sqrtPriceX96?: bigint;
  quoteToken: "a" | "b";
}) {
  if (!sqrtPriceX96 || sqrtPriceX96 <= 0n) return "";
  const sorted = sortV3Tokens(tokenA, tokenB);
  const sqrtPriceSquared = sqrtPriceX96 * sqrtPriceX96;
  const precision = 10n ** 12n;
  const token1PerToken0 = (
    sqrtPriceSquared * 10n ** BigInt(sorted.token0.decimals) * precision
  ) / (
    q192 * 10n ** BigInt(sorted.token1.decimals)
  );
  const token0PerToken1 = (
    q192 * 10n ** BigInt(sorted.token1.decimals) * precision
  ) / (
    sqrtPriceSquared * 10n ** BigInt(sorted.token0.decimals)
  );
  const tokenBPerTokenA = sorted.aIsToken0 ? token1PerToken0 : token0PerToken1;
  const tokenAPerTokenB = sorted.aIsToken0 ? token0PerToken1 : token1PerToken0;

  return quoteToken === "b"
    ? formatScaledPrice(tokenBPerTokenA, precision)
    : formatScaledPrice(tokenAPerTokenB, precision);
}

export function applySlippage(amount: bigint, slippageBps: number) {
  return amount - (amount * BigInt(Math.max(0, Math.round(slippageBps)))) / 10_000n;
}

export function getSqrtRatioAtTick(tick: number) {
  const normalizedTick = Math.trunc(tick);
  const absTick = Math.abs(normalizedTick);
  if (absTick > maxTick) throw new Error("V3 tick is out of range.");

  let ratio = absTick & 0x1 ? 0xfffcb933bd6fad37aa2d162d1a594001n : 0x100000000000000000000000000000000n;
  if (absTick & 0x2) ratio = ratio * 0xfff97272373d413259a46990580e213an >> 128n;
  if (absTick & 0x4) ratio = ratio * 0xfff2e50f5f656932ef12357cf3c7fdccn >> 128n;
  if (absTick & 0x8) ratio = ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0n >> 128n;
  if (absTick & 0x10) ratio = ratio * 0xffcb9843d60f6159c9db58835c926644n >> 128n;
  if (absTick & 0x20) ratio = ratio * 0xff973b41fa98c081472e6896dfb254c0n >> 128n;
  if (absTick & 0x40) ratio = ratio * 0xff2ea16466c96a3843ec78b326b52861n >> 128n;
  if (absTick & 0x80) ratio = ratio * 0xfe5dee046a99a2a811c461f1969c3053n >> 128n;
  if (absTick & 0x100) ratio = ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4n >> 128n;
  if (absTick & 0x200) ratio = ratio * 0xf987a7253ac413176f2b074cf7815e54n >> 128n;
  if (absTick & 0x400) ratio = ratio * 0xf3392b0822b70005940c7a398e4b70f3n >> 128n;
  if (absTick & 0x800) ratio = ratio * 0xe7159475a2c29b7443b29c7fa6e889d9n >> 128n;
  if (absTick & 0x1000) ratio = ratio * 0xd097f3bdfd2022b8845ad8f792aa5825n >> 128n;
  if (absTick & 0x2000) ratio = ratio * 0xa9f746462d870fdf8a65dc1f90e061e5n >> 128n;
  if (absTick & 0x4000) ratio = ratio * 0x70d869a156d2a1b890bb3df62baf32f7n >> 128n;
  if (absTick & 0x8000) ratio = ratio * 0x31be135f97d08fd981231505542fcfa6n >> 128n;
  if (absTick & 0x10000) ratio = ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9n >> 128n;
  if (absTick & 0x20000) ratio = ratio * 0x5d6af8dedb81196699c329225ee604n >> 128n;
  if (absTick & 0x40000) ratio = ratio * 0x2216e584f5fa1ea926041bedfe98n >> 128n;
  if (absTick & 0x80000) ratio = ratio * 0x48a170391f7dc42444e8fa2n >> 128n;
  if (normalizedTick > 0) ratio = maxUint256 / ratio;

  const remainderMask = (1n << 32n) - 1n;
  return (ratio >> 32n) + (ratio & remainderMask ? 1n : 0n);
}

export function calculateV3PositionAmounts({
  liquidity,
  sqrtPriceX96,
  sqrtRatioAX96,
  sqrtRatioBX96
}: {
  liquidity: bigint;
  sqrtPriceX96: bigint;
  sqrtRatioAX96: bigint;
  sqrtRatioBX96: bigint;
}) {
  const [sqrtLowerX96, sqrtUpperX96] = sqrtRatioAX96 <= sqrtRatioBX96
    ? [sqrtRatioAX96, sqrtRatioBX96]
    : [sqrtRatioBX96, sqrtRatioAX96];
  const amount0 = (sqrtA: bigint, sqrtB: bigint) => (
    ((liquidity << 96n) * (sqrtB - sqrtA)) / sqrtB / sqrtA
  );
  const amount1 = (sqrtA: bigint, sqrtB: bigint) => (
    liquidity * (sqrtB - sqrtA) / q96
  );

  if (sqrtPriceX96 <= sqrtLowerX96) {
    return { amount0: amount0(sqrtLowerX96, sqrtUpperX96), amount1: 0n };
  }
  if (sqrtPriceX96 < sqrtUpperX96) {
    return {
      amount0: amount0(sqrtPriceX96, sqrtUpperX96),
      amount1: amount1(sqrtLowerX96, sqrtPriceX96)
    };
  }
  return { amount0: 0n, amount1: amount1(sqrtLowerX96, sqrtUpperX96) };
}

export function calculateV3RemovalAmounts({
  liquidity,
  percent,
  sqrtPriceX96,
  sqrtRatioAX96,
  sqrtRatioBX96,
  tokensOwed0 = 0n,
  tokensOwed1 = 0n,
  aIsToken0
}: {
  liquidity: bigint;
  percent: number;
  sqrtPriceX96: bigint;
  sqrtRatioAX96: bigint;
  sqrtRatioBX96: bigint;
  tokensOwed0?: bigint;
  tokensOwed1?: bigint;
  aIsToken0: boolean;
}) {
  const normalizedPercent = Math.min(100, Math.max(0, Math.round(percent)));
  const liquidityToRemove = liquidity * BigInt(normalizedPercent) / 100n;
  const removed = calculateV3PositionAmounts({
    liquidity: liquidityToRemove,
    sqrtPriceX96,
    sqrtRatioAX96,
    sqrtRatioBX96
  });
  const amount0 = removed.amount0 + tokensOwed0;
  const amount1 = removed.amount1 + tokensOwed1;
  return {
    liquidity: liquidityToRemove,
    amountA: aIsToken0 ? amount0 : amount1,
    amountB: aIsToken0 ? amount1 : amount0
  };
}

export function getV3InitialSqrtPriceX96({
  tokenA,
  tokenB,
  price,
  direction
}: {
  tokenA: Token;
  tokenB: Token;
  price: string;
  direction: "base" | "quote";
}) {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return undefined;
  const sorted = sortV3Tokens(tokenA, tokenB);
  const priceTokenBPerTokenA = direction === "quote" ? numericPrice : 1 / numericPrice;
  const token1PerToken0 = sorted.aIsToken0 ? priceTokenBPerTokenA : 1 / priceTokenBPerTokenA;
  const decimalAdjustedPrice = token1PerToken0 * 10 ** (sorted.token0.decimals - sorted.token1.decimals);
  if (!Number.isFinite(decimalAdjustedPrice) || decimalAdjustedPrice <= 0) return undefined;
  const sqrtPrice = Math.sqrt(decimalAdjustedPrice);
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * Number(q96)));
  if (sqrtPriceX96 <= 0n) return 1n;
  return sqrtPriceX96 > maxUint160 ? maxUint160 : sqrtPriceX96;
}

export function getNearestUsableTick(price: number, tickSpacing: number) {
  if (!Number.isFinite(price) || price <= 0) return 0;
  const rawTick = Math.log(price) / Math.log(1.0001);
  return Math.max(Math.ceil(minTick / tickSpacing) * tickSpacing, Math.min(Math.floor(maxTick / tickSpacing) * tickSpacing, Math.round(rawTick / tickSpacing) * tickSpacing));
}

export function getV3CustomRangeTicks({
  tokenA,
  tokenB,
  minPrice,
  maxPrice,
  direction,
  fee
}: {
  tokenA: Token;
  tokenB: Token;
  minPrice: string;
  maxPrice: string;
  direction: "base" | "quote";
  fee: string | number;
}) {
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= min) {
    return getV3FullRangeTicks(fee);
  }
  const sorted = sortV3Tokens(tokenA, tokenB);
  const toToken1PerToken0 = (priceTokenBPerTokenA: number) => {
    const token1PerToken0 = sorted.aIsToken0 ? priceTokenBPerTokenA : 1 / priceTokenBPerTokenA;
    return token1PerToken0 * 10 ** (sorted.token0.decimals - sorted.token1.decimals);
  };
  const lowerPrice = direction === "quote" ? min : 1 / max;
  const upperPrice = direction === "quote" ? max : 1 / min;
  const { tickSpacing } = getV3FeeOption(fee);
  const lower = getNearestUsableTick(toToken1PerToken0(lowerPrice), tickSpacing);
  const upper = getNearestUsableTick(toToken1PerToken0(upperPrice), tickSpacing);
  return lower < upper ? { tickLower: lower, tickUpper: upper } : getV3FullRangeTicks(fee);
}

export function quoteV3DepositAmount({
  amount,
  input,
  price,
  direction,
  rangeMode,
  minPrice,
  maxPrice
}: {
  amount: string;
  input: "a" | "b";
  price: string;
  direction: "base" | "quote";
  rangeMode: "full" | "custom";
  minPrice: string;
  maxPrice: string;
}) {
  const numericAmount = Number(amount);
  const enteredPrice = Number(price);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !Number.isFinite(enteredPrice) || enteredPrice <= 0) return "";

  const priceBPerA = direction === "quote" ? enteredPrice : 1 / enteredPrice;
  if (rangeMode === "full") {
    return formatV3DepositAmount(input === "a" ? numericAmount * priceBPerA : numericAmount / priceBPerA);
  }

  let lower = 0;
  let upper = Number.POSITIVE_INFINITY;
  const enteredMin = Number(minPrice);
  const enteredMax = Number(maxPrice);
  if (!Number.isFinite(enteredMin) || !Number.isFinite(enteredMax) || enteredMin <= 0 || enteredMax <= enteredMin) return "";
  lower = direction === "quote" ? enteredMin : 1 / enteredMax;
  upper = direction === "quote" ? enteredMax : 1 / enteredMin;

  const sqrtPrice = Math.sqrt(priceBPerA);
  const sqrtLower = Math.sqrt(lower);
  const sqrtUpper = Math.sqrt(upper);
  const amountACoefficient = priceBPerA >= upper ? 0 : (sqrtUpper - sqrtPrice) / (sqrtPrice * sqrtUpper);
  const amountBCoefficient = priceBPerA <= lower ? 0 : sqrtPrice - sqrtLower;
  const inputCoefficient = input === "a" ? amountACoefficient : amountBCoefficient;
  const outputCoefficient = input === "a" ? amountBCoefficient : amountACoefficient;
  if (!Number.isFinite(inputCoefficient) || inputCoefficient <= 0 || !Number.isFinite(outputCoefficient) || outputCoefficient < 0) return "";

  return formatV3DepositAmount(numericAmount * outputCoefficient / inputCoefficient);
}

export function getV3DepositAvailability({
  price,
  direction,
  rangeMode,
  minPrice,
  maxPrice
}: {
  price: string;
  direction: "base" | "quote";
  rangeMode: "full" | "custom";
  minPrice: string;
  maxPrice: string;
}) {
  if (rangeMode === "full") return { a: true, b: true };

  const enteredPrice = Number(price);
  const enteredMin = Number(minPrice);
  const enteredMax = Number(maxPrice);
  if (
    !Number.isFinite(enteredPrice)
    || !Number.isFinite(enteredMin)
    || !Number.isFinite(enteredMax)
    || enteredPrice <= 0
    || enteredMin <= 0
    || enteredMax <= enteredMin
  ) {
    return { a: true, b: true };
  }

  const priceBPerA = direction === "quote" ? enteredPrice : 1 / enteredPrice;
  const lower = direction === "quote" ? enteredMin : 1 / enteredMax;
  const upper = direction === "quote" ? enteredMax : 1 / enteredMin;
  if (priceBPerA <= lower) return { a: true, b: false };
  if (priceBPerA >= upper) return { a: false, b: true };
  return { a: true, b: true };
}

export function getV3MintAmountMinimums({
  amountA,
  amountB,
  decimalsA,
  decimalsB,
  price,
  direction,
  rangeMode,
  minPrice,
  maxPrice,
  slippageBps
}: {
  amountA: string;
  amountB: string;
  decimalsA: number;
  decimalsB: number;
  price: string;
  direction: "base" | "quote";
  rangeMode: "full" | "custom";
  minPrice: string;
  maxPrice: string;
  slippageBps: number;
}) {
  const desiredA = parseUnits(amountA || "0", decimalsA);
  const desiredB = parseUnits(amountB || "0", decimalsB);
  const quoteParams = { price, direction, rangeMode, minPrice, maxPrice };
  const quotedB = quoteV3DepositAmount({ ...quoteParams, amount: amountA, input: "a" });
  const quotedA = quoteV3DepositAmount({ ...quoteParams, amount: amountB, input: "b" });
  const balancedB = quotedB === "" ? undefined : parseUnits(quotedB, decimalsB);
  const balancedA = quotedA === "" ? undefined : parseUnits(quotedA, decimalsA);

  let expectedA = 0n;
  let expectedB = 0n;
  if (balancedB !== undefined && balancedB <= desiredB) {
    expectedA = desiredA;
    expectedB = balancedB;
  } else if (balancedA !== undefined && balancedA <= desiredA) {
    expectedA = balancedA;
    expectedB = desiredB;
  }

  return {
    amountAMin: applySlippage(expectedA, slippageBps),
    amountBMin: applySlippage(expectedB, slippageBps)
  };
}

function formatV3DepositAmount(value: number) {
  if (!Number.isFinite(value) || value < 0) return "";
  if (value === 0) return "0";
  const fractionDigits = value >= 1 ? 8 : 12;
  return value.toFixed(fractionDigits).replace(/\.?0+$/, "");
}

function formatScaledPrice(value: bigint, scale: bigint) {
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(12, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}
