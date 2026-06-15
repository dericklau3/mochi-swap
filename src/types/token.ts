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
  protocol?: "V2" | "V3" | "V4";
  fee?: number;
  tokenId?: bigint;
  v4PoolKey?: V4PoolKey;
  tickLower?: number;
  tickUpper?: number;
};

export type V4PoolKey = {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};

export type V4PositionInfo = {
  tokenId: bigint;
  poolKey: V4PoolKey;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  owner?: Address;
};

export type V3PositionInfo = {
  tokenId: bigint;
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
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
