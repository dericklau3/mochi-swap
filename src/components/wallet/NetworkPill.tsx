import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { appNetworks, getNetworkUrl, targetNetwork, type AppNetwork } from "../../lib/chains";

export function NetworkPill() {
  const account = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [selection, setSelection] = useState<AppNetwork>(targetNetwork);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState("");

  async function selectNetwork(network: AppNetwork) {
    if (isSwitching || account.isReconnecting || account.isConnecting) return;
    setSelection(network);
    setIsSwitching(true);
    setError("");
    try {
      const nextChain = appNetworks[network];
      if (account.isConnected && account.chainId !== nextChain.id) {
        await switchChainAsync({ chainId: nextChain.id });
      }
      window.location.assign(getNetworkUrl(window.location.href, network));
    } catch {
      setSelection(targetNetwork);
      setError("Network switch cancelled or failed. Please try again in your wallet.");
      setIsSwitching(false);
    }
  }

  return (
    <div className="row network-controls">
      <select
        aria-label="Application network"
        aria-busy={isSwitching}
        className="network-pill network-select"
        value={selection}
        disabled={isSwitching || account.isReconnecting || account.isConnecting}
        onChange={(event) => void selectNetwork(event.target.value as AppNetwork)}
      >
        {Object.entries(appNetworks).map(([key, chain]) => <option key={key} value={key}>{chain.name}</option>)}
      </select>
      {error ? <p className="network-switch-error" role="alert">{error}</p> : null}
    </div>
  );
}
