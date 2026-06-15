import { describe, expect, it } from "vitest";
import { decodeAbiParameters, encodeFunctionData, maxUint160, parseAbiParameters } from "viem";
import { v4PositionManagerAbi } from "./abis";
import { permit2Address, universalRouterAddress, v4PositionManagerAddress } from "./contracts";
import {
  buildPermit2Batch,
  buildPermit2Single,
  encodePermit2SingleInput,
  getPermit2AuthorizationStep,
  getPermit2SingleTypedData,
  getPermit2TypedData
} from "./permit2";

describe("Permit2 authorization", () => {
  it("requires token approval before Permit2 approval", () => {
    expect(getPermit2AuthorizationStep({
      amount: 100n,
      tokenAllowance: 99n,
      permit2Amount: 100n,
      permit2Expiration: 999n,
      now: 10n
    })).toBe("TOKEN_TO_PERMIT2");
  });

  it("requires a signature when the Permit2 spender allowance is insufficient or expired", () => {
    expect(getPermit2AuthorizationStep({
      amount: 100n,
      tokenAllowance: 100n,
      permit2Amount: 99n,
      permit2Expiration: 999n,
      now: 10n
    })).toBe("PERMIT2_TO_SPENDER");
    expect(getPermit2AuthorizationStep({
      amount: 100n,
      tokenAllowance: 100n,
      permit2Amount: 100n,
      permit2Expiration: 10n,
      now: 10n
    })).toBe("PERMIT2_TO_SPENDER");
  });

  it("is ready when both authorization layers cover the transfer", () => {
    expect(getPermit2AuthorizationStep({
      amount: 100n,
      tokenAllowance: 100n,
      permit2Amount: 100n,
      permit2Expiration: 11n,
      now: 10n
    })).toBe("READY");
    expect(getPermit2AuthorizationStep({
      amount: 0n,
      tokenAllowance: 0n,
      permit2Amount: 0n,
      permit2Expiration: 0n,
      now: 10n
    })).toBe("READY");
  });

  it("builds an official PermitBatch typed-data message for the PositionManager", () => {
    const batch = buildPermit2Batch({
      permits: [
        { token: "0x0000000000000000000000000000000000000001", amount: 100n, nonce: 3 },
        { token: "0x0000000000000000000000000000000000000002", amount: 0n, nonce: 4 }
      ],
      spender: v4PositionManagerAddress,
      expiration: 1000,
      sigDeadline: 900n
    });
    const typedData = getPermit2TypedData(97, batch);

    expect(batch.details).toEqual([{
      token: "0x0000000000000000000000000000000000000001",
      amount: maxUint160,
      expiration: 1000,
      nonce: 3
    }]);
    expect(typedData).toMatchObject({
      domain: { name: "Permit2", chainId: 97, verifyingContract: permit2Address },
      primaryType: "PermitBatch",
      message: { spender: v4PositionManagerAddress, sigDeadline: 900n }
    });
    expect(encodeFunctionData({
      abi: v4PositionManagerAbi,
      functionName: "permitBatch",
      args: [
        "0x0000000000000000000000000000000000000003",
        batch,
        `0x${"00".repeat(65)}`
      ]
    })).toMatch(/^0x[0-9a-f]+$/);
  });

  it("builds and encodes a PermitSingle signature for the Universal Router", () => {
    const permit = buildPermit2Single({
      token: "0x0000000000000000000000000000000000000001",
      spender: universalRouterAddress,
      expiration: 1000,
      nonce: 3,
      sigDeadline: 900n
    });
    const typedData = getPermit2SingleTypedData(97, permit);
    const signature = `0x${"11".repeat(65)}` as const;
    const encoded = encodePermit2SingleInput(permit, signature);
    const [decodedPermit, decodedSignature] = decodeAbiParameters(
      parseAbiParameters("((address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline),bytes"),
      encoded
    );

    expect(permit).toEqual({
      details: {
        token: "0x0000000000000000000000000000000000000001",
        amount: maxUint160,
        expiration: 1000,
        nonce: 3
      },
      spender: universalRouterAddress,
      sigDeadline: 900n
    });
    expect(typedData).toMatchObject({
      domain: { name: "Permit2", chainId: 97, verifyingContract: permit2Address },
      primaryType: "PermitSingle",
      message: permit
    });
    expect(decodedPermit).toEqual(permit);
    expect(decodedSignature).toBe(signature);
  });
});
