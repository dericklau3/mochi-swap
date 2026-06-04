import { useCallback, useEffect, useMemo, useState } from "react";
import type { Token } from "../types/token";
import { defaultPoolTokens, defaultTokens } from "../lib/tokens";
import { loadCustomTokens, mergeCustomToken, saveCustomTokens } from "../lib/customTokens";
import { hasTrackedTokenPair, isPairTracked, loadPoolPositions, savePoolPositions, upsertPoolPosition } from "../lib/poolPositions";
import { AppLayout } from "../components/layout/AppLayout";
import type { PageKey } from "../pages/types";
import { TokenSelector } from "../components/token/TokenSelector";
import { SwapSettings } from "../components/swap/SwapSettings";
import { SwapPage } from "../pages/SwapPage";
import { PoolPage } from "../pages/PoolPage";
import { AddLiquidityPage } from "../pages/AddLiquidityPage";
import { RemoveLiquidityPage } from "../pages/RemoveLiquidityPage";
import { PairDetailPage } from "../pages/PairDetailPage";
import { CreatePositionModal, type LiquidityMode } from "../components/liquidity/CreatePositionModal";
import { ImportPositionModal } from "../components/liquidity/ImportPositionModal";
import { MessageProvider } from "../components/ui/Message";
import type { Address } from "viem";
import type { V3PriceDirection, V3RangeMode } from "../pages/AddLiquidityPage";

type TokenTarget = "from" | "to" | "liqA" | "liqB";
type PoolModal = "createPosition" | "importPosition";

export default function App() {
  const [page, setPage] = useState<PageKey>("swap");
  const [customTokens, setCustomTokens] = useState<Token[]>(() => loadCustomTokens());
  const [poolPositions, setPoolPositions] = useState(() => loadPoolPositions());
  const tokens = useMemo(() => [...defaultTokens, ...customTokens], [customTokens]);
  const visiblePoolPositions = useMemo(() => {
    const defaultPosition = { pairAddress: "0x0000000000000000000000000000000000000000" as Address, tokenA: defaultPoolTokens[0], tokenB: defaultPoolTokens[1] };
    return hasTrackedTokenPair(poolPositions, defaultPoolTokens[0], defaultPoolTokens[1]) ? poolPositions : [defaultPosition, ...poolPositions];
  }, [poolPositions]);
  const [fromToken, setFromToken] = useState(defaultPoolTokens[0]);
  const [toToken, setToToken] = useState(defaultPoolTokens[1]);
  const [liqA, setLiqA] = useState(defaultPoolTokens[0]);
  const [liqB, setLiqB] = useState(defaultPoolTokens[1]);
  const [swapAmount, setSwapAmount] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [liquidityMode, setLiquidityMode] = useState<LiquidityMode>("V2");
  const [v3FeeTier, setV3FeeTier] = useState("0.3%");
  const [initialPrice, setInitialPrice] = useState("");
  const [initialPriceDirection, setInitialPriceDirection] = useState<V3PriceDirection>("quote");
  const [rangeMode, setRangeMode] = useState<V3RangeMode>("full");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [removePercent, setRemovePercent] = useState(50);
  const [selector, setSelector] = useState<TokenTarget | null>(null);
  const [poolModal, setPoolModal] = useState<PoolModal | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [deadline, setDeadline] = useState("20");

  useEffect(() => {
    saveCustomTokens(customTokens);
  }, [customTokens]);

  useEffect(() => {
    savePoolPositions(poolPositions);
  }, [poolPositions]);

  const trackPoolPosition = useCallback((tokenA: Token, tokenB: Token, pairAddress: Address) => {
    setPoolPositions((current) => isPairTracked(current, pairAddress) ? current : upsertPoolPosition(current, { tokenA, tokenB, pairAddress }));
  }, []);

  function chooseToken(token: Token) {
    if (selector === "from") setFromToken(token);
    if (selector === "to") setToToken(token);
    if (selector === "liqA") setLiqA(token);
    if (selector === "liqB") setLiqB(token);
    setSelector(null);
  }

  return (
    <MessageProvider>
      <AppLayout page={page} onPageChange={setPage}>
      {page === "swap" ? (
        <SwapPage
          from={fromToken}
          to={toToken}
          amount={swapAmount}
          slippage={slippage}
          deadline={deadline}
          onAmount={setSwapAmount}
          onFrom={() => setSelector("from")}
          onTo={() => setSelector("to")}
          onFlip={() => {
            setFromToken(toToken);
            setToToken(fromToken);
          }}
          onSettings={() => setSettingsOpen(true)}
        />
      ) : null}
      {page === "pool" ? <PoolPage positions={visiblePoolPositions} onCreate={() => setPoolModal("createPosition")} onImport={() => setPoolModal("importPosition")} onTrack={trackPoolPosition} onOpen={(tokenA, tokenB) => {
        setLiqA(tokenA);
        setLiqB(tokenB);
        setPage("pair");
      }} /> : null}
      {page === "pair" ? (
        <PairDetailPage
          tokenA={liqA}
          tokenB={liqB}
          onBack={() => setPage("pool")}
          onAdd={() => {
            setLiquidityMode("V2");
            setPage("add");
          }}
          onRemove={() => setPage("remove")}
        />
      ) : null}
      {page === "add" ? (
        <AddLiquidityPage
          tokenA={liqA}
          tokenB={liqB}
          amountA={amountA}
          amountB={amountB}
          slippage={slippage}
          deadline={deadline}
          liquidityMode={liquidityMode}
          v3FeeTier={v3FeeTier}
          initialPrice={initialPrice}
          initialPriceDirection={initialPriceDirection}
          rangeMode={rangeMode}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onAmountA={setAmountA}
          onAmountB={setAmountB}
          onTokenA={() => setSelector("liqA")}
          onTokenB={() => setSelector("liqB")}
          onBack={() => setPage("pool")}
          onPositionAdded={trackPoolPosition}
          onV3FeeTier={setV3FeeTier}
          onInitialPrice={setInitialPrice}
          onInitialPriceDirection={setInitialPriceDirection}
          onRangeMode={setRangeMode}
          onMinPrice={setMinPrice}
          onMaxPrice={setMaxPrice}
        />
      ) : null}
      {page === "remove" ? <RemoveLiquidityPage tokenA={liqA} tokenB={liqB} percent={removePercent} onPercent={setRemovePercent} onBack={() => setPage("pair")} /> : null}
      {page === "farm" ? <FarmPage /> : null}
      {page === "governance" ? <GovernancePage /> : null}

      <TokenSelector
        open={selector !== null}
        tokens={tokens}
        onClose={() => setSelector(null)}
        onChoose={chooseToken}
        onAddCustom={(token) => setCustomTokens((prev) => mergeCustomToken(prev, token))}
        onRemoveCustom={(token) => setCustomTokens((prev) => prev.filter((item) => item.address.toLowerCase() !== token.address.toLowerCase()))}
      />
      {settingsOpen ? <SwapSettings slippage={slippage} setSlippage={setSlippage} deadline={deadline} setDeadline={setDeadline} onClose={() => setSettingsOpen(false)} /> : null}
      {poolModal === "createPosition" ? (
        <CreatePositionModal
          onClose={() => setPoolModal(null)}
          onChoose={(mode) => {
            setLiquidityMode(mode);
            setPoolModal(null);
            setPage("add");
          }}
        />
      ) : null}
      {poolModal === "importPosition" ? (
        <ImportPositionModal
          tokens={tokens}
          defaultA={liqA}
          defaultB={liqB}
          trackedPositions={visiblePoolPositions}
          onClose={() => setPoolModal(null)}
          onImport={(tokenA, tokenB, pairAddress) => {
            trackPoolPosition(tokenA, tokenB, pairAddress);
            setLiqA(tokenA);
            setLiqB(tokenB);
            setPoolModal(null);
            setPage("pool");
          }}
        />
      ) : null}
      </AppLayout>
    </MessageProvider>
  );
}

function FarmPage() {
  const farms = [
    { pair: "WBNB / USDT", apr: "31.9%", wallet: "0.0000", staked: "0.0000", rewards: "0.00", tvl: "$--" },
    { pair: "WBNB / DAI", apr: "24.7%", wallet: "0.0000", staked: "0.0000", rewards: "0.00", tvl: "$--" }
  ];
  return (
    <section className="dex-layout pool-layout" data-od-id="farm-page">
      <div className="trade-card pool-shell">
        <div className="card-head"><div><h2 className="card-title">Farm</h2><p className="card-subtitle">Stake LP tokens to earn MOCHI rewards.</p></div><button className="btn btn-primary">Stake LP</button></div>
        <div className="product-grid">
          {farms.map((farm) => <article className="product-card" key={farm.pair}><div className="product-card-head"><div className="row"><div className="pair-icons"><span className="coin">{farm.pair[0]}</span><span className="coin">{farm.pair.split(" / ")[1][0]}</span></div><div><h3>{farm.pair}</h3><p className="card-subtitle">LP staking farm</p></div></div><span className="apr-badge">{farm.apr} APR</span></div><div className="info-list"><InfoLine label="TVL" value={farm.tvl} /><InfoLine label="Wallet LP" value={farm.wallet} /><InfoLine label="Staked LP" value={farm.staked} /><InfoLine label="Earned MOCHI" value={farm.rewards} /></div><div className="pool-actions"><button className="btn btn-soft" disabled>Claim</button><button className="btn btn-primary">Manage</button></div></article>)}
        </div>
      </div>
    </section>
  );
}

function GovernancePage() {
  const proposals = [
    { id: "MIP-12", title: "Increase MOCHI rewards for stablecoin LP farms", status: "Active", forPct: 68, againstPct: 21, abstainPct: 11, quorum: "72.4%", ends: "2d 14h" },
    { id: "MIP-11", title: "Add WBNB / USDT farm to boosted emissions", status: "Active", forPct: 54, againstPct: 33, abstainPct: 13, quorum: "61.8%", ends: "5d 03h" }
  ];
  return (
    <section className="dex-layout pool-layout" data-od-id="governance-page">
      <div className="trade-card pool-shell">
        <div className="card-head"><div><h2 className="card-title">Governance</h2><p className="card-subtitle">Stake MOCHI to vote on protocol proposals.</p></div><button className="btn btn-primary">Stake MOCHI</button></div>
        <div className="metric-grid"><Metric label="My staked MOCHI" value="-" /><Metric label="Voting power" value="-" /><Metric label="Active proposals" value="2" /><Metric label="Delegation" value="-" /></div>
        <div style={{ marginTop: 16 }}>{proposals.map((proposal) => <article className="proposal-card" key={proposal.id}><div className="proposal-top"><div><span className="page-kicker">{proposal.id}</span><h3 style={{ marginTop: 4 }}>{proposal.title}</h3><p className="card-subtitle">Quorum {proposal.quorum} · Ends {proposal.ends}</p></div><span className="status-chip">{proposal.status}</span></div><div className="vote-bars"><VoteBar label="For" value={proposal.forPct} /><VoteBar label="Against" value={proposal.againstPct} tone="against" /><VoteBar label="Abstain" value={proposal.abstainPct} tone="abstain" /></div><div className="pool-actions"><button className="btn btn-primary">Vote</button></div></article>)}</div>
      </div>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="info-line"><span>{label}</span><strong>{value}</strong></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function VoteBar({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return <div className="vote-bar"><span>{label}</span><span className="vote-track"><span className={`vote-fill ${tone}`} style={{ width: `${value}%` }} /></span><strong className="state-value">{value}%</strong></div>;
}
