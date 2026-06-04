import { isAddress, zeroAddress, type Address } from "viem";
import type { Token, TrackedPoolPosition } from "../types/token";
import { toRouterTokenAddress } from "./routerTokens";

const POOL_POSITIONS_KEY = "mochi-swap:pool-positions";

export function loadPoolPositions(storage: Pick<Storage, "getItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(POOL_POSITIONS_KEY) ?? "[]") as TrackedPoolPosition[];
    return parsed.filter(isStoredPoolPosition).reduce<TrackedPoolPosition[]>((result, position) => upsertPoolPosition(result, position), []);
  } catch {
    return [];
  }
}

export function savePoolPositions(positions: TrackedPoolPosition[], storage: Pick<Storage, "setItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage) {
  if (!storage) return;
  storage.setItem(POOL_POSITIONS_KEY, JSON.stringify(positions.filter(isStoredPoolPosition)));
}

export function upsertPoolPosition(positions: TrackedPoolPosition[], position: TrackedPoolPosition) {
  const normalized = normalizePoolPosition(position);
  if (!normalized) return positions;
  const next = positions.filter((item) => !isSamePoolPosition(item, normalized));
  return [...next, normalized];
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
  return Boolean(position && isAddress(position.pairAddress) && isStoredToken(position.tokenA) && isStoredToken(position.tokenB));
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
