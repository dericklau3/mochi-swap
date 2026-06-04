import { defineChain } from "viem";
import { arbitrum, base, bsc, mainnet, optimism, polygon, sepolia } from "viem/chains";

const defaultRpc = "https://data-seed-prebsc-1-s1.binance.org:8545";

export const bscTestnet = defineChain({
  id: 97,
  name: "BSC Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "BNB",
    symbol: "BNB"
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_BSC_TESTNET_RPC_URL || defaultRpc]
    }
  },
  blockExplorers: {
    default: {
      name: "BscScan Testnet",
      url: "https://testnet.bscscan.com"
    }
  },
  testnet: true
});

export const supportedChains = [bscTestnet, mainnet, bsc, sepolia, polygon, arbitrum, optimism, base] as const;
export const targetChain = bscTestnet;
