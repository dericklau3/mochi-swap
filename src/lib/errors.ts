export function getReadableError(error: unknown): string {
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected the request")) {
    return "User rejected transaction.";
  }
  if (lower.includes("insufficient funds")) return "Insufficient funds for this transaction.";
  if (lower.includes("insufficient allowance")) return "Insufficient allowance. Please approve first.";
  if (lower.includes("price slippage check")) return "Deposit amounts do not match the V3 price and range.";
  if (lower.includes("execution reverted") || lower.includes("reverted")) return "Transaction reverted by the contract.";
  if (lower.includes("wrong network") || lower.includes("unsupported chain")) return "Wrong network. Please switch to BSC Testnet.";
  if (lower.includes("invalid token address")) return "Invalid token address.";
  if (lower.includes("metadata")) return "Token metadata read failed.";
  if (lower.includes("pair not found")) return "Pair not found.";
  if (lower.includes("quote")) return "Quote failed. Try another amount or pair.";
  if (lower.includes("multicall")) return "Some batch reads failed. Data may be incomplete.";
  return "Something went wrong. Please try again.";
}
