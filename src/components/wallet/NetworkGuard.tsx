import { useAccount, useSwitchChain } from "wagmi";
import { AlertTriangle } from "lucide-react";
import { targetChain } from "../../lib/chains";
import { Button } from "../ui/Button";

export function NetworkGuard() {
  const account = useAccount();
  const chainId = account.chainId;
  const { switchChain, isPending } = useSwitchChain();
  if (!account.isConnected || account.isReconnecting || chainId === undefined || chainId === targetChain.id) return null;
  return (
    <div className="notice warn" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="row">
        <AlertTriangle className="h-4 w-4" />
        Wrong network. Please switch to {targetChain.name}.
        </span>
        <Button isLoading={isPending} onClick={() => switchChain({ chainId: targetChain.id })}>
          Switch Network
        </Button>
      </div>
    </div>
  );
}
