import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Token, V4PositionInfo } from "../types/token";
import { PairDetailPage } from "./PairDetailPage";
import { RemoveLiquidityPage } from "./RemoveLiquidityPage";

const collectFees = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => ({ isConnected: true }),
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
  useV3Position: () => ({ data: undefined, isLoading: false })
}));

vi.mock("../hooks/useV3PoolInfo", () => ({
  useV3PoolInfo: () => ({ data: undefined, isLoading: false })
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
  liquidity: 1000n
};

afterEach(() => {
  cleanup();
  collectFees.mockClear();
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
});
