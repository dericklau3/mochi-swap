import { ArrowDownUp, Settings } from "lucide-react";
import { parseUnits } from "viem";
import type { Token } from "../../types/token";
import { routerAddress } from "../../lib/contracts";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useMulticallTokenBalances } from "../../hooks/useMulticallTokenBalances";
import { useMulticallTokenAllowances } from "../../hooks/useMulticallTokenAllowances";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useApproveToken } from "../../hooks/useApproveToken";
import { useSwap } from "../../hooks/useSwap";
import { useTransactionMessage } from "../../hooks/useTransactionMessage";
import { calculateMinimumReceived, calculatePriceImpact, formatPoolPrice, getPairReserves } from "../../lib/ammMath";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { TokenAmountInput } from "../token/TokenAmountInput";
import { SwapPreview } from "./SwapPreview";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { getReadableError } from "../../lib/errors";
import { formatTokenAmountPlain } from "../../lib/format";
import { isSameRouterToken } from "../../lib/routerTokens";

export function SwapForm({ from, to, amount, slippage, deadline, onAmount, onFrom, onTo, onFlip, onSettings }: { from: Token; to: Token; amount: string; slippage: string; deadline: string; onAmount: (value: string) => void; onFrom: () => void; onTo: () => void; onFlip: () => void; onSettings: () => void }) {
  const { isConnected } = useAccount();
  const debouncedAmount = useDebouncedValue(amount);
  const balances = useMulticallTokenBalances([from, to]);
  const allowances = useMulticallTokenAllowances([from], routerAddress);
  const pair = useMulticallPairInfo(from, to);
  const approve = useApproveToken(from.address, routerAddress);
  const slippageBps = Math.round(Number(slippage) * 100);
  const swap = useSwap(from, to, slippageBps, Number(deadline));
  const [quote, setQuote] = useState<bigint>();
  const [quoteError, setQuoteError] = useState("");
  const [priceDirection, setPriceDirection] = useState<"from" | "to">("from");
  useTransactionMessage({
    hash: approve.hash,
    isSuccess: approve.isSuccess,
    readableError: approve.readableError,
    successTitle: `${from.symbol} approved`,
    failureTitle: `${from.symbol} approval failed`
  });
  useTransactionMessage({
    hash: swap.hash,
    isSuccess: swap.isSuccess,
    readableError: swap.readableError,
    successTitle: "Swap successful",
    failureTitle: "Swap failed"
  });

  useEffect(() => {
    let cancelled = false;
    setQuoteError("");
    if (!debouncedAmount) {
      setQuote(undefined);
      return;
    }
    swap.quote(debouncedAmount).then((next) => {
      if (!cancelled) setQuote(next);
    }).catch((error: unknown) => {
      if (!cancelled) setQuoteError(getReadableError(error));
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedAmount, swap]);

  const amountIn = useMemo(() => {
    try {
      return amount ? parseUnits(amount, from.decimals) : 0n;
    } catch {
      return 0n;
    }
  }, [amount, from.decimals]);
  const balance = balances.data?.[from.address] ?? 0n;
  const allowance = allowances.data?.[from.address] ?? 0n;
  const insufficientBalance = amountIn > balance;
  const sameRouterToken = isSameRouterToken(from, to);
  const needsApproval = !from.isNative && amountIn > 0n && allowance < amountIn;
  const reserves = getPairReserves(pair.data, from, to);
  const price = reserves
    ? priceDirection === "from"
      ? formatPoolPrice(from, to, reserves.reserveA, reserves.reserveB)
      : formatPoolPrice(to, from, reserves.reserveB, reserves.reserveA)
    : `Enter amount for ${from.symbol}/${to.symbol} quote`;
  const priceImpact = reserves ? calculatePriceImpact(amountIn, quote, reserves.reserveA, reserves.reserveB) : "0.00%";
  const minimumReceived = calculateMinimumReceived(quote, BigInt(slippageBps));
  const disabled = !isConnected || !amount || insufficientBalance || !quote || Boolean(quoteError) || sameRouterToken;
  const cta = !isConnected ? "Connect Wallet" : sameRouterToken ? "Select different tokens" : !amount ? "Enter Amount" : insufficientBalance ? "Insufficient Balance" : needsApproval ? `Approve ${from.symbol}` : swap.isPending ? "Pending" : "Swap";

  return (
    <Card>
      <div className="card-head">
        <div><h2 className="card-title">Swap</h2></div>
        <button className="icon-btn" onClick={onSettings} aria-label="Settings"><Settings className="h-4 w-4" /></button>
      </div>
      <TokenAmountInput label="You pay" token={from} amount={amount} balance={balance} onAmountChange={onAmount} onSelect={onFrom} onMax={() => onAmount(balance ? String(Number(balance) / 10 ** from.decimals) : "")} />
      <button className="swap-arrow" onClick={onFlip} aria-label="Switch tokens">
        <ArrowDownUp className="h-5 w-5" />
      </button>
      <TokenAmountInput label="You receive" token={to} amount={formatTokenAmountPlain(quote, to.decimals, 12)} balance={balances.data?.[to.address] ?? 0n} readOnly onAmountChange={() => undefined} onSelect={onTo} />
      <SwapPreview
        to={to}
        price={price}
        priceImpact={priceImpact}
        minimumReceived={minimumReceived}
        slippage={slippage}
        onTogglePrice={() => setPriceDirection((current) => current === "from" ? "to" : "from")}
      />
      {balances.isLoading || allowances.isLoading ? <p className="notice">Loading balances and allowance...</p> : null}
      {quoteError ? <p className="notice danger">{quoteError}</p> : null}
      {sameRouterToken ? <p className="notice warn">BNB and WBNB route to the same wrapped asset. Select a different pair.</p> : null}
      <Button
        variant="primary"
        className="btn-wide"
        disabled={needsApproval ? false : disabled}
        isLoading={approve.isPending || swap.isPending}
        onClick={() => needsApproval ? approve.approve(amountIn) : quote ? swap.swap(amount, quote) : undefined}
      >
        {approve.isPending ? "Approving" : cta}
      </Button>
    </Card>
  );
}
