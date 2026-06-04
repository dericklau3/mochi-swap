import "@rainbow-me/rainbowkit/styles.css";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { arbitrum, base, bsc, mainnet, optimism, polygon, sepolia } from "viem/chains";
import { bscTestnet, supportedChains } from "./chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallet",
      wallets: [walletConnectWallet]
    }
  ],
  {
    appName: "MochiSwap",
    projectId
  }
);

export const wagmiConfig = createConfig({
  connectors,
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
