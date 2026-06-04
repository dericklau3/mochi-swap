import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { targetChain } from "../../lib/chains";
import { cn } from "../../lib/utils";

export function NetworkPill() {
  const fallbackChainId = useChainId();
  const account = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const chainId = account.chainId ?? fallbackChainId;
  const wrongNetwork = chainId !== targetChain.id;
  return (
    <button className={cn("network-pill", wrongNetwork && "is-wrong")} disabled={isPending} onClick={() => wrongNetwork ? switchChain({ chainId: targetChain.id }) : undefined}>
      <span className={wrongNetwork ? "tiny-dot danger" : "status-dot"} />
      {wrongNetwork ? "Wrong Network" : "BSC Testnet"}
    </button>
  );
}
