import { Trash2 } from "lucide-react";
import type { Token } from "../../types/token";
import { formatTokenAmount } from "../../lib/format";
import { Button } from "../ui/Button";
import { TokenIcon } from "./TokenIcon";

export function TokenList({ tokens, balances, onChoose, onRemove }: { tokens: Token[]; balances: Record<string, bigint>; onChoose: (token: Token) => void; onRemove: (token: Token) => void }) {
  return (
    <div className="token-list">
      {tokens.map((token) => (
        <button key={token.address} className="token-item" onClick={() => onChoose(token)}>
          <TokenIcon token={token} />
          <span className="min-w-0">
            <strong>{token.symbol}</strong>
          </span>
          <span className="row">
            <span className="state-value">{formatTokenAmount(balances[token.address] ?? 0n, token.decimals)}</span>
            {token.isCustom ? (
              <Button variant="danger" className="mini-btn" onClick={(event) => { event.stopPropagation(); onRemove(token); }} aria-label={`Remove ${token.symbol}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}
