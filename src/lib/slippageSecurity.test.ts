import { describe, expect, it } from "vitest";
import { applySlippage } from "./v3Routing";

describe("swap slippage guard", () => {
  it("enforces bounded minimum output", () => {
    expect(applySlippage(10_000n, 50)).toBe(9_950n);
    expect(applySlippage(10_000n, 2_000)).toBe(8_000n);
  });

  it.each([-1, 2_001, Number.NaN, Number.POSITIVE_INFINITY])("rejects unsafe slippage %s bps", (bps) => {
    expect(() => applySlippage(10_000n, bps)).toThrow(RangeError);
  });
});
