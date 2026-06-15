import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  parseAbiParameters,
  zeroAddress,
  type Address,
  type Hex
} from "viem";
import type { Token, V4PoolKey } from "../types/token";
import { encodePermit2SingleInput, type Permit2PermitSingle } from "./permit2";
import { getSqrtRatioAtTick } from "./v3Routing";

export const V4_ACTIONS = {
  INCREASE_LIQUIDITY: 0x00,
  DECREASE_LIQUIDITY: 0x01,
  MINT_POSITION: 0x02,
  SWAP_EXACT_IN_SINGLE: 0x06,
  SETTLE_ALL: 0x0c,
  SETTLE_PAIR: 0x0d,
  TAKE_ALL: 0x0f,
  TAKE_PAIR: 0x11,
  SWEEP: 0x14
} as const;

export const V4_ROUTER_COMMAND = 0x10;
export const PERMIT2_PERMIT_COMMAND = 0x0a;
export const v4FeeOptions = [
  { label: "0.05%", fee: 500, tickSpacing: 10 },
  { label: "0.3%", fee: 3000, tickSpacing: 60 },
  { label: "1.0%", fee: 10_000, tickSpacing: 200 }
] as const;

const poolKeyParameters = parseAbiParameters(
  "(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)"
);

export function toV4Currency(token: Token) {
  return token.isNative ? zeroAddress : getAddress(token.address);
}

export function sortV4Tokens(tokenA: Token, tokenB: Token) {
  const addressA = toV4Currency(tokenA);
  const addressB = toV4Currency(tokenB);
  const aIsCurrency0 = addressA.toLowerCase() < addressB.toLowerCase();
  return {
    token0: aIsCurrency0 ? tokenA : tokenB,
    token1: aIsCurrency0 ? tokenB : tokenA,
    currency0: aIsCurrency0 ? addressA : addressB,
    currency1: aIsCurrency0 ? addressB : addressA,
    aIsCurrency0
  };
}

export function getV4FeeOption(feeOrLabel: number | string) {
  return v4FeeOptions.find((option) => option.fee === feeOrLabel || option.label === feeOrLabel) ?? v4FeeOptions[1];
}

export function buildV4PoolKey(tokenA: Token, tokenB: Token, feeOrLabel: number | string): V4PoolKey {
  const sorted = sortV4Tokens(tokenA, tokenB);
  const option = getV4FeeOption(feeOrLabel);
  return {
    currency0: sorted.currency0,
    currency1: sorted.currency1,
    fee: option.fee,
    tickSpacing: option.tickSpacing,
    hooks: zeroAddress
  };
}

export function getV4PoolId(poolKey: V4PoolKey) {
  return keccak256(encodeAbiParameters(poolKeyParameters, [poolKey]));
}

export function decodeV4PositionInfo(info: bigint) {
  return {
    tickLower: decodeSigned24(Number((info >> 8n) & 0xffffffn)),
    tickUpper: decodeSigned24(Number((info >> 32n) & 0xffffffn)),
    hasSubscriber: (info & 0xffn) !== 0n
  };
}

export function encodeV4MintActions({
  poolKey,
  tickLower,
  tickUpper,
  liquidity,
  amount0Max,
  amount1Max,
  owner
}: {
  poolKey: V4PoolKey;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  amount0Max: bigint;
  amount1Max: bigint;
  owner: Address;
}) {
  const actions = [V4_ACTIONS.MINT_POSITION, V4_ACTIONS.SETTLE_PAIR];
  const params = [
      encodeAbiParameters(
        parseAbiParameters("(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,int24 tickLower,int24 tickUpper,uint256 liquidity,uint128 amount0Max,uint128 amount1Max,address owner,bytes hookData"),
        [poolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, owner, "0x"]
      ),
      encodeAbiParameters(parseAbiParameters("address,address"), [poolKey.currency0, poolKey.currency1])
    ];
  appendNativeSweep(actions, params, poolKey, owner);
  return encodeActions(actions, params);
}

export function encodeV4IncreaseActions({
  tokenId,
  liquidity,
  amount0Max,
  amount1Max,
  poolKey,
  recipient
}: {
  tokenId: bigint;
  liquidity: bigint;
  amount0Max: bigint;
  amount1Max: bigint;
  poolKey: V4PoolKey;
  recipient: Address;
}) {
  const actions = [V4_ACTIONS.INCREASE_LIQUIDITY, V4_ACTIONS.SETTLE_PAIR];
  const params = [
      encodeAbiParameters(parseAbiParameters("uint256,uint256,uint128,uint128,bytes"), [tokenId, liquidity, amount0Max, amount1Max, "0x"]),
      encodeAbiParameters(parseAbiParameters("address,address"), [poolKey.currency0, poolKey.currency1])
    ];
  appendNativeSweep(actions, params, poolKey, recipient);
  return encodeActions(actions, params);
}

export function encodeV4DecreaseActions({
  tokenId,
  liquidity,
  amount0Min,
  amount1Min,
  poolKey,
  recipient
}: {
  tokenId: bigint;
  liquidity: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  poolKey: V4PoolKey;
  recipient: Address;
}) {
  return encodeActions(
    [V4_ACTIONS.DECREASE_LIQUIDITY, V4_ACTIONS.TAKE_PAIR],
    [
      encodeAbiParameters(parseAbiParameters("uint256,uint256,uint128,uint128,bytes"), [tokenId, liquidity, amount0Min, amount1Min, "0x"]),
      encodeAbiParameters(parseAbiParameters("address,address,address"), [poolKey.currency0, poolKey.currency1, recipient])
    ]
  );
}

export function encodeV4SwapInput({
  poolKey,
  zeroForOne,
  amountIn,
  amountOutMinimum
}: {
  poolKey: V4PoolKey;
  zeroForOne: boolean;
  amountIn: bigint;
  amountOutMinimum: bigint;
}) {
  const inputCurrency = zeroForOne ? poolKey.currency0 : poolKey.currency1;
  const outputCurrency = zeroForOne ? poolKey.currency1 : poolKey.currency0;
  return encodeActions(
    [V4_ACTIONS.SWAP_EXACT_IN_SINGLE, V4_ACTIONS.SETTLE_ALL, V4_ACTIONS.TAKE_ALL],
    [
      encodeAbiParameters(
        parseAbiParameters("((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,uint256 minHopPriceX36,bytes hookData) params"),
        [{ poolKey, zeroForOne, amountIn, amountOutMinimum, minHopPriceX36: 0n, hookData: "0x" }]
      ),
      encodeAbiParameters(parseAbiParameters("address,uint256"), [inputCurrency, amountIn]),
      encodeAbiParameters(parseAbiParameters("address,uint256"), [outputCurrency, amountOutMinimum])
    ]
  );
}

export function encodeV4UniversalRouterPlan({
  swapInput,
  permit,
  signature
}: {
  swapInput: Hex;
  permit?: Permit2PermitSingle;
  signature?: Hex;
}) {
  if (!permit || !signature) {
    return {
      commands: `0x${V4_ROUTER_COMMAND.toString(16).padStart(2, "0")}` as Hex,
      inputs: [swapInput]
    };
  }
  return {
    commands: `0x${PERMIT2_PERMIT_COMMAND.toString(16).padStart(2, "0")}${V4_ROUTER_COMMAND.toString(16).padStart(2, "0")}` as Hex,
    inputs: [encodePermit2SingleInput(permit, signature), swapInput]
  };
}

export function formatV4RouteLabel(fee: number) {
  return `V4 ${fee / 10_000}%`;
}

export function formatV4PoolPrice({
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
  const price = getV4PoolPriceValue({ tokenA, tokenB, sqrtPriceX96, quoteToken });
  return `1 ${base.symbol} = ${price || "-"} ${quote.symbol}`;
}

export function getV4PoolPriceValue({
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
  const sorted = sortV4Tokens(tokenA, tokenB);
  const q192 = 2n ** 192n;
  const precision = 10n ** 12n;
  const sqrtPriceSquared = sqrtPriceX96 * sqrtPriceX96;
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
  const tokenBPerTokenA = sorted.aIsCurrency0 ? token1PerToken0 : token0PerToken1;
  const tokenAPerTokenB = sorted.aIsCurrency0 ? token0PerToken1 : token1PerToken0;

  return formatScaledPrice(quoteToken === "b" ? tokenBPerTokenA : tokenAPerTokenB, precision);
}

export function getV4FullRangeTicks(feeOrLabel: number | string) {
  const { tickSpacing } = getV4FeeOption(feeOrLabel);
  return {
    tickLower: Math.ceil(-887272 / tickSpacing) * tickSpacing,
    tickUpper: Math.floor(887272 / tickSpacing) * tickSpacing
  };
}

export function getV4CustomRangeTicks({
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
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= min) return getV4FullRangeTicks(fee);
  const sorted = sortV4Tokens(tokenA, tokenB);
  const priceBPerA = direction === "quote" ? [min, max] : [1 / max, 1 / min];
  const token1PerToken0 = priceBPerA.map((price) => (
    (sorted.aIsCurrency0 ? price : 1 / price) * 10 ** (sorted.token0.decimals - sorted.token1.decimals)
  ));
  const { tickSpacing } = getV4FeeOption(fee);
  const ticks = token1PerToken0.map((price) => Math.round(Math.log(price) / Math.log(1.0001) / tickSpacing) * tickSpacing);
  const tickLower = Math.max(-887272, Math.min(ticks[0], ticks[1]));
  const tickUpper = Math.min(887272, Math.max(ticks[0], ticks[1]));
  return tickLower < tickUpper ? { tickLower, tickUpper } : getV4FullRangeTicks(fee);
}

export function getV4InitialSqrtPriceX96({
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
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return 0n;
  const sorted = sortV4Tokens(tokenA, tokenB);
  const priceBPerA = direction === "quote" ? numericPrice : 1 / numericPrice;
  const token1PerToken0 = (sorted.aIsCurrency0 ? priceBPerA : 1 / priceBPerA)
    * 10 ** (sorted.token0.decimals - sorted.token1.decimals);
  const tick = Math.max(-887272, Math.min(887272, Math.round(Math.log(token1PerToken0) / Math.log(1.0001))));
  return getSqrtRatioAtTick(tick);
}

export function getV4LiquidityForAmounts({
  sqrtPriceX96,
  tickLower,
  tickUpper,
  amount0,
  amount1
}: {
  sqrtPriceX96: bigint;
  tickLower: number;
  tickUpper: number;
  amount0: bigint;
  amount1: bigint;
}) {
  const q96 = 1n << 96n;
  const sqrtLower = getSqrtRatioAtTick(tickLower);
  const sqrtUpper = getSqrtRatioAtTick(tickUpper);
  if (sqrtPriceX96 <= sqrtLower) return amount0 * sqrtLower * sqrtUpper / q96 / (sqrtUpper - sqrtLower);
  if (sqrtPriceX96 >= sqrtUpper) return amount1 * q96 / (sqrtUpper - sqrtLower);
  const liquidity0 = amount0 * sqrtPriceX96 * sqrtUpper / q96 / (sqrtUpper - sqrtPriceX96);
  const liquidity1 = amount1 * q96 / (sqrtPriceX96 - sqrtLower);
  if (amount0 === 0n) return liquidity1;
  if (amount1 === 0n) return liquidity0;
  return liquidity0 < liquidity1 ? liquidity0 : liquidity1;
}

function encodeActions(actions: number[], params: Hex[]) {
  const actionBytes = `0x${actions.map((action) => action.toString(16).padStart(2, "0")).join("")}` as Hex;
  return encodeAbiParameters(parseAbiParameters("bytes,bytes[]"), [actionBytes, params]);
}

function appendNativeSweep(actions: number[], params: Hex[], poolKey: V4PoolKey, recipient: Address) {
  if (poolKey.currency0 !== zeroAddress && poolKey.currency1 !== zeroAddress) return;
  actions.push(V4_ACTIONS.SWEEP);
  params.push(encodeAbiParameters(parseAbiParameters("address,address"), [zeroAddress, recipient]));
}

function decodeSigned24(value: number) {
  return value & 0x800000 ? value - 0x1000000 : value;
}

function formatScaledPrice(value: bigint, scale: bigint) {
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(12, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}
