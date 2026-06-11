import { isAddress, type Address } from "viem";
import type { PageKey } from "../pages/types";

const pageKeys: PageKey[] = ["swap", "pool", "pair", "add", "remove", "farm", "governance"];
const v3Fees = new Set([500, 3000, 10_000]);

export type AddLiquidityRoute = {
  mode: "V2" | "V3";
  fee?: number;
  tokenA?: Address;
  tokenB?: Address;
  tokenId?: bigint;
};

export type PairDetailRoute = {
  tokenA: Address;
  tokenB: Address;
  protocol: "V2" | "V3";
  fee?: number;
  tokenId?: bigint;
};

export type RemoveLiquidityRoute = PairDetailRoute;

function isPageKey(value: string): value is PageKey {
  return pageKeys.includes(value as PageKey);
}

export function getPageFromUrl(url: Pick<Location, "hash" | "pathname">): PageKey {
  const hashPage = url.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  if (isPageKey(hashPage)) return hashPage;

  const pathParts = url.pathname.split("/").filter(Boolean);
  const pathPage = pathParts[pathParts.length - 1] ?? "";
  return isPageKey(pathPage) ? pathPage : "swap";
}

export function getAddLiquidityRoute(url: Pick<Location, "hash">): AddLiquidityRoute {
  const [hashPath, query = ""] = url.hash.replace(/^#\/?/, "").split("?");
  const [, mode] = hashPath.split("/");
  if (mode?.toLowerCase() !== "v3") return { mode: "V2" };

  const params = new URLSearchParams(query);
  const fee = Number(params.get("fee"));
  if (!v3Fees.has(fee)) return { mode: "V3" };

  const tokenA = params.get("tokenA");
  const tokenB = params.get("tokenB");
  const tokenIdValue = params.get("tokenId");
  const tokenId = tokenIdValue && /^\d+$/.test(tokenIdValue) ? BigInt(tokenIdValue) : undefined;
  if (tokenA && tokenB && isAddress(tokenA) && isAddress(tokenB) && tokenId !== undefined) {
    return { mode: "V3", fee, tokenA, tokenB, tokenId };
  }
  return { mode: "V3", fee };
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

  const protocol = params.get("protocol")?.toUpperCase() === "V3" ? "V3" : "V2";
  const fee = Number(params.get("fee"));
  const tokenIdValue = params.get("tokenId");
  const tokenId = tokenIdValue && /^\d+$/.test(tokenIdValue) ? BigInt(tokenIdValue) : undefined;
  if (protocol === "V3" && v3Fees.has(fee)) return { tokenA, tokenB, protocol, fee, tokenId };
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
  if (route.protocol === "V3" && route.fee) params.set("fee", route.fee.toString());
  if (route.protocol === "V3" && route.tokenId !== undefined) params.set("tokenId", route.tokenId.toString());
  return `#/${path}?${params.toString()}`;
}

export function getPageHash(page: PageKey, addLiquidity?: AddLiquidityRoute) {
  if (page === "add" && addLiquidity?.mode === "V3") {
    const params = new URLSearchParams();
    if (addLiquidity.fee) params.set("fee", addLiquidity.fee.toString());
    if (addLiquidity.tokenA && addLiquidity.tokenB && addLiquidity.tokenId !== undefined) {
      params.set("tokenA", addLiquidity.tokenA);
      params.set("tokenB", addLiquidity.tokenB);
      params.set("tokenId", addLiquidity.tokenId.toString());
    }
    const query = params.toString();
    return `#/add/v3${query ? `?${query}` : ""}`;
  }
  return `#/${page}`;
}
