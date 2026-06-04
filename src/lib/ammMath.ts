import { formatUnits, parseUnits } from "viem";
import type { PairInfo, Token } from "../types/token";
import { toRouterTokenAddress } from "./routerTokens";

export function getPairReserves(pair: PairInfo | undefined, tokenA: Token, tokenB: Token) {
  if (!pair?.address || !pair.token0 || pair.reserve0 === undefined || pair.reserve1 === undefined) return undefined;
  const token0 = pair.token0.toLowerCase();
  const tokenAAddress = toRouterTokenAddress(tokenA).toLowerCase();
  const tokenBAddress = toRouterTokenAddress(tokenB).toLowerCase();

  if (token0 === tokenAAddress) return { reserveA: pair.reserve0, reserveB: pair.reserve1 };
  if (token0 === tokenBAddress) return { reserveA: pair.reserve1, reserveB: pair.reserve0 };
  return undefined;
}

export function quoteAmountByReserves(amount: string, inputDecimals: number, outputDecimals: number, reserveIn: bigint, reserveOut: bigint) {
  if (!amount || reserveIn === 0n || reserveOut === 0n) return "";
  const amountIn = parseUnits(amount, inputDecimals);
  if (amountIn === 0n) return "";
  return trimDecimal(formatUnits((amountIn * reserveOut) / reserveIn, outputDecimals), 8);
}

export function formatPoolPrice(base: Token, quote: Token, reserveBase: bigint, reserveQuote: bigint) {
  const price = quoteAmountByReserves("1", base.decimals, quote.decimals, reserveBase, reserveQuote);
  return price ? `1 ${base.symbol} = ${price} ${quote.symbol}` : "-";
}

export function formatInputPrice(base: Token, quote: Token, baseAmount: string, quoteAmount: string) {
  if (!baseAmount || !quoteAmount) return "-";
  const parsedBase = parseUnits(baseAmount, base.decimals);
  const parsedQuote = parseUnits(quoteAmount, quote.decimals);
  if (parsedBase === 0n || parsedQuote === 0n) return "-";
  return formatPoolPrice(base, quote, parsedBase, parsedQuote);
}

export function calculateLiquidityPosition(pair: PairInfo | undefined, tokenA: Token, tokenB: Token, lpAmount = pair?.lpBalance ?? 0n) {
  const reserves = getPairReserves(pair, tokenA, tokenB);
  const totalSupply = pair?.totalSupply ?? 0n;
  if (!reserves || totalSupply === 0n || lpAmount === 0n) {
    return { amountA: 0n, amountB: 0n, poolShareHundredths: 0n };
  }

  return {
    amountA: (lpAmount * reserves.reserveA) / totalSupply,
    amountB: (lpAmount * reserves.reserveB) / totalSupply,
    poolShareHundredths: (lpAmount * 10_000n) / totalSupply
  };
}

export function formatPoolShare(poolShareHundredths: bigint, hasPosition: boolean) {
  if (!hasPosition) return "0%";
  if (poolShareHundredths === 0n) return "<0.01%";
  const whole = poolShareHundredths / 100n;
  const fraction = (poolShareHundredths % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}%`;
}

export function calculateMinimumReceived(quotedOut: bigint | undefined, slippageBps: bigint) {
  if (!quotedOut) return 0n;
  return quotedOut - (quotedOut * slippageBps) / 10_000n;
}

export function calculatePriceImpact(amountIn: bigint, quotedOut: bigint | undefined, reserveIn: bigint, reserveOut: bigint) {
  if (amountIn === 0n || !quotedOut || reserveIn === 0n || reserveOut === 0n) return "0.00%";
  const midOut = (amountIn * reserveOut) / reserveIn;
  if (midOut === 0n || quotedOut >= midOut) return "0.00%";
  const impactBps = ((midOut - quotedOut) * 10_000n) / midOut;
  return formatBps(impactBps);
}

function formatBps(bps: bigint) {
  const whole = bps / 100n;
  const fraction = (bps % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}%`;
}

function trimDecimal(value: string, maxFractionDigits: number) {
  const [whole, fraction = ""] = value.split(".");
  const trimmedFraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, "");
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}
