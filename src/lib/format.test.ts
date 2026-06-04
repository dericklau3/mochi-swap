import { describe, expect, it } from "vitest";
import { formatAddress, formatTokenAmount, formatTokenAmountFixed, formatTokenAmountPlain, toSafeAmount } from "./format";

describe("format utilities", () => {
  it("shortens EVM addresses with first and last chars", () => {
    expect(formatAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
  });

  it("formats bigint token units with decimals", () => {
    expect(formatTokenAmount(1234500000000000000n, 18, 4)).toBe("1.2345");
    expect(formatTokenAmount(1000000n, 6, 4)).toBe("1");
  });

  it("formats fixed precision token amounts without hiding tiny non-zero values", () => {
    expect(formatTokenAmountFixed(0n, 18, 9)).toBe("0");
    expect(formatTokenAmountFixed(1n, 18, 9)).toBe("<0.000000001");
    expect(formatTokenAmountFixed(100000000n, 18, 9)).toBe("<0.000000001");
    expect(formatTokenAmountFixed(1234567891n, 18, 9)).toBe("0.000000001");
    expect(formatTokenAmountFixed(100000000000000n, 18, 9)).toBe("0.000100000");
  });

  it("formats plain token amounts without scientific notation", () => {
    expect(formatTokenAmountPlain(8312489578n, 18, 12)).toBe("0.000000008312");
    expect(formatTokenAmountPlain(1234567890000000000000n, 18, 4)).toBe("1234.5678");
  });

  it("normalizes decimal user input without allowing invalid characters", () => {
    expect(toSafeAmount("12.3400")).toBe("12.3400");
    expect(toSafeAmount("12..34")).toBe("");
    expect(toSafeAmount("abc")).toBe("");
  });
});
