import { formatUnits, type Address } from "viem";

export function formatAddress(address?: Address | string, start = 6, end = 4) {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatTokenAmount(value?: bigint, decimals = 18, fractionDigits = 4) {
  if (value === undefined) return "0";
  const raw = formatUnits(value, decimals);
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return raw;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits
  }).format(numeric);
}

export function formatTokenAmountPlain(value?: bigint, decimals = 18, fractionDigits = 8) {
  if (value === undefined) return "";
  const raw = formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const trimmedFraction = fraction.slice(0, fractionDigits).replace(/0+$/, "");
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

export function formatTokenAmountFixed(value?: bigint, decimals = 18, fractionDigits = 9) {
  if (value === undefined || value === 0n) return "0";
  const raw = formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const paddedFraction = fraction.padEnd(fractionDigits, "0").slice(0, fractionDigits);
  if (whole === "0" && /^0+$/.test(paddedFraction)) {
    return `<0.${"0".repeat(Math.max(fractionDigits - 1, 0))}1`;
  }
  return fractionDigits > 0 ? `${whole}.${paddedFraction}` : whole;
}

export function toSafeAmount(value: string) {
  const next = value.trim();
  if (next === "") return "";
  if (!/^\d*\.?\d*$/.test(next)) return "";
  return next;
}

export function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(2) : "0.00"}%`;
}
