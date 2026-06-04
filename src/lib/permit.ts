import { parseSignature, type Address, type Hex } from "viem";

export function buildLiquidityPermitTypedData({
  chainId,
  pairAddress,
  owner,
  spender,
  value,
  nonce,
  deadline,
  name
}: {
  chainId: number;
  pairAddress: Address;
  owner: Address;
  spender: Address;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
  name: string;
}) {
  return {
    domain: {
      name,
      version: "1",
      chainId,
      verifyingContract: pairAddress
    },
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    },
    primaryType: "Permit",
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline
    }
  } as const;
}

export function parsePermitSignature(signature: Hex) {
  const parsed = parseSignature(signature);
  return {
    v: parsed.v !== undefined ? Number(parsed.v) : parsed.yParity + 27,
    r: parsed.r,
    s: parsed.s
  };
}
