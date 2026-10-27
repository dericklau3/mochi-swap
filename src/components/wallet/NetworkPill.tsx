import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { appNetworks, getNetworkUrl, targetChain, targetNetwork, type AppNetwork } from "../../lib/chains";
import { cn } from "../../lib/utils";

export function NetworkPill() {
  const fallbackChainId = useChainId();
  const account = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const chainId = account.chainId ?? fallbackChainId;
  const wrongNetwork = chainId !== targetChain.id;
  return (
    <div className="row network-controls">
      <select
        aria-label="Application network"
        className="network-pill network-select"
        value={targetNetwork}
        onChange={(event) => window.location.assign(getNetworkUrl(window.location.href, event.target.value as AppNetwork))}
      >
        {Object.entries(appNetworks).map(([key, chain]) => <option key={key} value={key}>{chain.name}</option>)}
      </select>
      {wrongNetwork ? (
        <button className={cn("network-pill", "is-wrong")} disabled={isPending} onClick={() => switchChain({ chainId: targetChain.id })}>
          <span className="tiny-dot danger" />
          Switch wallet
        </button>
      ) : null}
    </div>
  );
}
