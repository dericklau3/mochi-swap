import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Token } from "../../types/token";
import { SwapForm } from "./SwapForm";

const approveV2 = vi.fn();
const swapCall = vi.fn();
const quote = vi.fn();

const { walletState } = vi.hoisted(() => ({
  walletState: {
    chainId: 97
  }
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ isConnected: true }),
  useChainId: () => walletState.chainId,
  useSignTypedData: () => ({
    isPending: false,
    signTypedDataAsync: vi.fn()
  })
}));

vi.mock("../../hooks/useDebouncedValue", () => ({
  useDebouncedValue: (value: string) => value
}));

vi.mock("../../hooks/useMulticallTokenBalances", () => ({
  useMulticallTokenBalances: () => ({
    data: {
      "0x0000000000000000000000000000000000000001": 100n * 10n ** 18n,
      "0x0000000000000000000000000000000000000002": 0n
    },
    isLoading: false
  })
}));

vi.mock("../../hooks/useMulticallTokenAllowances", () => ({
  useMulticallTokenAllowances: () => ({
    data: {
      "0x0000000000000000000000000000000000000001": 0n
    },
    isLoading: false
  })
}));

vi.mock("../../hooks/useMulticallPairInfo", () => ({
  useMulticallPairInfo: () => ({
    data: undefined,
    isLoading: false
  })
}));

vi.mock("../../hooks/useApproveToken", () => ({
  useApproveToken: (_token?: string, spender?: string) => ({
    approve: spender === "0x68a5614cD96FE32485D4D5549d0bEd87a6765cF3" ? approveV2 : vi.fn(),
    isPending: false,
    isSuccess: false
  })
}));

vi.mock("../../hooks/useSwap", () => ({
  useSwap: () => ({
    quote,
    swap: swapCall,
    isPending: false,
    isSuccess: false
  })
}));

vi.mock("../../hooks/useTransactionMessage", () => ({
  useTransactionMessage: () => undefined
}));

vi.mock("../../hooks/usePermit2Allowance", () => ({
  usePermit2Allowance: () => ({
    data: { amount: 0n, expiration: 0, nonce: 0 },
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

function renderSwapForm() {
  render(
    <SwapForm
      from={tokenA}
      to={tokenB}
      amount="1"
      slippage="0.5"
      deadline="20"
      v4Candidates={[]}
      onAmount={vi.fn()}
      onFrom={vi.fn()}
      onTo={vi.fn()}
      onFlip={vi.fn()}
      onSettings={vi.fn()}
    />
  );
}

afterEach(() => {
  cleanup();
  approveV2.mockClear();
  swapCall.mockClear();
  quote.mockReset();
  walletState.chainId = 97;
});

describe("SwapForm network guard", () => {
  it("does not allow approvals or swaps on the wrong chain", async () => {
    walletState.chainId = 1;
    quote.mockResolvedValue({ protocol: "V2", amountOut: 2n * 10n ** 18n });

    renderSwapForm();

    const button = await screen.findByRole("button", { name: "Switch to BSC Testnet" });
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(approveV2).not.toHaveBeenCalled();
    expect(swapCall).not.toHaveBeenCalled();
  });

  it("keeps the approval path available on BSC Testnet", async () => {
    quote.mockResolvedValue({ protocol: "V2", amountOut: 2n * 10n ** 18n });

    renderSwapForm();

    const button = await screen.findByRole("button", { name: "Approve AAA" });
    await waitFor(() => expect(button).not.toBeDisabled());

    fireEvent.click(button);

    expect(approveV2).toHaveBeenCalledWith(1n * 10n ** 18n);
    expect(swapCall).not.toHaveBeenCalled();
  });
});
