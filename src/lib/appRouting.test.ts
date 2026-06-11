import { describe, expect, it } from "vitest";
import { getAddLiquidityRoute, getPageFromUrl, getPageHash, getPairDetailHash, getPairDetailRoute, getRemoveLiquidityHash, getRemoveLiquidityRoute } from "./appRouting";

const tokenA = "0x0000000000000000000000000000000000000001";
const tokenB = "0x0000000000000000000000000000000000000002";

describe("app routing", () => {
  it("restores the page from a hash route", () => {
    expect(getPageFromUrl({ hash: "#/pool", pathname: "/mochi-swap/" })).toBe("pool");
    expect(getPageFromUrl({ hash: "#/governance", pathname: "/mochi-swap/" })).toBe("governance");
  });

  it("supports direct path routes and defaults unknown routes to swap", () => {
    expect(getPageFromUrl({ hash: "", pathname: "/pool" })).toBe("pool");
    expect(getPageFromUrl({ hash: "", pathname: "/mochi-swap/unknown" })).toBe("swap");
  });

  it("builds a refresh-safe hash route", () => {
    expect(getPageHash("farm")).toBe("#/farm");
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
});
