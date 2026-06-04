import { describe, expect, it } from "vitest";
import { shouldInvalidateAfterDexMutation } from "./queryInvalidation";

describe("query invalidation", () => {
  it("invalidates dex data after a successful mutation", () => {
    expect(shouldInvalidateAfterDexMutation(["token-balances", 97])).toBe(true);
    expect(shouldInvalidateAfterDexMutation(["token-allowances", 97])).toBe(true);
    expect(shouldInvalidateAfterDexMutation(["pair-info", 97])).toBe(true);
  });

  it("keeps static metadata cached", () => {
    expect(shouldInvalidateAfterDexMutation(["token-metadata", 97])).toBe(false);
  });
});
