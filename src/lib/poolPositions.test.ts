import { describe, expect, it } from "vitest";
import { zeroAddress } from "viem";
import type { TrackedPoolPosition } from "../types/token";
import { defaultTokens } from "./tokens";
import { hasTrackedTokenPair, isPairTracked, loadPoolPositions, savePoolPositions, upsertPoolPosition } from "./poolPositions";

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
});
