import { describe, expect, it } from "vitest";
import { zeroAddress } from "viem";
import type { TrackedPoolPosition } from "../types/token";
import { defaultTokens } from "./tokens";
import { buildV4PoolKey } from "./v4";
import { hasTrackedTokenPair, isPairTracked, loadPoolPositions, mergePoolPositionCandidates, savePoolPositions, upsertPoolPosition } from "./poolPositions";

class MemoryStorage {
  data: Record<string, string> = {};
  getItem(key: string) {
    return this.data[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.data[key] = value;
  }
}

const position: TrackedPoolPosition = {
  pairAddress: "0x0000000000000000000000000000000000000001",
  tokenA: defaultTokens[0],
  tokenB: defaultTokens[2]
};

describe("pool position storage", () => {
  it("saves and loads tracked pool positions", () => {
    const storage = new MemoryStorage();
    savePoolPositions([position], storage);

    expect(loadPoolPositions(storage)).toEqual([position]);
  });

  it("deduplicates by pair address", () => {
    const updated = { ...position, tokenA: defaultTokens[1] };

    expect(upsertPoolPosition([position], updated)).toEqual([updated]);
  });

  it("deduplicates placeholder entries by router token pair", () => {
    const placeholder = { ...position, pairAddress: zeroAddress };

    expect(upsertPoolPosition([placeholder], { ...placeholder, tokenA: defaultTokens[1] })).toHaveLength(1);
  });

  it("checks tracked pairs and pair addresses", () => {
    expect(hasTrackedTokenPair([position], defaultTokens[1], defaultTokens[2])).toBe(true);
    expect(isPairTracked([position], position.pairAddress)).toBe(true);
  });

  it("deduplicates visible default candidates against tracked positions", () => {
    const placeholder = { ...position, pairAddress: zeroAddress, protocol: "V2" as const };
    const tracked = { ...position, protocol: "V2" as const };
    const v3Candidate = { ...position, pairAddress: zeroAddress, protocol: "V3" as const, fee: 3000 };

    expect(mergePoolPositionCandidates([placeholder, v3Candidate], [tracked])).toEqual([tracked, v3Candidate]);
  });

  it("round-trips V4 token ids and PoolKeys through storage", () => {
    const storage = new MemoryStorage();
    const v4Position: TrackedPoolPosition = {
      pairAddress: zeroAddress,
      tokenA: defaultTokens[0],
      tokenB: defaultTokens[2],
      protocol: "V4",
      fee: 3000,
      tokenId: 9n,
      v4PoolKey: buildV4PoolKey(defaultTokens[0], defaultTokens[2], 3000),
      tickLower: -120,
      tickUpper: 120
    };

    savePoolPositions([v4Position], storage);
    expect(loadPoolPositions(storage)).toEqual([v4Position]);
  });

  it("deduplicates V4 positions by token id rather than placeholder address", () => {
    const poolKey = buildV4PoolKey(defaultTokens[0], defaultTokens[2], 3000);
    const first: TrackedPoolPosition = { ...position, pairAddress: zeroAddress, protocol: "V4", tokenId: 1n, v4PoolKey: poolKey };
    const second: TrackedPoolPosition = { ...first, tokenId: 2n };

    expect(upsertPoolPosition([first], second).map((item) => item.tokenId)).toEqual([1n, 2n]);
    expect(upsertPoolPosition([first], { ...first, tickLower: -60 })).toEqual([{ ...first, tickLower: -60 }]);
  });

  it("rejects stored V4 positions with a non-zero hook", () => {
    const storage = new MemoryStorage();
    const v4Position: TrackedPoolPosition = {
      ...position,
      pairAddress: zeroAddress,
      protocol: "V4",
      tokenId: 9n,
      v4PoolKey: {
        ...buildV4PoolKey(defaultTokens[0], defaultTokens[2], 3000),
        hooks: "0x0000000000000000000000000000000000000001"
      }
    };

    savePoolPositions([v4Position], storage);
    expect(loadPoolPositions(storage)).toEqual([]);
  });
});
