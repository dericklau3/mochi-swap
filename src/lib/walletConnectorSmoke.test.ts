import { describe, expect, it } from "vitest";
import { targetChain } from "./chains";
import { wagmiConfig } from "./wagmi";

// Exercise the real RainbowKit + wagmi dependency graph: other component tests
// mock wagmi and would miss package-major incompatibilities at module startup.
describe("wallet connector dependency compatibility", () => {
  it("initializes the configured WalletConnect connector", () => {
    expect(wagmiConfig.chains.some((chain) => chain.id === targetChain.id)).toBe(true);
    expect(wagmiConfig.connectors.some((connector) => connector.id === "walletConnect")).toBe(true);
  });
});
