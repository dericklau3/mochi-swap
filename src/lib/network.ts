import { targetChain } from "./chains";

export function isTargetChainId(chainId: number | undefined) {
  return chainId === targetChain.id;
}
