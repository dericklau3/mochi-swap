import { describe, expect, it } from "vitest";
import { zeroAddress } from "viem";
import type { Token } from "../types/token";
import { loadCustomTokens, mergeCustomToken, saveCustomTokens } from "./customTokens";
import { defaultTokens } from "./tokens";

class MemoryStorage {
  data: Record<string, string> = {};
  getItem(key: string) {
    return this.data[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.data[key] = value;
  }
}

const custom: Token = {
  address: "0x0000000000000000000000000000000000000001",
  symbol: "ABC",
  name: "ABC Token",
  decimals: 18,
  isCustom: true
};

describe("custom token storage", () => {
  it("loads valid custom tokens and ignores invalid storage", () => {
    const storage = new MemoryStorage();
    storage.setItem("mochi-swap:custom-tokens", JSON.stringify([custom, { ...custom, address: "nope" }]));

    expect(loadCustomTokens(storage)).toEqual([custom]);
  });

  it("deduplicates persisted tokens against defaults and existing custom addresses", () => {
    const storage = new MemoryStorage();
    storage.setItem("mochi-swap:custom-tokens", JSON.stringify([custom, { ...custom, symbol: "XYZ" }, { ...custom, address: zeroAddress }]));

    expect(loadCustomTokens(storage)).toEqual([custom]);
  });

  it("saves only custom tokens", () => {
    const storage = new MemoryStorage();
    saveCustomTokens([defaultTokens[0], custom], storage);

    expect(JSON.parse(storage.getItem("mochi-swap:custom-tokens") ?? "[]")).toEqual([custom]);
  });

  it("does not add duplicate default or custom token addresses", () => {
    expect(mergeCustomToken([], { ...custom, address: zeroAddress })).toEqual([]);
    expect(mergeCustomToken([custom], { ...custom, symbol: "XYZ" })).toEqual([custom]);
  });
});
