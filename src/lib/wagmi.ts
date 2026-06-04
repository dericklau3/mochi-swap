import "@rainbow-me/rainbowkit/styles.css";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { arbitrum, base, bsc, mainnet, optimism, polygon, sepolia } from "viem/chains";
import { bscTestnet, supportedChains } from "./chains";

const walletConnectProjectId = "da0be758f55ea2cd52999060284c020d";
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || walletConnectProjectId;
const walletConnectStorageMigrationKey = "mochi-swap:walletconnect-storage-v2";

function clearLegacyWalletConnectStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const { localStorage } = window;
  if (localStorage.getItem(walletConnectStorageMigrationKey) === projectId) {
    return;
  }

  const staleKeyFragments = ["wc@", "walletconnect", "WalletConnect", "w3m", "W3M", "reown", "wagmi.recentConnectorId"];
  for (const key of Object.keys(localStorage)) {
    if (staleKeyFragments.some((fragment) => key.includes(fragment))) {
      localStorage.removeItem(key);
    }
  }

  localStorage.setItem(walletConnectStorageMigrationKey, projectId);
}

clearLegacyWalletConnectStorage();

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
