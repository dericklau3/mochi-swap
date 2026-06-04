import type { Token } from "../../types/token";
import { cn } from "../../lib/utils";

export function TokenIcon({ token, muted, className }: { token?: Token; muted?: boolean; className?: string }) {
  if (token?.logoURI) {
    return <img className={cn("coin", className)} src={token.logoURI} alt={token.symbol} />;
  }
  return <span className={cn("coin", muted && "muted", className)}>{token?.symbol?.slice(0, 1) ?? "?"}</span>;
}
