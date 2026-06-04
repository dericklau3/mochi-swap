import { ChevronDown } from "lucide-react";
import type { Token } from "../../types/token";
import { formatTokenAmount, toSafeAmount } from "../../lib/format";
import { TokenIcon } from "./TokenIcon";

export function TokenAmountInput({
  label,
  token,
  amount,
  balance,
  readOnly,
  onAmountChange,
  onSelect,
  onMax
}: {
  label: string;
  token?: Token;
  amount: string;
  balance?: bigint;
  readOnly?: boolean;
  onAmountChange: (value: string) => void;
  onSelect: () => void;
  onMax?: () => void;
}) {
  return (
    <div className="token-box">
      <div className="token-meta">
        <span>{label}</span>
        <span className="num">
          {balance !== undefined && token ? formatTokenAmount(balance, token.decimals) : "0"}
          {onMax ? (
            <button className="max-btn" onClick={onMax}>
              Max
            </button>
          ) : null}
        </span>
      </div>
      <div className="token-row">
        <button className="token-select" onClick={onSelect}>
          <TokenIcon token={token} muted={!token} />
          <span>{token?.symbol ?? "Select"}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        <input
          className="amount-input"
          placeholder="0.0"
          inputMode="decimal"
          value={amount}
          readOnly={readOnly}
          onChange={(event) => onAmountChange(toSafeAmount(event.target.value))}
        />
      </div>
    </div>
  );
}
