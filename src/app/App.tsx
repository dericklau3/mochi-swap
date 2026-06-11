import { useCallback, useEffect, useMemo, useState } from "react";
import type { Token, TrackedPoolPosition } from "../types/token";
import { defaultPoolTokens, defaultTokens } from "../lib/tokens";
import { loadCustomTokens, mergeCustomToken, saveCustomTokens } from "../lib/customTokens";
import { isPairTracked, loadPoolPositions, mergePoolPositionCandidates, savePoolPositions, upsertPoolPosition } from "../lib/poolPositions";
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
import { getV3FeeOption, v3FeeOptions } from "../lib/v3Routing";
import { getAddLiquidityRoute, getPageFromUrl, getPageHash, getPairDetailHash, getPairDetailRoute, getRemoveLiquidityHash, getRemoveLiquidityRoute, type AddLiquidityRoute, type PairDetailRoute } from "../lib/appRouting";

type TokenTarget = "from" | "to" | "liqA" | "liqB";
type PoolModal = "createPosition" | "importPosition";
type AddLiquidityOrigin = "pool" | "pair";

export default function App() {
  const initialAddLiquidityRoute = getAddLiquidityRoute(window.location);
  const initialPairDetailRoute = getPairDetailRoute(window.location);
  const initialRemoveLiquidityRoute = getRemoveLiquidityRoute(window.location);
  const [page, setPage] = useState<PageKey>(() => getPageFromUrl(window.location));
  const [customTokens, setCustomTokens] = useState<Token[]>(() => loadCustomTokens());
  const [poolPositions, setPoolPositions] = useState(() => loadPoolPositions());
  const tokens = useMemo(() => [...defaultTokens, ...customTokens], [customTokens]);
  const visiblePoolPositions = useMemo(() => {
    const defaultPosition = { pairAddress: "0x0000000000000000000000000000000000000000" as Address, tokenA: defaultPoolTokens[0], tokenB: defaultPoolTokens[1] };
    const defaultV3Positions = v3FeeOptions.map((option) => ({ ...defaultPosition, protocol: "V3" as const, fee: option.fee }));
    return mergePoolPositionCandidates([defaultPosition, ...defaultV3Positions], poolPositions);
  }, [poolPositions]);
  const [fromToken, setFromToken] = useState(defaultPoolTokens[0]);
  const [toToken, setToToken] = useState(defaultPoolTokens[1]);
  const initialOpenedPosition = resolveAddLiquidityPosition(initialAddLiquidityRoute, tokens)
    ?? resolvePairDetailPosition(initialRemoveLiquidityRoute, tokens)
    ?? resolvePairDetailPosition(initialPairDetailRoute, tokens);
  const [liqA, setLiqA] = useState(() => initialOpenedPosition.tokenA);
  const [liqB, setLiqB] = useState(() => initialOpenedPosition.tokenB);
  const [swapAmount, setSwapAmount] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [liquidityMode, setLiquidityMode] = useState<LiquidityMode>(initialAddLiquidityRoute.mode);
  const [openedPosition, setOpenedPosition] = useState<TrackedPoolPosition>(() => initialOpenedPosition);
  const [v3FeeTier, setV3FeeTier] = useState(() => v3FeeOptions.find((option) => option.fee === initialAddLiquidityRoute.fee)?.label ?? "0.3%");
  const [initialPrice, setInitialPrice] = useState("");
  const [initialPriceDirection, setInitialPriceDirection] = useState<V3PriceDirection>("quote");
  const [rangeMode, setRangeMode] = useState<V3RangeMode>("full");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [removePercent, setRemovePercent] = useState(50);
  const [selector, setSelector] = useState<TokenTarget | null>(null);
  const [poolModal, setPoolModal] = useState<PoolModal | null>(null);
  const [addLiquidityOrigin, setAddLiquidityOrigin] = useState<AddLiquidityOrigin>("pool");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [deadline, setDeadline] = useState("20");

  useEffect(() => {
    saveCustomTokens(customTokens);
  }, [customTokens]);

  useEffect(() => {
    savePoolPositions(poolPositions);
  }, [poolPositions]);

  useEffect(() => {
    const syncPageFromUrl = () => {
      const nextPage = getPageFromUrl(window.location);
      setPage(nextPage);
      if (nextPage === "pair") {
        const nextPosition = resolvePairDetailPosition(getPairDetailRoute(window.location), tokens);
        setOpenedPosition(nextPosition);
        setLiqA(nextPosition.tokenA);
        setLiqB(nextPosition.tokenB);
        setLiquidityMode(nextPosition.protocol ?? "V2");
        if (nextPosition.fee) {
          setV3FeeTier(v3FeeOptions.find((option) => option.fee === nextPosition.fee)?.label ?? "0.3%");
        }
      }
      if (nextPage === "remove") {
        const nextPosition = resolvePairDetailPosition(getRemoveLiquidityRoute(window.location), tokens);
        setOpenedPosition(nextPosition);
        setLiqA(nextPosition.tokenA);
        setLiqB(nextPosition.tokenB);
        setLiquidityMode(nextPosition.protocol ?? "V2");
        if (nextPosition.fee) {
          setV3FeeTier(v3FeeOptions.find((option) => option.fee === nextPosition.fee)?.label ?? "0.3%");
        }
      }
      if (nextPage === "add") {
        const addLiquidityRoute = getAddLiquidityRoute(window.location);
        setLiquidityMode(addLiquidityRoute.mode);
        const addPosition = resolveAddLiquidityPosition(addLiquidityRoute, tokens);
        if (addPosition) {
          setOpenedPosition(addPosition);
          setLiqA(addPosition.tokenA);
          setLiqB(addPosition.tokenB);
          setAddLiquidityOrigin("pair");
        }
        if (addLiquidityRoute.fee) {
          setV3FeeTier(v3FeeOptions.find((option) => option.fee === addLiquidityRoute.fee)?.label ?? "0.3%");
        }
      }
    };
    window.addEventListener("hashchange", syncPageFromUrl);
    window.addEventListener("popstate", syncPageFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncPageFromUrl);
      window.removeEventListener("popstate", syncPageFromUrl);
    };
  }, [tokens]);

  const navigateToPage = useCallback((nextPage: PageKey, addLiquidity?: AddLiquidityRoute) => {
    const nextHash = getPageHash(nextPage, addLiquidity);
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    setPage(nextPage);
  }, []);

  const updateV3FeeTier = useCallback((feeTier: string) => {
    const option = getV3FeeOption(feeTier);
    setV3FeeTier(option.label);
    window.history.replaceState(null, "", getPageHash("add", { mode: "V3", fee: option.fee }));
  }, []);

  const openPairDetail = useCallback((position: TrackedPoolPosition) => {
    setOpenedPosition(position);
    setLiqA(position.tokenA);
    setLiqB(position.tokenB);
    setLiquidityMode(position.protocol ?? "V2");
    if (position.fee) setV3FeeTier(v3FeeOptions.find((option) => option.fee === position.fee)?.label ?? "0.3%");
    const nextHash = getPairDetailHash({
      tokenA: position.tokenA.address,
      tokenB: position.tokenB.address,
      protocol: position.protocol ?? "V2",
      fee: position.fee,
      tokenId: position.tokenId
    });
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    setPage("pair");
  }, []);

  const openRemoveLiquidity = useCallback((position: TrackedPoolPosition) => {
    setOpenedPosition(position);
    setLiqA(position.tokenA);
    setLiqB(position.tokenB);
    const nextHash = getRemoveLiquidityHash({
      tokenA: position.tokenA.address,
      tokenB: position.tokenB.address,
      protocol: position.protocol ?? "V2",
      fee: position.fee,
      tokenId: position.tokenId
    });
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    setPage("remove");
  }, []);

  const trackPoolPosition = useCallback((tokenA: Token, tokenB: Token, pairAddress: Address, protocol: "V2" | "V3" = "V2", fee?: number) => {
    setPoolPositions((current) => isPairTracked(current, pairAddress) ? current : upsertPoolPosition(current, { tokenA, tokenB, pairAddress, protocol, fee }));
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
      <AppLayout page={page} onPageChange={navigateToPage}>
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
      {page === "pool" ? <PoolPage positions={visiblePoolPositions} onCreate={() => setPoolModal("createPosition")} onImport={() => setPoolModal("importPosition")} onTrack={trackPoolPosition} onOpen={openPairDetail} /> : null}
      {page === "pair" ? (
        <PairDetailPage
          tokenA={liqA}
          tokenB={liqB}
          protocol={openedPosition.protocol ?? "V2"}
          fee={openedPosition.fee}
          tokenId={openedPosition.tokenId}
          onBack={() => navigateToPage("pool")}
          onAdd={() => {
            setLiquidityMode(openedPosition.protocol ?? "V2");
            setAddLiquidityOrigin("pair");
            setAmountA("");
            setAmountB("");
            navigateToPage("add", {
              mode: openedPosition.protocol ?? "V2",
              fee: openedPosition.fee,
              tokenA: openedPosition.protocol === "V3" ? openedPosition.tokenA.address : undefined,
              tokenB: openedPosition.protocol === "V3" ? openedPosition.tokenB.address : undefined,
              tokenId: openedPosition.protocol === "V3" ? openedPosition.tokenId : undefined
            });
          }}
          onRemove={() => openRemoveLiquidity(openedPosition)}
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
          positionTokenId={liquidityMode === "V3" ? openedPosition.tokenId : undefined}
          initialPrice={initialPrice}
          initialPriceDirection={initialPriceDirection}
          rangeMode={rangeMode}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onAmountA={setAmountA}
          onAmountB={setAmountB}
          onTokenA={() => setSelector("liqA")}
          onTokenB={() => setSelector("liqB")}
          onBack={() => addLiquidityOrigin === "pair" ? openPairDetail(openedPosition) : navigateToPage("pool")}
          onPositionAdded={trackPoolPosition}
          onV3FeeTier={updateV3FeeTier}
          onInitialPrice={setInitialPrice}
          onInitialPriceDirection={setInitialPriceDirection}
          onRangeMode={setRangeMode}
          onMinPrice={setMinPrice}
          onMaxPrice={setMaxPrice}
        />
      ) : null}
      {page === "remove" ? <RemoveLiquidityPage tokenA={liqA} tokenB={liqB} protocol={openedPosition.protocol ?? "V2"} fee={openedPosition.fee} tokenId={openedPosition.tokenId} percent={removePercent} onPercent={setRemovePercent} onBack={() => openPairDetail(openedPosition)} /> : null}
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
            setAddLiquidityOrigin("pool");
            setPoolModal(null);
            navigateToPage("add", {
              mode,
              fee: mode === "V3" ? v3FeeOptions.find((option) => option.label === v3FeeTier)?.fee : undefined
            });
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
          onAddCustom={(token) => setCustomTokens((prev) => mergeCustomToken(prev, token))}
          onRemoveCustom={(token) => setCustomTokens((prev) => prev.filter((item) => item.address.toLowerCase() !== token.address.toLowerCase()))}
          onImport={(tokenA, tokenB, pairAddress) => {
            trackPoolPosition(tokenA, tokenB, pairAddress);
            setLiqA(tokenA);
            setLiqB(tokenB);
            setPoolModal(null);
            navigateToPage("pool");
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

function resolvePairDetailPosition(route: PairDetailRoute | undefined, tokens: Token[]): TrackedPoolPosition {
  const fallback: TrackedPoolPosition = {
    pairAddress: "0x0000000000000000000000000000000000000000" as Address,
    tokenA: defaultPoolTokens[0],
    tokenB: defaultPoolTokens[1],
    protocol: "V2"
  };
  if (!route) return fallback;

  const tokenA = tokens.find((token) => token.address.toLowerCase() === route.tokenA.toLowerCase());
  const tokenB = tokens.find((token) => token.address.toLowerCase() === route.tokenB.toLowerCase());
  if (!tokenA || !tokenB) return fallback;
  return {
    pairAddress: "0x0000000000000000000000000000000000000000" as Address,
    tokenA,
    tokenB,
    protocol: route.protocol,
    fee: route.fee,
    tokenId: route.tokenId
  };
}

function resolveAddLiquidityPosition(route: AddLiquidityRoute, tokens: Token[]): TrackedPoolPosition | undefined {
  if (route.mode !== "V3" || !route.tokenA || !route.tokenB || route.tokenId === undefined) return undefined;
  const tokenA = tokens.find((token) => token.address.toLowerCase() === route.tokenA?.toLowerCase());
  const tokenB = tokens.find((token) => token.address.toLowerCase() === route.tokenB?.toLowerCase());
  if (!tokenA || !tokenB) return undefined;
  return {
    pairAddress: "0x0000000000000000000000000000000000000000" as Address,
    tokenA,
    tokenB,
    protocol: "V3",
    fee: route.fee,
    tokenId: route.tokenId
  };
}
