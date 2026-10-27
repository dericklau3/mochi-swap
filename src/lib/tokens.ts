import type { Token } from "../types/token";
import { activeContracts, CONTRACTS } from "./contracts";
import { zeroAddress } from "viem";
import bnbLogo from "../assets/bnb-token.png";
import usdtLogo from "../assets/usdt-token.png";
import ethLogo from "../assets/eth-token.png";
import usdgLogo from "../assets/usdg-token.png";

import { targetNetwork } from "./chains";

export const defaultTokens: Token[] = targetNetwork === "bscTestnet" ? [
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
] : [
  { address: zeroAddress, symbol: "ETH", name: "Ether", decimals: 18, logoURI: ethLogo, isNative: true },
  { address: activeContracts.weth.address, symbol: "WETH", name: "Wrapped Ether", decimals: 18, logoURI: ethLogo },
  { address: CONTRACTS.robinhoodTestnet.usdg.address, symbol: "USDG", name: "Global Dollar", decimals: 6, logoURI: usdgLogo }
];

export const defaultPoolTokens = [defaultTokens[0], defaultTokens[2]];
