import {
  encodeAbiParameters,
  maxUint160,
  parseAbiParameters,
  type Address,
  type Hex
} from "viem";
import { permit2Address } from "./contracts";

export type Permit2AuthorizationStep = "TOKEN_TO_PERMIT2" | "PERMIT2_TO_SPENDER" | "READY";

export type Permit2PermitBatch = {
  details: Array<{
    token: Address;
    amount: bigint;
    expiration: number;
    nonce: number;
  }>;
  spender: Address;
  sigDeadline: bigint;
};

export type Permit2PermitSingle = {
  details: {
    token: Address;
    amount: bigint;
    expiration: number;
    nonce: number;
  };
  spender: Address;
  sigDeadline: bigint;
};

export function getPermit2AuthorizationStep({
  amount,
  tokenAllowance,
  permit2Amount,
  permit2Expiration,
  now
}: {
  amount: bigint;
  tokenAllowance: bigint;
  permit2Amount: bigint;
  permit2Expiration: bigint;
  now: bigint;
}): Permit2AuthorizationStep {
  if (amount === 0n) return "READY";
  if (tokenAllowance < amount) return "TOKEN_TO_PERMIT2";
  if (permit2Amount < amount || permit2Expiration <= now) return "PERMIT2_TO_SPENDER";
  return "READY";
}

export function buildPermit2Batch({
  permits,
  spender,
  expiration,
  sigDeadline
}: {
  permits: Array<{ token: Address; amount: bigint; nonce: number }>;
  spender: Address;
  expiration: number;
  sigDeadline: bigint;
}): Permit2PermitBatch {
  return {
    details: permits
      .filter((permit) => permit.amount > 0n)
      .map((permit) => ({
        token: permit.token,
        amount: maxUint160,
        expiration,
        nonce: permit.nonce
      })),
    spender,
    sigDeadline
  };
}

export function buildPermit2Single({
  token,
  spender,
  expiration,
  nonce,
  sigDeadline
}: {
  token: Address;
  spender: Address;
  expiration: number;
  nonce: number;
  sigDeadline: bigint;
}): Permit2PermitSingle {
  return {
    details: {
      token,
      amount: maxUint160,
      expiration,
      nonce
    },
    spender,
    sigDeadline
  };
}

export function getPermit2TypedData(chainId: number, permitBatch: Permit2PermitBatch) {
  return {
    domain: {
      name: "Permit2",
      chainId,
      verifyingContract: permit2Address
    },
    types: {
      PermitDetails: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint160" },
        { name: "expiration", type: "uint48" },
        { name: "nonce", type: "uint48" }
      ],
      PermitBatch: [
        { name: "details", type: "PermitDetails[]" },
        { name: "spender", type: "address" },
        { name: "sigDeadline", type: "uint256" }
      ]
    },
    primaryType: "PermitBatch" as const,
    message: permitBatch
  };
}

export function getPermit2SingleTypedData(chainId: number, permit: Permit2PermitSingle) {
  return {
    domain: {
      name: "Permit2",
      chainId,
      verifyingContract: permit2Address
    },
    types: {
      PermitDetails: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint160" },
        { name: "expiration", type: "uint48" },
        { name: "nonce", type: "uint48" }
      ],
      PermitSingle: [
        { name: "details", type: "PermitDetails" },
        { name: "spender", type: "address" },
        { name: "sigDeadline", type: "uint256" }
      ]
    },
    primaryType: "PermitSingle" as const,
    message: permit
  };
}

export function encodePermit2SingleInput(permit: Permit2PermitSingle, signature: Hex) {
  return encodeAbiParameters(
    parseAbiParameters("((address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline),bytes"),
    [permit, signature]
  );
}
