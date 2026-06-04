import { useState } from "react";
import { isAddress, type Address } from "viem";
import { useMulticallTokenMetadata } from "../../hooks/useMulticallTokenMetadata";
import type { Token } from "../../types/token";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function CustomTokenForm({ existing, onAdd }: { existing: Token[]; onAdd: (token: Token) => void }) {
  const [address, setAddress] = useState("");
  const valid = isAddress(address);
  const metadata = useMulticallTokenMetadata(valid ? [address as Address] : []);
  const token = metadata.data?.[0];
  const alreadyAdded = valid && existing.some((item) => item.address.toLowerCase() === address.toLowerCase());

  return (
    <div className="state-grid">
      <Input className="search-input" placeholder="Search symbol or paste ERC20 address" value={address} onChange={(event) => setAddress(event.target.value)} />
      {address.startsWith("0x") && !valid ? <p className="notice danger">Invalid token address.</p> : null}
      {valid && metadata.isLoading ? <p className="notice">Reading token metadata...</p> : null}
      {valid && metadata.isError ? <p className="notice danger">Token metadata read failed.</p> : null}
      {token ? (
        <div className="token-item">
          <span className="coin">{token.symbol.slice(0, 1)}</span>
          <div>
            <strong>{token.symbol}</strong>
            <p className="token-name">decimals {token.decimals}</p>
          </div>
          <Button className="mini-btn" disabled={alreadyAdded} onClick={() => onAdd({ ...token, isCustom: true })}>
            {alreadyAdded ? "Added" : "Add"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
