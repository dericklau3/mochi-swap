import type { ReactNode } from "react";
import { ArrowLeftRight } from "lucide-react";

import { formatTokenAmountPlain } from "../../lib/format";
import type { Token } from "../../types/token";

export function SwapPreview({
  to,
  price,
  priceImpact,
  minimumReceived,
  slippage,
  onTogglePrice
}: {
  to: Token;
  price: string;
  priceImpact: string;
  minimumReceived: bigint;
  slippage: string;
  onTogglePrice: () => void;
}) {
  const amount = minimumReceived ? formatTokenAmountPlain(minimumReceived, to.decimals, 12) : "0";
  return (
    <div className="info-list">
      <div className="info-line">
        <span>Price</span>
        <strong className="price-value">
          {price}
          <button type="button" className="mini-btn price-toggle" aria-label="Switch price direction" onClick={onTogglePrice}>
            <ArrowLeftRight size={14} strokeWidth={2.4} />
          </button>
        </strong>
      </div>
      <Info label="Price Impact" value={priceImpact} />
      <Info label="Minimum Received" value={`${amount} ${to.symbol}`} />
      <Info label="Slippage Tolerance" value={`${slippage}%`} />
    </div>
  );
}

export function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
