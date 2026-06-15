import { describe, expect, it } from "vitest";
import { getReadableError } from "./errors";

describe("getReadableError", () => {
  it("recognizes user rejected transaction errors", () => {
    expect(getReadableError(new Error("User rejected the request"))).toBe("User rejected transaction.");
  });

  it("recognizes invalid token address errors", () => {
    expect(getReadableError("invalid token address")).toBe("Invalid token address.");
  });

  it("explains V3 deposit ratio failures", () => {
    expect(getReadableError(new Error("execution reverted: Price slippage check"))).toBe("Deposit amounts do not match the V3 price and range.");
  });

  it("explains V4 position permission failures", () => {
    expect(getReadableError(new Error("execution reverted: 0x0ca968d8000000000000000000000000"))).toBe("Connected wallet is not approved to manage this V4 position.");
  });

  it("uses a safe fallback instead of leaking raw objects", () => {
    expect(getReadableError({ code: 123, data: { nested: true } })).toBe("Something went wrong. Please try again.");
  });
});
