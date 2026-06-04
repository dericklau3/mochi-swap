import { createPublicClient, http } from "viem";
import { bscTestnet } from "./chains";

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(import.meta.env.VITE_BSC_TESTNET_RPC_URL || bscTestnet.rpcUrls.default.http[0])
});
