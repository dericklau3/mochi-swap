import { afterEach, describe, expect, it, vi } from "vitest";
import { zeroAddress } from "viem";

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.resetModules();
});

describe("Robinhood application network", () => {
  it("uses Robinhood contracts and ETH routing when selected by URL", async () => {
    window.history.replaceState(null, "", "/?network=robinhoodTestnet");
    vi.resetModules();
    const { targetChain } = await import("./chains");
    const { routerAddress, factoryAddress, v3FactoryAddress, v4PoolManagerAddress } = await import("./contracts");
    const { defaultTokens, defaultPoolTokens } = await import("./tokens");
    const { toRouterTokenAddress, isSameRouterToken } = await import("./routerTokens");
    const { publicClient } = await import("./viem");
    expect(targetChain.id).toBe(46630);
    expect(publicClient.chain.id).toBe(46630);
    expect(routerAddress).toBe("0xdd67C669F804e36F496Eb228a361A465a1DDDAac");
    expect(factoryAddress).toBe("0xa0cec339C549BB10b9720744CdAfb15A21B085A9");
    expect(v3FactoryAddress).toBe("0x352A92bAc9F383915B48B27237136eCA7Ea6485B");
    expect(v4PoolManagerAddress).toBe(zeroAddress);
    expect(defaultTokens.map((token) => token.symbol)).toEqual(["ETH", "WETH", "USDG"]);
    expect(toRouterTokenAddress(defaultTokens[0])).toBe("0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4");
    expect(isSameRouterToken(defaultTokens[0], defaultTokens[1])).toBe(true);
    expect(defaultPoolTokens.map((token) => token.symbol)).toEqual(["ETH", "USDG"]);
    expect(isSameRouterToken(defaultPoolTokens[0], defaultPoolTokens[1])).toBe(false);
    expect(defaultTokens[2]).toMatchObject({ address: "0x3095d36DfE71EEa8b73028809973d3dC53C1c2aA", decimals: 6 });
  });

  it("does not load BSC tokens or positions into Robinhood and preserves both on save", async () => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    const token = { address: "0x0000000000000000000000000000000000000001", symbol: "TEST", name: "Test", decimals: 18, isCustom: true } as const;
    storage.setItem("mochi-swap:custom-tokens", JSON.stringify([token]));
    const legacyPositions = [{ pairAddress: "0x0000000000000000000000000000000000000003", tokenA: token, tokenB: { ...token, address: "0x0000000000000000000000000000000000000002" }, protocol: "V2" }];
    storage.setItem("mochi-swap:pool-positions", JSON.stringify(legacyPositions));
    window.history.replaceState(null, "", "/?network=robinhoodTestnet");
    vi.resetModules();
    const tokens = await import("./customTokens");
    const positions = await import("./poolPositions");
    expect(tokens.loadCustomTokens(storage)).toEqual([]);
    expect(positions.loadPoolPositions(storage)).toEqual([]);
    tokens.saveCustomTokens([token], storage);
    positions.savePoolPositions([], storage);
    expect(tokens.loadCustomTokens(storage)).toEqual([token]);
    expect(storage.getItem("mochi-swap:custom-tokens")).toBe(JSON.stringify([token]));
    expect(storage.getItem("mochi-swap:pool-positions:46630")).toBe("[]");
    expect(storage.getItem("mochi-swap:pool-positions")).toBe(JSON.stringify(legacyPositions));
    window.history.replaceState(null, "", "/");
    vi.resetModules();
    expect((await import("./customTokens")).loadCustomTokens(storage)).toEqual([token]);
  });

  it("resets the position route when switching application networks", async () => {
    const { getNetworkUrl } = await import("./chains");
    expect(getNetworkUrl("https://example.com/mochi-swap/?theme=light#/remove?tokenId=7", "robinhoodTestnet"))
      .toBe("https://example.com/mochi-swap/?theme=light&network=robinhoodTestnet#/swap");
  });

  it("allows V3 and blocks unsupported V4 deep links on Robinhood", async () => {
    window.history.replaceState(null, "", "/?network=robinhoodTestnet");
    vi.resetModules();
    const { getPageFromUrl } = await import("./appRouting");
    for (const hash of ["#/add/v4", "#/add/v4/", "#/add/v4/anything", "#/pair?protocol=V4", "#/remove?protocol=V4"]) {
      expect(getPageFromUrl({ hash, pathname: "/" })).toBe("not-found");
    }
    expect(getPageFromUrl({ hash: "#/add", pathname: "/" })).toBe("add");
    expect(getPageFromUrl({ hash: "#/add/v3", pathname: "/" })).toBe("add");
    expect(getPageFromUrl({ hash: "#/pair?protocol=V3", pathname: "/" })).toBe("pair");
    expect(getPageFromUrl({ hash: "#/remove?protocol=V3", pathname: "/" })).toBe("remove");
  });
});
