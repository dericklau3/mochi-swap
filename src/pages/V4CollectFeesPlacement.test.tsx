import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Token, V3PositionInfo, V4PositionInfo } from "../types/token";
import { PairDetailPage } from "./PairDetailPage";
import { RemoveLiquidityPage } from "./RemoveLiquidityPage";

const collectFees = vi.fn();
const collectV3Fees = vi.fn();
const { walletState } = vi.hoisted(() => ({
  walletState: {
    address: "0x00000000000000000000000000000000000000aa"
  }
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ isConnected: true, address: walletState.address }),
  useChainId: () => 97
}));

vi.mock("../components/wallet/NetworkGuard", () => ({
  NetworkGuard: () => null
}));

vi.mock("../hooks/useTransactionMessage", () => ({
  useTransactionMessage: () => undefined
}));

vi.mock("../hooks/useMulticallPairInfo", () => ({
  useMulticallPairInfo: () => ({
    data: undefined,
    isLoading: false
  })
}));

vi.mock("../hooks/useV3Positions", () => ({
  useV3Positions: () => ({ data: [], isLoading: false })
}));

vi.mock("../hooks/useV3Position", () => ({
  useV3Position: (tokenId?: bigint) => ({ data: tokenId ? v3Position : undefined, isLoading: false })
}));

vi.mock("../hooks/useV3PoolInfo", () => ({
  useV3PoolInfo: () => ({
    data: {
      address: "0x0000000000000000000000000000000000000033",
      sqrtPriceX96: 79228162514264337593543950336n
    },
    isLoading: false
  })
}));

vi.mock("../hooks/useV4Position", () => ({
  useV4Position: () => ({ data: v4Position, isLoading: false })
}));

vi.mock("../hooks/useV4PoolInfo", () => ({
  useV4PoolInfo: () => ({
    data: { sqrtPriceX96: 79228162514264337593543950336n },
    isLoading: false
  })
}));

vi.mock("../hooks/useApproveToken", () => ({
  useApproveToken: () => ({
    approve: vi.fn(),
    isPending: false,
    isSuccess: false
  })
}));

vi.mock("../hooks/useRemoveLiquidity", () => ({
  useRemoveLiquidity: () => ({
    removeLiquidity: vi.fn(),
    isPending: false,
    isSuccess: false
  })
}));

vi.mock("../hooks/useRemoveV3Liquidity", () => ({
  useRemoveV3Liquidity: () => ({
    removeLiquidity: vi.fn(),
    collectFees: collectV3Fees,
    isPending: false,
    isSuccess: false
  })
}));

vi.mock("../hooks/useRemoveV4Liquidity", () => ({
  useRemoveV4Liquidity: () => ({
    removeLiquidity: vi.fn(),
    collectFees,
    isPending: false,
    isSuccess: false
  })
}));

vi.mock("../hooks/useV3UnclaimedFees", () => ({
  useV3UnclaimedFees: () => ({
    data: { amount0: 12n * 10n ** 18n, amount1: 8n * 10n ** 18n },
    isLoading: false
  })
}));

vi.mock("../hooks/useV4UnclaimedFees", () => ({
  useV4UnclaimedFees: () => ({
    data: { amount0: 5n * 10n ** 18n, amount1: 3n * 10n ** 18n },
    isLoading: false
  })
}));

const tokenA: Token = {
  address: "0x0000000000000000000000000000000000000001",
  symbol: "AAA",
  name: "Token AAA",
  decimals: 18
};

const tokenB: Token = {
  address: "0x0000000000000000000000000000000000000002",
  symbol: "BBB",
  name: "Token BBB",
  decimals: 18
};

const v4Position: V4PositionInfo = {
  tokenId: 11n,
  poolKey: {
    currency0: tokenA.address,
    currency1: tokenB.address,
    fee: 3000,
    tickSpacing: 60,
    hooks: "0x0000000000000000000000000000000000000000"
  },
  tickLower: -120,
  tickUpper: 120,
  liquidity: 1000n,
  owner: "0x00000000000000000000000000000000000000aa"
};

const v3Position: V3PositionInfo = {
  tokenId: 7n,
  token0: tokenA.address,
  token1: tokenB.address,
  fee: 3000,
  tickLower: -120,
  tickUpper: 120,
  liquidity: 1000n,
  feeGrowthInside0LastX128: 0n,
  feeGrowthInside1LastX128: 0n,
  tokensOwed0: 0n,
  tokensOwed1: 0n
};

afterEach(() => {
  cleanup();
  collectFees.mockClear();
  collectV3Fees.mockClear();
  walletState.address = "0x00000000000000000000000000000000000000aa";
});

describe("V4 collect fees placement", () => {
  it("shows collect fees on the pool detail page", () => {
    render(
      <PairDetailPage
        tokenA={tokenA}
        tokenB={tokenB}
        protocol="V4"
        fee={3000}
        tokenId={v4Position.tokenId}
        v4PoolKey={v4Position.poolKey}
        onBack={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Collect fees" }));

    expect(collectFees).toHaveBeenCalledWith(v4Position);
    expect(screen.getByText("Pool ID")).toBeInTheDocument();
    expect(screen.getByText("Unclaimed fees")).toBeInTheDocument();
    expect(screen.getByText("5 AAA + 3 BBB")).toBeInTheDocument();
    expect(screen.getByText("1 AAA = 1 BBB")).toBeInTheDocument();
  });

  it("prevents a non-owner wallet from collecting V4 fees", () => {
    walletState.address = "0x00000000000000000000000000000000000000bb";
    render(
      <PairDetailPage
        tokenA={tokenA}
        tokenB={tokenB}
        protocol="V4"
        fee={3000}
        tokenId={v4Position.tokenId}
        v4PoolKey={v4Position.poolKey}
        onBack={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Collect fees" })).toBeDisabled();
    expect(screen.getByText("Only NFT owner 0x0000...00aa can collect these fees.")).toBeInTheDocument();
    expect(collectFees).not.toHaveBeenCalled();
  });

  it("does not show collect fees on the remove liquidity page", () => {
    render(
      <RemoveLiquidityPage
        tokenA={tokenA}
        tokenB={tokenB}
        protocol="V4"
        fee={3000}
        tokenId={v4Position.tokenId}
        v4PoolKey={v4Position.poolKey}
        percent={50}
        onPercent={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Collect fees" })).not.toBeInTheDocument();
  });

  it("shows V3 pool details and collects V3 fees", () => {
    render(
      <PairDetailPage
        tokenA={tokenA}
        tokenB={tokenB}
        protocol="V3"
        fee={3000}
        tokenId={v3Position.tokenId}
        onBack={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Collect fees" }));

    expect(collectV3Fees).toHaveBeenCalledWith(v3Position);
    expect(screen.getByText("Pool address")).toBeInTheDocument();
    expect(screen.getByText("0x0000...0033")).toBeInTheDocument();
    expect(screen.getByText("Unclaimed fees")).toBeInTheDocument();
    expect(screen.getByText("12 AAA + 8 BBB")).toBeInTheDocument();
    expect(screen.getByText("1 AAA = 1 BBB")).toBeInTheDocument();
  });
});
