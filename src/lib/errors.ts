import { targetChain } from "./chains";
export class SimulationFailedError extends Error {
  constructor(readonly originalError: unknown) {
    super("Transaction simulation failed.");
    this.name = "SimulationFailedError";
  }
}

export function getReadableError(error: unknown): string {
  if (error instanceof SimulationFailedError) {
    return "Simulation failed: " + getReadableError(error.originalError);
  }

  const message = typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const shortMessage = error && typeof error === "object" && "shortMessage" in error
    && typeof error.shortMessage === "string" ? error.shortMessage : "";
  const details = error && typeof error === "object" && "details" in error
    && typeof error.details === "string" ? error.details : "";
  const combined = [shortMessage, details, message].filter(Boolean).join("\n");
  const lower = combined.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected the request")) {
    return "User rejected transaction.";
  }
  if (lower.includes("insufficient funds")) return "Insufficient funds for this transaction.";
  if (lower.includes("insufficient allowance")) return "Insufficient allowance. Please approve first.";
  if (lower.includes("price slippage check")) return "Deposit amounts do not match the V3 price and range.";
  if (lower.includes("0x0ca968d8") || lower.includes("notapproved")) return "Connected wallet is not approved to manage this V4 position.";
  const reason = combined.match(/reverted with the following reason:\s*([^\n]+)/i)
    ?? combined.match(/execution reverted:\s*([^\n]+)/i);
  if (reason?.[1]) return "Contract reverted: " + reason[1].trim().slice(0, 180);
  if (lower.includes("execution reverted") || lower.includes("reverted")) {
    return "Contract call reverted without a reason. Check allowances, pool liquidity, token restrictions and slippage.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) return "RPC request timed out. Please retry.";
  if (lower.includes("429") || lower.includes("rate limit")) return "RPC rate limit exceeded. Please retry shortly.";
  if (lower.includes("wallet or rpc client is unavailable")) return "Wallet or RPC client is unavailable.";
  if (lower.includes("changed during simulation")) return "Wallet or network changed during simulation. Please try again.";
  if (lower.includes("wrong network") || lower.includes("unsupported chain")) return `Wrong network. Please switch to ${targetChain.name}.`;
  if (lower.includes("invalid token address")) return "Invalid token address.";
  if (lower.includes("metadata")) return "Token metadata read failed.";
  if (lower.includes("pair not found")) return "Pair not found.";
  if (lower.includes("quote")) return "Quote failed. Try another amount or pair.";
  if (lower.includes("multicall")) return "Some batch reads failed. Data may be incomplete.";
  return "Something went wrong. Please try again.";
}
