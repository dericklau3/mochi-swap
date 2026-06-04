import { useMemo, useState } from "react";
import type { Address } from "viem";
import type { Token, TrackedPoolPosition } from "../../types/token";
import { formatAddress, formatTokenAmountFixed } from "../../lib/format";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { isSameRouterToken } from "../../lib/routerTokens";
import { isPairTracked } from "../../lib/poolPositions";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TokenIcon } from "../token/TokenIcon";
import { Info } from "../swap/SwapPreview";

export function ImportPositionModal({
  tokens,
  defaultA,
  defaultB,
  trackedPositions,
  onClose,
  onImport
}: {
  tokens: Token[];
  defaultA: Token;
  defaultB: Token;
  trackedPositions: TrackedPoolPosition[];
  onClose: () => void;
  onImport: (tokenA: Token, tokenB: Token, pairAddress: Address) => void;
}) {
  const [tokenA, setTokenA] = useState(defaultA);
  const [tokenB, setTokenB] = useState(defaultB);
  const [picker, setPicker] = useState<"a" | "b" | null>(null);
  const importedPair = useMulticallPairInfo(tokenA, tokenB);
  const pair = importedPair.data;
  const loading = importedPair.isLoading;
  const sameRouterToken = isSameRouterToken(tokenA, tokenB);
  const canSearch = tokenA.address !== tokenB.address && !sameRouterToken;
  const pairAddress = canSearch && pair?.address ? formatAddress(pair.address) : "-";
  const hasPosition = Boolean(pair?.address && (pair.lpBalance ?? 0n) > 0n);
  const alreadyImported = isPairTracked(trackedPositions, pair?.address);
  const visibleTokens = useMemo(() => tokens, [tokens]);

  function chooseToken(token: Token) {
    if (picker === "a") setTokenA(token);
    if (picker === "b") setTokenB(token);
    setPicker(null);
  }

  return (
    <Modal title="Import position" onClose={onClose} large>
      <p className="card-subtitle" style={{ marginBottom: 16 }}>Select two tokens to calculate the V2 pair address and check the connected wallet LP balance.</p>
      <div className="import-token-stack">
        <ImportTokenBox label="Token A" token={tokenA} onSelect={() => setPicker(picker === "a" ? null : "a")} />
        <ImportTokenBox label="Token B" token={tokenB} onSelect={() => setPicker(picker === "b" ? null : "b")} />
      </div>
      {picker ? (
        <div className="inline-token-picker">
          {visibleTokens.map((token) => (
            <button key={token.address} className="token-item" onClick={() => chooseToken(token)}>
              <TokenIcon token={token} />
              <div>
                <strong>{token.symbol}</strong>
              </div>
              <span className="state-value">{token.decimals} dec</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="info-list">
        <Info label="Calculated pair address" value={loading ? "Checking..." : pairAddress} />
        <Info label="Version" value="V2" />
      </div>
      {!canSearch ? <p className="notice warn">Select two different router assets.</p> : null}
      {canSearch && !loading && !pair?.address ? <p className="notice warn">No V2 pair found for this token pair.</p> : null}
      {canSearch && pair?.address ? (
        <div className="pool-card import-result-card">
          <div className="import-result-row">
            <div className="row">
              <div className="pair-icons">
                <TokenIcon token={tokenA} />
                <TokenIcon token={tokenB} />
              </div>
              <div>
                <h3>{tokenA.symbol} / {tokenB.symbol}</h3>
                <p className="card-subtitle">{alreadyImported ? "Already imported" : hasPosition ? "LP position found" : "Pair found. No wallet LP balance detected."}</p>
              </div>
            </div>
            <Button className="import-result-action" variant={hasPosition && !alreadyImported ? "primary" : "soft"} disabled={!hasPosition || alreadyImported} onClick={() => pair.address ? onImport(tokenA, tokenB, pair.address) : undefined}>
              {alreadyImported ? "Imported" : hasPosition ? "Import" : "No position"}
            </Button>
            <div className="import-result-metrics">
              <div className="metric"><span>LP balance</span><strong>{formatTokenAmountFixed(pair.lpBalance ?? 0n, 18)}</strong></div>
              <div className="metric"><span>Pair address</span><strong>{formatAddress(pair.address)}</strong></div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function ImportTokenBox({ label, token, onSelect }: { label: string; token: Token; onSelect: () => void }) {
  return (
    <div className="token-box import-token-box">
      <div className="token-meta">
        <span>{label}</span>
        <span className="num">{token.symbol}</span>
      </div>
      <Button className="token-select import-token-select" onClick={onSelect}>
        <TokenIcon token={token} />
        <span>{token.symbol}</span>
        <span>⌄</span>
      </Button>
    </div>
  );
}
