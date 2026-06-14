import { isAddress, zeroAddress, type Address } from "viem";
import type { Token, TrackedPoolPosition } from "../types/token";
import { toRouterTokenAddress } from "./routerTokens";

const POOL_POSITIONS_KEY = "mochi-swap:pool-positions";

export function loadPoolPositions(storage: Pick<Storage, "getItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(POOL_POSITIONS_KEY) ?? "[]", (_key, value) => (
      typeof value === "string" && /^\d+n$/.test(value) ? BigInt(value.slice(0, -1)) : value
    )) as TrackedPoolPosition[];
    return parsed.filter(isStoredPoolPosition).reduce<TrackedPoolPosition[]>((result, position) => upsertPoolPosition(result, position), []);
  } catch {
    return [];
  }
}

export function savePoolPositions(positions: TrackedPoolPosition[], storage: Pick<Storage, "setItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage) {
  if (!storage) return;
  storage.setItem(POOL_POSITIONS_KEY, JSON.stringify(
    positions.filter(isStoredPoolPosition),
    (_key, value) => typeof value === "bigint" ? `${value}n` : value
  ));
}

export function upsertPoolPosition(positions: TrackedPoolPosition[], position: TrackedPoolPosition) {
  const normalized = normalizePoolPosition(position);
  if (!normalized) return positions;
  const next = positions.filter((item) => !isSamePoolPosition(item, normalized));
  return [...next, normalized];
}

export function mergePoolPositionCandidates(defaults: TrackedPoolPosition[], tracked: TrackedPoolPosition[]) {
  return [...tracked, ...defaults].reduce<TrackedPoolPosition[]>((result, position) => {
    const normalized = normalizePoolPosition(position);
    if (!normalized) return result;
    if (result.some((item) => isSamePoolPosition(item, normalized))) return result;
    return [...result, normalized];
  }, []);
}

export function hasTrackedTokenPair(positions: TrackedPoolPosition[], tokenA: Token, tokenB: Token) {
  return positions.some((position) => isSameTokenPair(position.tokenA, position.tokenB, tokenA, tokenB));
}

export function isPairTracked(positions: TrackedPoolPosition[], pairAddress?: Address | null) {
  if (!pairAddress) return false;
  return positions.some((position) => position.pairAddress.toLowerCase() === pairAddress.toLowerCase());
}

function normalizePoolPosition(position: TrackedPoolPosition) {
  if (!isStoredPoolPosition(position)) return undefined;
  return {
    ...position,
    tokenA: sanitizeToken(position.tokenA),
    tokenB: sanitizeToken(position.tokenB)
  };
}

function isSamePoolPosition(a: TrackedPoolPosition, b: TrackedPoolPosition) {
  if ((a.protocol ?? "V2") !== (b.protocol ?? "V2")) return false;
  if (a.protocol === "V4" && b.protocol === "V4") {
    return a.tokenId !== undefined && b.tokenId !== undefined
      ? a.tokenId === b.tokenId
      : isSameV4PoolKey(a.v4PoolKey, b.v4PoolKey);
  }
  if ((a.fee ?? 0) !== (b.fee ?? 0)) return false;
  if (a.pairAddress !== zeroAddress && b.pairAddress !== zeroAddress) {
    return a.pairAddress.toLowerCase() === b.pairAddress.toLowerCase();
  }
  return isSameTokenPair(a.tokenA, a.tokenB, b.tokenA, b.tokenB);
}

function isSameTokenPair(a0: Token, a1: Token, b0: Token, b1: Token) {
  const a = [toRouterTokenAddress(a0).toLowerCase(), toRouterTokenAddress(a1).toLowerCase()].sort().join(",");
  const b = [toRouterTokenAddress(b0).toLowerCase(), toRouterTokenAddress(b1).toLowerCase()].sort().join(",");
  return a === b;
}

function isStoredPoolPosition(position: TrackedPoolPosition) {
  if (!position || !isAddress(position.pairAddress) || !isStoredToken(position.tokenA) || !isStoredToken(position.tokenB)) return false;
  if (position.protocol !== "V4") return true;
  return Boolean(
    position.tokenId !== undefined &&
    position.v4PoolKey &&
    isAddress(position.v4PoolKey.currency0) &&
    isAddress(position.v4PoolKey.currency1) &&
    position.v4PoolKey.hooks.toLowerCase() === zeroAddress &&
    Number.isInteger(position.v4PoolKey.fee) &&
    Number.isInteger(position.v4PoolKey.tickSpacing)
  );
}

function isSameV4PoolKey(a?: TrackedPoolPosition["v4PoolKey"], b?: TrackedPoolPosition["v4PoolKey"]) {
  return Boolean(a && b &&
    a.currency0.toLowerCase() === b.currency0.toLowerCase() &&
    a.currency1.toLowerCase() === b.currency1.toLowerCase() &&
    a.fee === b.fee &&
    a.tickSpacing === b.tickSpacing &&
    a.hooks.toLowerCase() === b.hooks.toLowerCase());
}

function isStoredToken(token: Token) {
  return Boolean(token && isAddress(token.address) && token.symbol && token.name && Number.isInteger(token.decimals));
}

function sanitizeToken(token: Token) {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
    isNative: token.isNative,
    isCustom: token.isCustom
  };
}
