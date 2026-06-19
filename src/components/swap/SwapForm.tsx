import { ArrowDownUp, Settings } from "lucide-react";
import { parseUnits } from "viem";
import type { Token, V4PoolKey } from "../../types/token";
import { permit2Address, routerAddress, universalRouterAddress, v3SwapRouterAddress } from "../../lib/contracts";
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
import { useAccount, useChainId, useSignTypedData } from "wagmi";
import { getReadableError } from "../../lib/errors";
import { formatTokenAmountPlain } from "../../lib/format";
import { isSameRouterToken } from "../../lib/routerTokens";
import type { BestSwapQuote } from "../../hooks/useSwap";
import { usePermit2Allowance } from "../../hooks/usePermit2Allowance";
import { buildPermit2Single, getPermit2AuthorizationStep, getPermit2SingleTypedData } from "../../lib/permit2";
import { formatV4RouteLabel } from "../../lib/v4";
import { isTargetChainId } from "../../lib/network";

export function SwapForm({ from, to, amount, slippage, deadline, v4Candidates, onAmount, onFrom, onTo, onFlip, onSettings }: { from: Token; to: Token; amount: string; slippage: string; deadline: string; v4Candidates: V4PoolKey[]; onAmount: (value: string) => void; onFrom: () => void; onTo: () => void; onFlip: () => void; onSettings: () => void }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const debouncedAmount = useDebouncedValue(amount);
  const balances = useMulticallTokenBalances([from, to]);
  const v2Allowances = useMulticallTokenAllowances([from], routerAddress);
  const v3Allowances = useMulticallTokenAllowances([from], v3SwapRouterAddress);
  const permit2TokenAllowances = useMulticallTokenAllowances([from], permit2Address);
  const permit2Allowance = usePermit2Allowance(!from.isNative ? from.address : undefined, universalRouterAddress);
  const pair = useMulticallPairInfo(from, to);
  const approveV2 = useApproveToken(from.address, routerAddress);
  const approveV3 = useApproveToken(from.address, v3SwapRouterAddress);
  const approvePermit2Token = useApproveToken(from.address, permit2Address);
  const permitSignature = useSignTypedData();
  const slippageBps = Math.round(Number(slippage) * 100);
  const swap = useSwap(from, to, slippageBps, Number(deadline), v4Candidates);
  const [quote, setQuote] = useState<BestSwapQuote>();
  const [quoteError, setQuoteError] = useState("");
  const [priceDirection, setPriceDirection] = useState<"from" | "to">("from");
  useTransactionMessage({
    hash: approveV2.hash,
    isSuccess: approveV2.isSuccess,
    readableError: approveV2.readableError,
    successTitle: `${from.symbol} approved`,
    failureTitle: `${from.symbol} approval failed`
  });
  useTransactionMessage({
    hash: approvePermit2Token.hash,
    isSuccess: approvePermit2Token.isSuccess,
    readableError: approvePermit2Token.readableError,
    successTitle: `${from.symbol} approved for Permit2`,
    failureTitle: `${from.symbol} Permit2 token approval failed`
  });
  useTransactionMessage({
    isSuccess: false,
    readableError: permitSignature.error ? getReadableError(permitSignature.error) : undefined,
    successTitle: "Permit2 signed",
    failureTitle: "Permit2 signature failed"
  });
  useTransactionMessage({
    hash: approveV3.hash,
    isSuccess: approveV3.isSuccess,
    readableError: approveV3.readableError,
    successTitle: `${from.symbol} approved for V3`,
    failureTitle: `${from.symbol} V3 approval failed`
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
  const allowance = quote?.protocol === "V3" ? v3Allowances.data?.[from.address] ?? 0n : v2Allowances.data?.[from.address] ?? 0n;
  const insufficientBalance = amountIn > balance;
  const sameRouterToken = isSameRouterToken(from, to) && quote?.protocol !== "V4";
  const v4Authorization = from.isNative || quote?.protocol !== "V4" ? "READY" : getPermit2AuthorizationStep({
    amount: amountIn,
    tokenAllowance: permit2TokenAllowances.data?.[from.address] ?? 0n,
    permit2Amount: permit2Allowance.data?.amount ?? 0n,
    permit2Expiration: BigInt(permit2Allowance.data?.expiration ?? 0),
    now: BigInt(Math.floor(Date.now() / 1000))
  });
  const needsApproval = !from.isNative && amountIn > 0n && (quote?.protocol === "V4" ? v4Authorization === "TOKEN_TO_PERMIT2" : allowance < amountIn);
  const reserves = getPairReserves(pair.data, from, to);
  const price = reserves
    ? priceDirection === "from"
      ? formatPoolPrice(from, to, reserves.reserveA, reserves.reserveB)
      : formatPoolPrice(to, from, reserves.reserveB, reserves.reserveA)
    : `Enter amount for ${from.symbol}/${to.symbol} quote`;
  const priceImpact = reserves && quote?.protocol === "V2" ? calculatePriceImpact(amountIn, quote.amountOut, reserves.reserveA, reserves.reserveB) : "0.00%";
  const minimumReceived = calculateMinimumReceived(quote?.amountOut, BigInt(slippageBps));
  const routeLabel = quote ? quote.protocol === "V4" ? formatV4RouteLabel(quote.fee) : quote.protocol === "V3" ? `V3 ${quote.fee / 10_000}%` : "V2" : undefined;
  const isCorrectChain = isTargetChainId(chainId);
  const disabled = !isConnected || !isCorrectChain || !amount || insufficientBalance || !quote || Boolean(quoteError) || sameRouterToken || permitSignature.isPending;
  const cta = !isConnected ? "Connect Wallet" : !isCorrectChain ? "Switch to BSC Testnet" : sameRouterToken ? "Select different tokens" : !amount ? "Enter Amount" : insufficientBalance ? "Insufficient Balance" : needsApproval ? `Approve ${from.symbol}` : permitSignature.isPending ? "Signing" : swap.isPending ? "Pending" : "Swap";

  async function submitSwap() {
    if (!isCorrectChain) return;
    if (!quote) return;
    if (needsApproval) {
      if (quote.protocol === "V4") return approvePermit2Token.approve();
      return quote.protocol === "V3" ? approveV3.approve(amountIn) : approveV2.approve(amountIn);
    }
    if (quote.protocol !== "V4" || from.isNative || v4Authorization === "READY") {
      return swap.swap(amount, quote);
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    const permit = buildPermit2Single({
      token: from.address,
      spender: universalRouterAddress,
      expiration: nowSeconds + 30 * 24 * 60 * 60,
      nonce: permit2Allowance.data?.nonce ?? 0,
      sigDeadline: BigInt(nowSeconds + Number(deadline) * 60)
    });
    const signature = await permitSignature.signTypedDataAsync(getPermit2SingleTypedData(chainId, permit));
    swap.swap(amount, quote, { permit, signature });
  }

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
      <TokenAmountInput label="You receive" token={to} amount={formatTokenAmountPlain(quote?.amountOut, to.decimals, 12)} balance={balances.data?.[to.address] ?? 0n} readOnly onAmountChange={() => undefined} onSelect={onTo} />
      <SwapPreview
        to={to}
        price={price}
        priceImpact={priceImpact}
        minimumReceived={minimumReceived}
        slippage={slippage}
        route={routeLabel}
        onTogglePrice={() => setPriceDirection((current) => current === "from" ? "to" : "from")}
      />
      {balances.isLoading || v2Allowances.isLoading || v3Allowances.isLoading || permit2TokenAllowances.isLoading || permit2Allowance.isLoading ? <p className="notice">Loading balances and allowance...</p> : null}
      {quoteError ? <p className="notice danger">{quoteError}</p> : null}
      {sameRouterToken ? <p className="notice warn">BNB and WBNB route to the same wrapped asset. Select a different pair.</p> : null}
      <Button
        variant="primary"
        className="btn-wide"
        disabled={needsApproval ? !isCorrectChain : disabled}
        isLoading={approveV2.isPending || approveV3.isPending || approvePermit2Token.isPending || permitSignature.isPending || swap.isPending}
        onClick={submitSwap}
      >
        {approveV2.isPending || approveV3.isPending || approvePermit2Token.isPending ? "Approving" : cta}
      </Button>
    </Card>
  );
}
