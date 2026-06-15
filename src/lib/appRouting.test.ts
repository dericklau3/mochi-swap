import { describe, expect, it } from "vitest";
import { getAddLiquidityRoute, getInitialLiquidityRoute, getPageFromUrl, getPageHash, getPairDetailHash, getPairDetailRoute, getRemoveLiquidityHash, getRemoveLiquidityRoute } from "./appRouting";

const tokenA = "0x0000000000000000000000000000000000000001";
const tokenB = "0x0000000000000000000000000000000000000002";

describe("app routing", () => {
  it("restores the page from a hash route", () => {
    expect(getPageFromUrl({ hash: "#/pool", pathname: "/mochi-swap/" })).toBe("pool");
  });

  it("supports direct path routes and returns not found for unknown routes", () => {
    expect(getPageFromUrl({ hash: "", pathname: "/pool" })).toBe("pool");
    expect(getPageFromUrl({ hash: "#/unknown", pathname: "/mochi-swap/" })).toBe("not-found");
    expect(getPageFromUrl({ hash: "", pathname: "/mochi-swap/unknown" })).toBe("not-found");
    expect(getPageFromUrl({ hash: "#/farm", pathname: "/mochi-swap/" })).toBe("not-found");
    expect(getPageFromUrl({ hash: "#/governance", pathname: "/mochi-swap/" })).toBe("not-found");
  });

  it("builds a refresh-safe hash route", () => {
    expect(getPageHash("add", { mode: "V3", fee: 3000 })).toBe("#/add/v3?fee=3000");
    expect(getPageHash("add", { mode: "V3", fee: 3000, tokenA, tokenB, tokenId: 7n })).toBe(
      `#/add/v3?fee=3000&tokenA=${tokenA}&tokenB=${tokenB}&tokenId=7`
    );
  });

  it("restores the add liquidity mode and V3 fee from the hash route", () => {
    expect(getAddLiquidityRoute({ hash: "#/add" })).toEqual({ mode: "V2" });
    expect(getAddLiquidityRoute({ hash: "#/add/v3?fee=3000" })).toEqual({ mode: "V3", fee: 3000 });
    expect(getAddLiquidityRoute({ hash: `#/add/v3?fee=3000&tokenA=${tokenA}&tokenB=${tokenB}&tokenId=7` })).toEqual({
      mode: "V3",
      fee: 3000,
      tokenA,
      tokenB,
      tokenId: 7n
    });
    expect(getAddLiquidityRoute({ hash: "#/add/v3?fee=123" })).toEqual({ mode: "V3" });
  });

  it("round-trips the selected V3 pool through the pair detail hash", () => {
    const hash = getPairDetailHash({
      tokenA,
      tokenB,
      protocol: "V3",
      fee: 3000,
      tokenId: 7n
    });

    expect(hash).toBe(`#/pair?tokenA=${tokenA}&tokenB=${tokenB}&protocol=V3&fee=3000&tokenId=7`);
    expect(getPairDetailRoute({ hash })).toEqual({
      tokenA,
      tokenB,
      protocol: "V3",
      fee: 3000,
      tokenId: 7n
    });
  });

  it("round-trips the selected V3 NFT through the remove liquidity hash", () => {
    const hash = getRemoveLiquidityHash({
      tokenA,
      tokenB,
      protocol: "V3",
      fee: 3000,
      tokenId: 7n
    });

    expect(hash).toBe(`#/remove?tokenA=${tokenA}&tokenB=${tokenB}&protocol=V3&fee=3000&tokenId=7`);
    expect(getRemoveLiquidityRoute({ hash })).toEqual({
      tokenA,
      tokenB,
      protocol: "V3",
      fee: 3000,
      tokenId: 7n
    });
  });

  it("round-trips a V2 pair through the remove liquidity hash", () => {
    const hash = getRemoveLiquidityHash({ tokenA, tokenB, protocol: "V2" });

    expect(hash).toBe(`#/remove?tokenA=${tokenA}&tokenB=${tokenB}&protocol=V2`);
    expect(getRemoveLiquidityRoute({ hash })).toEqual({ tokenA, tokenB, protocol: "V2" });
  });

  it("rejects incomplete pair detail routes and defaults valid V2 routes", () => {
    expect(getPairDetailRoute({ hash: `#/pair?tokenA=${tokenA}` })).toBeUndefined();
    expect(getPairDetailRoute({ hash: `#/pair?tokenA=${tokenA}&tokenB=${tokenB}` })).toEqual({
      tokenA,
      tokenB,
      protocol: "V2"
    });
  });

  it("round-trips V4 add, detail, and remove routes", () => {
    expect(getPageHash("add", { mode: "V4", fee: 3000, tokenA, tokenB, tokenId: 11n })).toBe(
      `#/add/v4?fee=3000&tokenA=${tokenA}&tokenB=${tokenB}&tokenId=11`
    );
    expect(getAddLiquidityRoute({ hash: `#/add/v4?fee=3000&tokenA=${tokenA}&tokenB=${tokenB}&tokenId=11` })).toEqual({
      mode: "V4",
      fee: 3000,
      tokenA,
      tokenB,
      tokenId: 11n
    });

    const detail = getPairDetailHash({ tokenA, tokenB, protocol: "V4", fee: 3000, tokenId: 11n });
    expect(getPairDetailRoute({ hash: detail })).toEqual({ tokenA, tokenB, protocol: "V4", fee: 3000, tokenId: 11n });
    const remove = getRemoveLiquidityHash({ tokenA, tokenB, protocol: "V4", fee: 3000, tokenId: 11n });
    expect(getRemoveLiquidityRoute({ hash: remove })).toEqual({ tokenA, tokenB, protocol: "V4", fee: 3000, tokenId: 11n });
  });

  it("selects only the active liquidity route on initial page load", () => {
    const pairHash = getPairDetailHash({ tokenA, tokenB, protocol: "V4", fee: 3000, tokenId: 11n });
    expect(getInitialLiquidityRoute({ hash: pairHash, pathname: "/mochi-swap/" })).toEqual({
      page: "pair",
      route: { tokenA, tokenB, protocol: "V4", fee: 3000, tokenId: 11n }
    });

    const removeHash = getRemoveLiquidityHash({ tokenA, tokenB, protocol: "V3", fee: 500, tokenId: 7n });
    expect(getInitialLiquidityRoute({ hash: removeHash, pathname: "/mochi-swap/" })).toEqual({
      page: "remove",
      route: { tokenA, tokenB, protocol: "V3", fee: 500, tokenId: 7n }
    });
  });
});
