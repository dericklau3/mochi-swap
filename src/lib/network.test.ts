import { describe, expect, it } from "vitest";
import { bscTestnet } from "./chains";
import { isTargetChainId } from "./network";

describe("network helpers", () => {
  it("only treats BSC testnet as the transaction target chain", () => {
    expect(isTargetChainId(bscTestnet.id)).toBe(true);
    expect(isTargetChainId(1)).toBe(false);
    expect(isTargetChainId(undefined)).toBe(false);
  });
});
