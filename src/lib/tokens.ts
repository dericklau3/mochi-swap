import type { Token } from "../types/token";
import { CONTRACTS } from "./contracts";
import { zeroAddress } from "viem";
import bnbLogo from "../assets/bnb-token.png";
import usdtLogo from "../assets/usdt-token.png";

export const defaultTokens: Token[] = [
  {
    address: zeroAddress,
    symbol: "BNB",
    name: "BNB",
    decimals: 18,
    logoURI: bnbLogo,
    isNative: true
  },
  {
    address: CONTRACTS.bscTestnet.weth.address,
    symbol: "WBNB",
    name: "Wrapped BNB",
    decimals: 18,
    logoURI: bnbLogo
  },
  {
    address: CONTRACTS.bscTestnet.usdt.address,
    symbol: "USDT",
    name: "USDT",
    decimals: 18,
    logoURI: usdtLogo
  }
];

export const defaultPoolTokens = [defaultTokens[0], defaultTokens[2]];
