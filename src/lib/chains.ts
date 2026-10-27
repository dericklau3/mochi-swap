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

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Testnet",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_ROBINHOOD_TESTNET_RPC_URL || "https://rpc.testnet.chain.robinhood.com"] }
  },
  blockExplorers: {
    default: { name: "Robinhood Testnet Explorer", url: "https://explorer.testnet.chain.robinhood.com" }
  },
  testnet: true
});

export const appNetworks = { bscTestnet, robinhoodTestnet } as const;
export type AppNetwork = keyof typeof appNetworks;
// Changing the application network reloads the page so all module-level
// configuration and in-memory form/query state share the same network.
export const targetNetwork: AppNetwork = typeof window !== "undefined"
  && new URLSearchParams(window.location.search).get("network") === "robinhoodTestnet"
  ? "robinhoodTestnet" : "bscTestnet";
export const targetChain = appNetworks[targetNetwork];
export const supportsV3V4 = targetNetwork === "bscTestnet";
export const supportedChains = [targetChain, bscTestnet.id === targetChain.id ? robinhoodTestnet : bscTestnet, mainnet, bsc, sepolia, polygon, arbitrum, optimism, base] as const;

export function getNetworkUrl(href: string, network: AppNetwork) {
  const url = new URL(href);
  url.searchParams.set("network", network);
  url.hash = "/swap";
  return url.toString();
}

export function networkStorageKey(key: string) {
  // Keep existing BSC tokens and positions accessible without migration.
  return targetNetwork === "bscTestnet" ? key : `${key}:${targetChain.id}`;
}
