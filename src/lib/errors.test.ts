import { describe, expect, it } from "vitest";
import { getReadableError } from "./errors";

describe("getReadableError", () => {
  it("recognizes user rejected transaction errors", () => {
    expect(getReadableError(new Error("User rejected the request"))).toBe("User rejected transaction.");
  });

  it("recognizes invalid token address errors", () => {
    expect(getReadableError("invalid token address")).toBe("Invalid token address.");
  });

  it("uses a safe fallback instead of leaking raw objects", () => {
    expect(getReadableError({ code: 123, data: { nested: true } })).toBe("Something went wrong. Please try again.");
  });
});
