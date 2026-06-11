import type { Address } from "viem";

export type Token = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isNative?: boolean;
  isCustom?: boolean;
};

export type PairInfo = {
  address: Address | null;
  token0?: Address;
  token1?: Address;
  reserve0?: bigint;
  reserve1?: bigint;
  totalSupply?: bigint;
  lpBalance?: bigint;
  lpAllowance?: bigint;
  error?: string;
};

export type TrackedPoolPosition = {
  pairAddress: Address;
  tokenA: Token;
  tokenB: Token;
  protocol?: "V2" | "V3";
  fee?: number;
  tokenId?: bigint;
};

export type V3PositionInfo = {
  tokenId: bigint;
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
};

export type TransactionState =
  | "idle"
  | "loading"
  | "disabled"
  | "pending"
  | "success"
  | "failed";
