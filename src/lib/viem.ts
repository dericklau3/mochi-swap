import { createPublicClient, http } from "viem";
import { targetChain } from "./chains";

export const publicClient = createPublicClient({
  chain: targetChain,
  transport: http(targetChain.rpcUrls.default.http[0])
});
