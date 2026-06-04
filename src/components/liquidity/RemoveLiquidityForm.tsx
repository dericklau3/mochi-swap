import type { Token } from "../../types/token";
import { useMulticallPairInfo } from "../../hooks/useMulticallPairInfo";
import { useApproveToken } from "../../hooks/useApproveToken";
import { useRemoveLiquidity } from "../../hooks/useRemoveLiquidity";
import { useTransactionMessage } from "../../hooks/useTransactionMessage";
import { erc20Abi, uniswapV2PairAbi } from "../../lib/abis";
import { routerAddress } from "../../lib/contracts";
import { calculateLiquidityPosition } from "../../lib/ammMath";
import { formatTokenAmountFixed } from "../../lib/format";
import { getReadableError } from "../../lib/errors";
import { buildLiquidityPermitTypedData, parsePermitSignature } from "../../lib/permit";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Info } from "../swap/SwapPreview";
import { TokenIcon } from "../token/TokenIcon";
import { useState } from "react";
import { useAccount, useChainId, usePublicClient, useSignTypedData } from "wagmi";

export function RemoveLiquidityForm({ tokenA, tokenB, percent, onPercent, onBack }: { tokenA: Token; tokenB: Token; percent: number; onPercent: (value: number) => void; onBack: () => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const signPermit = useSignTypedData();
  const [usePermit, setUsePermit] = useState(true);
  const pair = useMulticallPairInfo(tokenA, tokenB);
  const approve = useApproveToken(pair.data?.address ?? undefined, routerAddress, true);
  const remove = useRemoveLiquidity(tokenA, tokenB);
  useTransactionMessage({
    hash: approve.hash,
    isSuccess: approve.isSuccess,
    readableError: approve.readableError,
    successTitle: "LP token approved",
    failureTitle: "LP token approval failed"
  });
  useTransactionMessage({
    hash: remove.hash,
    isSuccess: remove.isSuccess,
    readableError: remove.readableError,
    successTitle: "Liquidity removed",
    failureTitle: "Remove liquidity failed"
  });
  useTransactionMessage({
    isSuccess: false,
    readableError: signPermit.error ? getReadableError(signPermit.error) : undefined,
    successTitle: "Permit signed",
    failureTitle: "Permit signature failed"
  });
  const lpBalance = pair.data?.lpBalance ?? 0n;
  const lpAmount = lpBalance * BigInt(percent) / 100n;
  const position = calculateLiquidityPosition(pair.data, tokenA, tokenB, lpAmount);
  const needsApproval = !usePermit && (pair.data?.lpAllowance ?? 0n) < lpAmount && lpAmount > 0n;
  const cta = !isConnected ? "Connect Wallet" : !pair.data?.address ? "Pair not found" : usePermit ? signPermit.isPending ? "Signing Permit" : remove.isPending ? "Pending" : "Sign Permit" : needsApproval ? "Approve LP Token" : remove.isPending ? "Pending" : "Remove Liquidity";

  async function removeWithPermit() {
    if (!address || !publicClient || !pair.data?.address || lpAmount === 0n) return;
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      const [nonce, lpName] = await Promise.all([
        publicClient.readContract({ address: pair.data.address, abi: uniswapV2PairAbi, functionName: "nonces", args: [address] }) as Promise<bigint>,
        publicClient.readContract({ address: pair.data.address, abi: erc20Abi, functionName: "name" }).catch(() => "Uniswap V2") as Promise<string>
      ]);
      const signature = await signPermit.signTypedDataAsync(buildLiquidityPermitTypedData({
        chainId,
        pairAddress: pair.data.address,
        owner: address,
        spender: routerAddress,
        value: lpAmount,
        nonce,
        deadline,
        name: lpName
      }));
      remove.removeLiquidityWithPermit(lpAmount, {
        ...parsePermitSignature(signature),
        approveMax: false,
        deadline
      });
    } catch {
      // Wagmi exposes signature errors through signPermit.error for the message toast.
    }
  }

  function submit() {
    if (usePermit) {
      void removeWithPermit();
      return;
    }
    if (needsApproval) approve.approve(lpAmount);
    else remove.removeLiquidity(lpAmount);
  }

  return (
    <Card>
      <div className="detail-head">
        <Button className="icon-btn back-icon" aria-label="Back" onClick={onBack}>←</Button>
      </div>
      <div className="card-head"><div><h2 className="card-title">Remove Liquidity</h2><p className="card-subtitle">{tokenA.symbol} / {tokenB.symbol} LP balance: <span className="num">{formatTokenAmountFixed(lpBalance, 18)}</span></p></div></div>
      <div className="pool-card" style={{ boxShadow: "var(--elev-ring)", marginBottom: 16 }}>
        <div className="pair-head">
          <div className="row"><div className="pair-icons"><TokenIcon token={tokenA} /><TokenIcon token={tokenB} /></div><div><h3>{tokenA.symbol} / {tokenB.symbol}</h3><p className="card-subtitle">Selected LP position</p></div></div>
          <strong className="state-value">{percent}%</strong>
        </div>
      </div>
      <div className="percent-grid">
        {[25, 50, 75, 100].map((value) => <button key={value} className={value === percent ? "is-active" : ""} onClick={() => onPercent(value)}>{value}%</button>)}
      </div>
      <input className="plain-input" inputMode="numeric" value={percent} onChange={(event) => onPercent(Number(event.target.value))} />
      <div className="switch-row permit-row">
        <div>
          <strong>Use Permit Signature</strong>
          <p className="card-subtitle">Skip LP token approval by signing a permit message.</p>
        </div>
        <button className={`switch ${usePermit ? "is-on" : ""}`} role="switch" aria-checked={usePermit} onClick={() => setUsePermit((current) => !current)}>
          <span />
        </button>
      </div>
      <div className="info-list">
        <Info label={`Estimated ${tokenA.symbol}`} value={formatTokenAmountFixed(position.amountA, tokenA.decimals)} />
        <Info label={`Estimated ${tokenB.symbol}`} value={formatTokenAmountFixed(position.amountB, tokenB.decimals)} />
        <Info label="LP amount" value={formatTokenAmountFixed(lpAmount, 18)} />
      </div>
      <Button variant="primary" className="btn-wide" disabled={!isConnected || !pair.data?.address || lpAmount === 0n} isLoading={approve.isPending || remove.isPending || signPermit.isPending} onClick={submit}>
        {approve.isPending ? "Approving" : cta}
      </Button>
    </Card>
  );
}
