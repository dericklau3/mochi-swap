import { describe, expect, it } from "vitest";
import { maxUint256 } from "viem";
import { buildLiquidityPermitTypedData, parsePermitSignature } from "./permit";

describe("permit helpers", () => {
  it("builds Uniswap V2 LP permit typed data", () => {
    const typedData = buildLiquidityPermitTypedData({
      chainId: 97,
      pairAddress: "0x0000000000000000000000000000000000000001",
      owner: "0x0000000000000000000000000000000000000002",
      spender: "0x0000000000000000000000000000000000000003",
      value: 123n,
      nonce: 4n,
      deadline: 5n,
      name: "Mochi LP"
    });

    expect(typedData.domain).toEqual({
      name: "Mochi LP",
      version: "1",
      chainId: 97,
      verifyingContract: "0x0000000000000000000000000000000000000001"
    });
    expect(typedData.message).toEqual({
      owner: "0x0000000000000000000000000000000000000002",
      spender: "0x0000000000000000000000000000000000000003",
      value: 123n,
      nonce: 4n,
      deadline: 5n
    });
  });

  it("parses permit signatures into router args", () => {
    const signature = parsePermitSignature(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1b"
    );

    expect(signature).toEqual({
      v: 27,
      r: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      s: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    });
  });

  it("allows approveMax permit values", () => {
    const typedData = buildLiquidityPermitTypedData({
      chainId: 97,
      pairAddress: "0x0000000000000000000000000000000000000001",
      owner: "0x0000000000000000000000000000000000000002",
      spender: "0x0000000000000000000000000000000000000003",
      value: maxUint256,
      nonce: 0n,
      deadline: 10n,
      name: "Uniswap V2"
    });

    expect(typedData.message.value).toBe(maxUint256);
  });
});
