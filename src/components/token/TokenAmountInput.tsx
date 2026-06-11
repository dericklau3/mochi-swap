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
  disabled,
  tokenLocked,
  onAmountChange,
  onSelect,
  onMax
}: {
  label: string;
  token?: Token;
  amount: string;
  balance?: bigint;
  readOnly?: boolean;
  disabled?: boolean;
  tokenLocked?: boolean;
  onAmountChange: (value: string) => void;
  onSelect: () => void;
  onMax?: () => void;
}) {
  return (
    <div className={`token-box${disabled ? " is-disabled" : ""}`} aria-disabled={disabled}>
      <div className="token-meta">
        <span>{label}</span>
        <span className="num">
          {balance !== undefined && token ? formatTokenAmount(balance, token.decimals) : "0"}
          {onMax ? (
            <button type="button" className="max-btn" disabled={disabled} onClick={onMax}>
              Max
            </button>
          ) : null}
        </span>
      </div>
      <div className="token-row">
        <button type="button" className="token-select" disabled={disabled || tokenLocked} onClick={onSelect}>
          <TokenIcon token={token} muted={!token} />
          <span>{token?.symbol ?? "Select"}</span>
          {!tokenLocked ? <ChevronDown className="h-4 w-4" /> : null}
        </button>
        <input
          className="amount-input"
          placeholder="0.0"
          inputMode="decimal"
          value={amount}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(event) => onAmountChange(toSafeAmount(event.target.value))}
        />
      </div>
    </div>
  );
}
