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
import { zeroAddress, type Address } from "viem";
import type { V3PriceDirection, V3RangeMode } from "../pages/AddLiquidityPage";
import { getV3FeeOption, v3FeeOptions } from "../lib/v3Routing";
import { buildV4PoolKey, getV4FullRangeTicks, getV4PoolId, toV4Currency, v4FeeOptions } from "../lib/v4";
import { getAddLiquidityRoute, getInitialLiquidityRoute, getPageFromUrl, getPageHash, getPairDetailHash, getPairDetailRoute, getRemoveLiquidityHash, getRemoveLiquidityRoute, type AddLiquidityRoute, type PairDetailRoute } from "../lib/appRouting";

type TokenTarget = "from" | "to" | "liqA" | "liqB";
type PoolModal = "createPosition" | "importPosition";
type AddLiquidityOrigin = "pool" | "pair";

export default function App() {
  const initialLiquidityRoute = getInitialLiquidityRoute(window.location);
  const initialAddLiquidityRoute = getAddLiquidityRoute(window.location);
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
  const initialOpenedPosition = initialLiquidityRoute?.page === "add"
    ? resolveAddLiquidityPosition(initialLiquidityRoute.route, tokens, poolPositions) ?? getDefaultPoolPosition()
    : initialLiquidityRoute?.page === "pair" || initialLiquidityRoute?.page === "remove"
      ? resolvePairDetailPosition(initialLiquidityRoute.route, tokens, poolPositions)
      : getDefaultPoolPosition();
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
  const v4SwapCandidates = useMemo(() => {
    const input = toV4Currency(fromToken).toLowerCase();
    const output = toV4Currency(toToken).toLowerCase();
    if (input === output) return [];
    const tracked = poolPositions
      .filter((position) => position.protocol === "V4" && position.v4PoolKey?.hooks.toLowerCase() === zeroAddress)
      .map((position) => position.v4PoolKey!);
    const defaults = v4FeeOptions.map((option) => buildV4PoolKey(fromToken, toToken, option.fee));
    return [...tracked, ...defaults].filter((poolKey, index, candidates) => {
      const matches = (
        poolKey.currency0.toLowerCase() === input && poolKey.currency1.toLowerCase() === output
      ) || (
        poolKey.currency0.toLowerCase() === output && poolKey.currency1.toLowerCase() === input
      );
      return matches && candidates.findIndex((candidate) => getV4PoolId(candidate) === getV4PoolId(poolKey)) === index;
    });
  }, [fromToken, poolPositions, toToken]);

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
        const nextPosition = resolvePairDetailPosition(getPairDetailRoute(window.location), tokens, poolPositions);
        setOpenedPosition(nextPosition);
        setLiqA(nextPosition.tokenA);
        setLiqB(nextPosition.tokenB);
        setLiquidityMode(nextPosition.protocol ?? "V2");
        if (nextPosition.fee) {
          setV3FeeTier(v3FeeOptions.find((option) => option.fee === nextPosition.fee)?.label ?? "0.3%");
        }
        if (nextPosition.protocol === "V4") {
          const fullRange = getV4FullRangeTicks(nextPosition.fee ?? 3000);
          setRangeMode(nextPosition.tickLower === fullRange.tickLower && nextPosition.tickUpper === fullRange.tickUpper ? "full" : "custom");
        }
      }
      if (nextPage === "remove") {
        const nextPosition = resolvePairDetailPosition(getRemoveLiquidityRoute(window.location), tokens, poolPositions);
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
        const addPosition = resolveAddLiquidityPosition(addLiquidityRoute, tokens, poolPositions);
        if (addPosition) {
          setOpenedPosition(addPosition);
          setLiqA(addPosition.tokenA);
          setLiqB(addPosition.tokenB);
          setAddLiquidityOrigin("pair");
          if (addPosition.protocol === "V4") {
            const fullRange = getV4FullRangeTicks(addPosition.fee ?? 3000);
            setRangeMode(addPosition.tickLower === fullRange.tickLower && addPosition.tickUpper === fullRange.tickUpper ? "full" : "custom");
          }
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
  }, [poolPositions, tokens]);

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
    window.history.replaceState(null, "", getPageHash("add", { mode: liquidityMode === "V4" ? "V4" : "V3", fee: option.fee }));
  }, [liquidityMode]);

  const openPairDetail = useCallback((position: TrackedPoolPosition) => {
    setOpenedPosition(position);
    setLiqA(position.tokenA);
    setLiqB(position.tokenB);
    setLiquidityMode(position.protocol ?? "V2");
    if (position.fee) setV3FeeTier(v3FeeOptions.find((option) => option.fee === position.fee)?.label ?? "0.3%");
    if (position.protocol === "V4") {
      const fullRange = getV4FullRangeTicks(position.fee ?? 3000);
      setRangeMode(position.tickLower === fullRange.tickLower && position.tickUpper === fullRange.tickUpper ? "full" : "custom");
    }
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

  const trackPoolPosition = useCallback((tokenA: Token, tokenB: Token, pairAddress: Address, protocol: "V2" | "V3" | "V4" = "V2", fee?: number) => {
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
          v4Candidates={v4SwapCandidates}
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
          v4PoolKey={openedPosition.v4PoolKey}
          onBack={() => navigateToPage("pool")}
          onAdd={() => {
            setLiquidityMode(openedPosition.protocol ?? "V2");
            setAddLiquidityOrigin("pair");
            setAmountA("");
            setAmountB("");
            navigateToPage("add", {
              mode: openedPosition.protocol ?? "V2",
              fee: openedPosition.fee,
              tokenA: openedPosition.protocol !== "V2" ? openedPosition.tokenA.address : undefined,
              tokenB: openedPosition.protocol !== "V2" ? openedPosition.tokenB.address : undefined,
              tokenId: openedPosition.protocol !== "V2" ? openedPosition.tokenId : undefined
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
          positionTokenId={liquidityMode !== "V2" ? openedPosition.tokenId : undefined}
          v4PoolKey={liquidityMode === "V4" ? openedPosition.v4PoolKey : undefined}
          v4TickLower={liquidityMode === "V4" ? openedPosition.tickLower : undefined}
          v4TickUpper={liquidityMode === "V4" ? openedPosition.tickUpper : undefined}
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
          onV4PositionAdded={(position) => setPoolPositions((current) => upsertPoolPosition(current, position))}
          onV3FeeTier={updateV3FeeTier}
          onInitialPrice={setInitialPrice}
          onInitialPriceDirection={setInitialPriceDirection}
          onRangeMode={setRangeMode}
          onMinPrice={setMinPrice}
          onMaxPrice={setMaxPrice}
        />
      ) : null}
      {page === "remove" ? <RemoveLiquidityPage tokenA={liqA} tokenB={liqB} protocol={openedPosition.protocol ?? "V2"} fee={openedPosition.fee} tokenId={openedPosition.tokenId} v4PoolKey={openedPosition.v4PoolKey} percent={removePercent} slippage={slippage} deadline={deadline} onPercent={setRemovePercent} onBack={() => openPairDetail(openedPosition)} /> : null}
      {page === "not-found" ? <NotFoundPage onBack={() => navigateToPage("swap")} /> : null}

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
              fee: mode !== "V2" ? v3FeeOptions.find((option) => option.label === v3FeeTier)?.fee : undefined
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
          onImportV4={(position) => {
            setPoolPositions((current) => upsertPoolPosition(current, position));
            setLiqA(position.tokenA);
            setLiqB(position.tokenB);
            setPoolModal(null);
            navigateToPage("pool");
          }}
        />
      ) : null}
      </AppLayout>
    </MessageProvider>
  );
}

function NotFoundPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="dex-layout" data-od-id="not-found-page">
      <div className="trade-card not-found-card">
        <span className="page-kicker">404</span>
        <h2 className="card-title">Page Not Found</h2>
        <p className="card-subtitle">The page you requested does not exist.</p>
        <button className="btn btn-primary" type="button" onClick={onBack}>Back to Swap</button>
      </div>
    </section>
  );
}

function resolvePairDetailPosition(route: PairDetailRoute | undefined, tokens: Token[], tracked: TrackedPoolPosition[] = []): TrackedPoolPosition {
  const fallback = getDefaultPoolPosition();
  if (!route) return fallback;
  const trackedPosition = tracked.find((position) => (
    (position.protocol ?? "V2") === route.protocol &&
    position.tokenId === route.tokenId &&
    position.tokenA.address.toLowerCase() === route.tokenA.toLowerCase() &&
    position.tokenB.address.toLowerCase() === route.tokenB.toLowerCase()
  ));
  if (trackedPosition) return trackedPosition;

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

function getDefaultPoolPosition(): TrackedPoolPosition {
  return {
    pairAddress: "0x0000000000000000000000000000000000000000" as Address,
    tokenA: defaultPoolTokens[0],
    tokenB: defaultPoolTokens[1],
    protocol: "V2"
  };
}

function resolveAddLiquidityPosition(route: AddLiquidityRoute, tokens: Token[], tracked: TrackedPoolPosition[] = []): TrackedPoolPosition | undefined {
  if (route.mode === "V2" || !route.tokenA || !route.tokenB || route.tokenId === undefined) return undefined;
  const trackedPosition = tracked.find((position) => position.protocol === route.mode && position.tokenId === route.tokenId);
  if (trackedPosition) return trackedPosition;
  const tokenA = tokens.find((token) => token.address.toLowerCase() === route.tokenA?.toLowerCase());
  const tokenB = tokens.find((token) => token.address.toLowerCase() === route.tokenB?.toLowerCase());
  if (!tokenA || !tokenB) return undefined;
  return {
    pairAddress: "0x0000000000000000000000000000000000000000" as Address,
    tokenA,
    tokenB,
    protocol: route.mode,
    fee: route.fee,
    tokenId: route.tokenId
  };
}
