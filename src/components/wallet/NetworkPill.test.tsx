import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NetworkPill } from "./NetworkPill";
import { NetworkGuard } from "./NetworkGuard";

const { wallet, switchChainAsync } = vi.hoisted(() => ({
  wallet: { isConnected: true, isReconnecting: false, chainId: 97 as number | undefined },
  switchChainAsync: vi.fn()
}));
vi.mock("wagmi", () => ({
  useAccount: () => wallet,
  useChainId: () => 46630,
  useSwitchChain: () => ({ switchChainAsync, switchChain: vi.fn(), isPending: false })
}));
vi.mock("../../lib/chains", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../lib/chains")>(),
  getNetworkUrl: () => "#network-switched"
}));

beforeEach(() => {
  wallet.isConnected = true;
  wallet.isReconnecting = false;
  wallet.chainId = 97;
  switchChainAsync.mockReset();
  window.history.replaceState(null, "", "/");
});
afterEach(cleanup);

describe("application network switching", () => {
  it("waits for wallet switching before navigating to the selected network", async () => {
    let finishSwitch!: () => void;
    switchChainAsync.mockImplementation(() => new Promise<void>((resolve) => { finishSwitch = resolve; }));
    render(<NetworkPill />);
    fireEvent.change(screen.getByRole("combobox", { name: "Application network" }), { target: { value: "robinhoodTestnet" } });
    expect(switchChainAsync).toHaveBeenCalledWith({ chainId: 46630 });
    expect(window.location.hash).toBe("");
    expect(screen.getByRole("combobox")).toBeDisabled();
    await act(async () => finishSwitch());
    await waitFor(() => expect(window.location.hash).toBe("#network-switched"));
  });

  it("keeps the application network and shows an error when the wallet rejects switching", async () => {
    switchChainAsync.mockRejectedValue(new Error("User rejected request"));
    render(<NetworkPill />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "robinhoodTestnet" } });
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
    expect(window.location.hash).toBe("");
    expect(screen.getByRole("combobox")).toHaveValue("bscTestnet");
    expect(screen.getByRole("combobox")).toBeEnabled();
  });

  it("switches the application without a wallet request when disconnected", async () => {
    wallet.isConnected = false;
    wallet.chainId = undefined;
    render(<><NetworkPill /><NetworkGuard /></>);
    expect(screen.queryByText("Switch wallet")).not.toBeInTheDocument();
    expect(screen.queryByText(/Wrong network/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "robinhoodTestnet" } });
    await waitFor(() => expect(window.location.hash).toBe("#network-switched"));
    expect(switchChainAsync).not.toHaveBeenCalled();
  });

  it("waits for wallet reconnection before enabling the selector or showing a mismatch", () => {
    wallet.isReconnecting = true;
    wallet.chainId = 46630;
    render(<><NetworkPill /><NetworkGuard /></>);
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.queryByText(/Wrong network/)).not.toBeInTheDocument();
  });

  it("offers one recovery control when a connected wallet is on another chain", () => {
    wallet.chainId = 46630;
    render(<><NetworkPill /><NetworkGuard /></>);
    expect(screen.queryByText("Switch wallet")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch Network" })).toBeVisible();
  });
});
