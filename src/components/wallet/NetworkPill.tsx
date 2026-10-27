import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Layers, Loader2 } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { appNetworks, getNetworkUrl, targetNetwork, type AppNetwork } from "../../lib/chains";

const networks = Object.entries(appNetworks) as [AppNetwork, typeof appNetworks[AppNetwork]][];

function NetworkEmblem({ network }: { network: AppNetwork }) {
  return <span className="network-emblem" data-network={network} aria-hidden="true"><Layers size={14} strokeWidth={2} /></span>;
}

export function NetworkPill() {
  const account = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [selection, setSelection] = useState<AppNetwork>(targetNetwork);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(networks.findIndex(([key]) => key === selection));
  const controlsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const disabled = isSwitching || account.isReconnecting || account.isConnecting;

  useEffect(() => {
    if (!open) return;
    function dismiss(event: Event) {
      if (!controlsRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[focusedIndex]?.focus();
  }, [open, focusedIndex]);

  function openMenu(index = networks.findIndex(([key]) => key === selection)) {
    if (disabled) return;
    setFocusedIndex(index);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  async function selectNetwork(network: AppNetwork) {
    if (isSwitching || account.isReconnecting || account.isConnecting) return;
    closeMenu();
    if (network === targetNetwork) return;
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
    <div className="row network-controls" ref={controlsRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Application network: ${appNetworks[selection].name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-busy={isSwitching}
        className={`network-pill network-select${open ? " is-open" : ""}`}
        disabled={disabled}
        onClick={() => open ? closeMenu() : openMenu()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowUp" ? networks.length - 1 : undefined);
          }
        }}
      >
        <NetworkEmblem network={selection} />
        <span className="network-name">{appNetworks[selection].name}</span>
        <span className="network-chevron" aria-hidden="true">
          {isSwitching ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} strokeWidth={2} />}
        </span>
      </button>
      {open && !disabled ? (
        <div className="network-menu" id={menuId} role="menu" aria-label="Select network"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              closeMenu();
            } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              setFocusedIndex((current) => event.key === "Home" ? 0 : event.key === "End" ? networks.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + networks.length) % networks.length);
            }
          }}
        >
          <span className="network-menu-label" aria-hidden="true">SELECT NETWORK</span>
          {networks.map(([network, chain], index) => (
            <button key={network} type="button" role="menuitemradio"
              ref={(element) => { optionRefs.current[index] = element; }}
              aria-checked={network === selection}
              tabIndex={index === focusedIndex ? 0 : -1}
              className={`network-option${network === selection ? " is-selected" : ""}`}
              onFocus={() => setFocusedIndex(index)}
              onClick={() => void selectNetwork(network)}
            >
              <NetworkEmblem network={network} />
              <span className="network-option-copy"><strong>{chain.name}</strong><span>Testnet · {chain.nativeCurrency.symbol}</span></span>
              {network === selection ? <Check size={16} className="network-check" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="network-switch-error" role="alert">{error}</p> : null}
    </div>
  );
}
