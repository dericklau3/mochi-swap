import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { AlertTriangle } from "lucide-react";
import { targetChain } from "../../lib/chains";
import { Button } from "../ui/Button";

export function NetworkGuard() {
  const fallbackChainId = useChainId();
  const account = useAccount();
  const chainId = account.chainId ?? fallbackChainId;
  const { switchChain, isPending } = useSwitchChain();
  if (chainId === targetChain.id) return null;
  return (
    <div className="notice warn" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="row">
        <AlertTriangle className="h-4 w-4" />
        Wrong network. Please switch to BSC Testnet.
        </span>
        <Button isLoading={isPending} onClick={() => switchChain({ chainId: targetChain.id })}>
          Switch Network
        </Button>
      </div>
    </div>
  );
}
