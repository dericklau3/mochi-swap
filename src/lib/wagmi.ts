import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { arbitrum, base, bsc, mainnet, optimism, polygon, sepolia } from "viem/chains";
import { bscTestnet, supportedChains } from "./chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "MochiSwap",
  projectId,
  chains: supportedChains,
  transports: {
    [bscTestnet.id]: http(import.meta.env.VITE_BSC_TESTNET_RPC_URL || bscTestnet.rpcUrls.default.http[0]),
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http()
  },
  ssr: false
});
