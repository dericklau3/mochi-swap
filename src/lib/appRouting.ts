import { isAddress, type Address } from "viem";
import type { PageKey } from "../pages/types";

const pageKeys: PageKey[] = ["swap", "pool", "pair", "add", "remove"];
const v3Fees = new Set([500, 3000, 10_000]);

export type AddLiquidityRoute = {
  mode: "V2" | "V3" | "V4";
  fee?: number;
  tokenA?: Address;
  tokenB?: Address;
  tokenId?: bigint;
};

export type PairDetailRoute = {
  tokenA: Address;
  tokenB: Address;
  protocol: "V2" | "V3" | "V4";
  fee?: number;
  tokenId?: bigint;
};

export type RemoveLiquidityRoute = PairDetailRoute;

function isPageKey(value: string): value is PageKey {
  return pageKeys.includes(value as PageKey);
}

export function getPageFromUrl(url: Pick<Location, "hash" | "pathname">): PageKey {
  const hashPage = url.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  if (hashPage) return isPageKey(hashPage) ? hashPage : "not-found";

  const pathParts = url.pathname.split("/").filter(Boolean);
  const pathPage = pathParts[pathParts.length - 1] ?? "";
  if (!pathPage || pathPage === "mochi-swap") return "swap";
  return isPageKey(pathPage) ? pathPage : "not-found";
}

export function getAddLiquidityRoute(url: Pick<Location, "hash">): AddLiquidityRoute {
  const [hashPath, query = ""] = url.hash.replace(/^#\/?/, "").split("?");
  const [, mode] = hashPath.split("/");
  const normalizedMode = mode?.toLowerCase();
  if (normalizedMode !== "v3" && normalizedMode !== "v4") return { mode: "V2" };
  const liquidityMode = normalizedMode === "v4" ? "V4" : "V3";

  const params = new URLSearchParams(query);
  const fee = Number(params.get("fee"));
  if (!v3Fees.has(fee)) return { mode: liquidityMode };

  const tokenA = params.get("tokenA");
  const tokenB = params.get("tokenB");
  const tokenIdValue = params.get("tokenId");
  const tokenId = tokenIdValue && /^\d+$/.test(tokenIdValue) ? BigInt(tokenIdValue) : undefined;
  if (tokenA && tokenB && isAddress(tokenA) && isAddress(tokenB) && tokenId !== undefined) {
    return { mode: liquidityMode, fee, tokenA, tokenB, tokenId };
  }
  return { mode: liquidityMode, fee };
}

export function getPairDetailRoute(url: Pick<Location, "hash">): PairDetailRoute | undefined {
  return getPositionRoute(url, "pair");
}

export function getRemoveLiquidityRoute(url: Pick<Location, "hash">): RemoveLiquidityRoute | undefined {
  return getPositionRoute(url, "remove");
}

function getPositionRoute(url: Pick<Location, "hash">, expectedPath: "pair" | "remove"): PairDetailRoute | undefined {
  const [hashPath, query = ""] = url.hash.replace(/^#\/?/, "").split("?");
  if (hashPath !== expectedPath) return undefined;

  const params = new URLSearchParams(query);
  const tokenA = params.get("tokenA");
  const tokenB = params.get("tokenB");
  if (!tokenA || !tokenB || !isAddress(tokenA) || !isAddress(tokenB)) return undefined;

  const protocolParam = params.get("protocol")?.toUpperCase();
  const protocol = protocolParam === "V4" ? "V4" : protocolParam === "V3" ? "V3" : "V2";
  const fee = Number(params.get("fee"));
  const tokenIdValue = params.get("tokenId");
  const tokenId = tokenIdValue && /^\d+$/.test(tokenIdValue) ? BigInt(tokenIdValue) : undefined;
  if ((protocol === "V3" || protocol === "V4") && v3Fees.has(fee)) return { tokenA, tokenB, protocol, fee, tokenId };
  return { tokenA, tokenB, protocol };
}

export function getPairDetailHash(route: PairDetailRoute) {
  return getPositionHash("pair", route);
}

export function getRemoveLiquidityHash(route: RemoveLiquidityRoute) {
  return getPositionHash("remove", route);
}

function getPositionHash(path: "pair" | "remove", route: PairDetailRoute) {
  const params = new URLSearchParams({
    tokenA: route.tokenA,
    tokenB: route.tokenB,
    protocol: route.protocol
  });
  if (route.protocol !== "V2" && route.fee) params.set("fee", route.fee.toString());
  if (route.protocol !== "V2" && route.tokenId !== undefined) params.set("tokenId", route.tokenId.toString());
  return `#/${path}?${params.toString()}`;
}

export function getPageHash(page: PageKey, addLiquidity?: AddLiquidityRoute) {
  if (page === "add" && addLiquidity && addLiquidity.mode !== "V2") {
    const params = new URLSearchParams();
    if (addLiquidity.fee) params.set("fee", addLiquidity.fee.toString());
    if (addLiquidity.tokenA && addLiquidity.tokenB && addLiquidity.tokenId !== undefined) {
      params.set("tokenA", addLiquidity.tokenA);
      params.set("tokenB", addLiquidity.tokenB);
      params.set("tokenId", addLiquidity.tokenId.toString());
    }
    const query = params.toString();
    return `#/add/${addLiquidity.mode.toLowerCase()}${query ? `?${query}` : ""}`;
  }
  return `#/${page}`;
}
