import { useState } from "react";
import { zeroAddress, type Address } from "viem";
import type { Token, TrackedPoolPosition } from "../../types/token";
import { formatAddress, formatTokenAmountFixed } from "../../lib/format";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { isSameRouterToken } from "../../lib/routerTokens";
import { isPairTracked } from "../../lib/poolPositions";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TokenIcon } from "../token/TokenIcon";
import { TokenSelector } from "../token/TokenSelector";
import { Info } from "../swap/SwapPreview";
import { useV4Position } from "../../hooks/useV4Position";
import { useAccount } from "wagmi";

export function ImportPositionModal({
  tokens,
  defaultA,
  defaultB,
  trackedPositions,
  onClose,
  onImport,
  onImportV4,
  onAddCustom,
  onRemoveCustom
}: {
  tokens: Token[];
  defaultA: Token;
  defaultB: Token;
  trackedPositions: TrackedPoolPosition[];
  onClose: () => void;
  onImport: (tokenA: Token, tokenB: Token, pairAddress: Address) => void;
  onImportV4: (position: TrackedPoolPosition) => void;
  onAddCustom: (token: Token) => void;
  onRemoveCustom: (token: Token) => void;
}) {
  const [tokenA, setTokenA] = useState(defaultA);
  const [tokenB, setTokenB] = useState(defaultB);
  const [picker, setPicker] = useState<"a" | "b" | null>(null);
  const [version, setVersion] = useState<"V2" | "V4">("V2");
  const [v4TokenId, setV4TokenId] = useState("");
  const { address } = useAccount();
  const parsedV4TokenId = /^\d+$/.test(v4TokenId) ? BigInt(v4TokenId) : undefined;
  const importedV4 = useV4Position(version === "V4" ? parsedV4TokenId : undefined);
  const importedPair = useMulticallPairInfo(tokenA, tokenB);
  const pair = importedPair.data;
  const loading = importedPair.isLoading;
  const sameRouterToken = isSameRouterToken(tokenA, tokenB);
  const canSearch = tokenA.address !== tokenB.address && !sameRouterToken;
  const pairAddress = canSearch && pair?.address ? formatAddress(pair.address) : "-";
  const hasPosition = Boolean(pair?.address && (pair.lpBalance ?? 0n) > 0n);
  const alreadyImported = isPairTracked(trackedPositions, pair?.address);

  function chooseToken(token: Token) {
    if (picker === "a") setTokenA(token);
    if (picker === "b") setTokenB(token);
    setPicker(null);
  }

  const v4Position = importedV4.data;
  const v4TokenA = v4Position
    ? tokens.find((token) => (token.isNative ? zeroAddress : token.address).toLowerCase() === v4Position.poolKey.currency0.toLowerCase())
    : undefined;
  const v4TokenB = v4Position
    ? tokens.find((token) => (token.isNative ? zeroAddress : token.address).toLowerCase() === v4Position.poolKey.currency1.toLowerCase())
    : undefined;
  const ownsV4Position = Boolean(v4Position && address && v4Position.owner?.toLowerCase() === address.toLowerCase());
  const hasZeroHook = Boolean(v4Position && v4Position.poolKey.hooks.toLowerCase() === zeroAddress);

  return (
    <Modal title="Import position" onClose={onClose} large>
      <div className="segmented range-segment" style={{ marginBottom: 16 }}>
        <button type="button" className={version === "V2" ? "is-active" : ""} onClick={() => setVersion("V2")}>V2 pair</button>
        <button type="button" className={version === "V4" ? "is-active" : ""} onClick={() => setVersion("V4")}>V4 NFT</button>
      </div>
      {version === "V4" ? (
        <>
          <p className="card-subtitle" style={{ marginBottom: 16 }}>Enter a PositionManager token ID. PoolKey, ticks, liquidity, and ownership are read from chain.</p>
          <label className="v3-step">
            <span className="card-subtitle">V4 token ID</span>
            <input className="plain-input" value={v4TokenId} inputMode="numeric" onChange={(event) => setV4TokenId(event.target.value.replace(/\D/g, ""))} placeholder="0" />
          </label>
          {importedV4.isLoading ? <p className="notice">Loading V4 position...</p> : null}
          {importedV4.error ? <p className="notice danger">V4 position was not found.</p> : null}
          {v4Position ? (
            <div className="info-list">
              <Info label="Owner" value={v4Position.owner ? formatAddress(v4Position.owner) : "-"} />
              <Info label="Fee tier" value={`${v4Position.poolKey.fee / 10_000}%`} />
              <Info label="Ticks" value={`${v4Position.tickLower} to ${v4Position.tickUpper}`} />
              <Info label="Liquidity" value={v4Position.liquidity.toString()} />
            </div>
          ) : null}
          {v4Position && (!v4TokenA || !v4TokenB) ? <p className="notice warn">Import both pool currencies into the token list first.</p> : null}
          {v4Position && !ownsV4Position ? <p className="notice warn">The connected wallet does not own this V4 NFT.</p> : null}
          {v4Position && !hasZeroHook ? <p className="notice warn">Only V4 positions without hooks are supported.</p> : null}
          <Button
            variant="primary"
            className="btn-wide"
            disabled={!v4Position || !v4TokenA || !v4TokenB || !ownsV4Position || !hasZeroHook}
            onClick={() => {
              if (!v4Position || !v4TokenA || !v4TokenB) return;
              onImportV4({
                pairAddress: zeroAddress,
                tokenA: v4TokenA,
                tokenB: v4TokenB,
                protocol: "V4",
                fee: v4Position.poolKey.fee,
                tokenId: v4Position.tokenId,
                v4PoolKey: v4Position.poolKey,
                tickLower: v4Position.tickLower,
                tickUpper: v4Position.tickUpper
              });
            }}
          >
            Import V4 position
          </Button>
        </>
      ) : (
      <>
      <p className="card-subtitle" style={{ marginBottom: 16 }}>Select two tokens to calculate the V2 pair address and check the connected wallet LP balance.</p>
      <div className="import-token-stack">
        <ImportTokenBox label="Token A" token={tokenA} onSelect={() => setPicker(picker === "a" ? null : "a")} />
        <ImportTokenBox label="Token B" token={tokenB} onSelect={() => setPicker(picker === "b" ? null : "b")} />
      </div>
      <TokenSelector
        open={picker !== null}
        tokens={tokens}
        onClose={() => setPicker(null)}
        onChoose={chooseToken}
        onAddCustom={onAddCustom}
        onRemoveCustom={onRemoveCustom}
      />
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
      </>
      )}
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
