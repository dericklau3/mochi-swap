import type { Address } from "viem";
import type { Token } from "../types/token";
import { CONTRACTS } from "./contracts";

export const wrappedNativeAddress = CONTRACTS.bscTestnet.weth.address;

export function toRouterTokenAddress(token: Token): Address {
  return token.isNative ? wrappedNativeAddress : token.address;
}

export function toRouterPath(from: Token, to: Token): [Address, Address] {
  return [toRouterTokenAddress(from), toRouterTokenAddress(to)];
}

export function isSameRouterToken(a: Token, b: Token) {
  return toRouterTokenAddress(a).toLowerCase() === toRouterTokenAddress(b).toLowerCase();
}
