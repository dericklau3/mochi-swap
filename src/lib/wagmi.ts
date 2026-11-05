import "@rainbow-me/rainbowkit/styles.css";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { arbitrum, base, bsc, mainnet, optimism, polygon, sepolia } from "viem/chains";
import { bscTestnet, robinhoodTestnet, supportedChains } from "./chains";

const walletConnectProjectId = "da0be758f55ea2cd52999060284c020d";
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || walletConnectProjectId;
const walletConnectStorageMigrationKey = "mochi-swap:walletconnect-storage-v2";

function clearLegacyWalletConnectStorage() {
  if (typeof window === "undefined") return;

  // Storage may be disabled by browser privacy policies, embedded webviews,
  // or test environments. Never block wallet initialization in this case.
  try {
    const storage = window.localStorage;
    if (!storage || storage.getItem(walletConnectStorageMigrationKey) === projectId) return;

    const staleKeyFragments = ["wc@", "walletconnect", "WalletConnect", "w3m", "W3M", "reown", "wagmi.recentConnectorId"];
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && staleKeyFragments.some((fragment) => key.includes(fragment))) {
        storage.removeItem(key);
      }
    }
    storage.setItem(walletConnectStorageMigrationKey, projectId);
  } catch {
    // If the browser rejects storage operations, continue without migration.
  }
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
    [robinhoodTestnet.id]: http(robinhoodTestnet.rpcUrls.default.http[0]),
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
