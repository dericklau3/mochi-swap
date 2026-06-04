import { isAddress } from "viem";
import type { Token } from "../types/token";
import { defaultTokens } from "./tokens";

const CUSTOM_TOKENS_KEY = "mochi-swap:custom-tokens";

export function loadCustomTokens(storage: Pick<Storage, "getItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(CUSTOM_TOKENS_KEY) ?? "[]") as Token[];
    return parsed.filter(isStoredCustomToken).reduce<Token[]>((result, token) => mergeCustomToken(result, token), []);
  } catch {
    return [];
  }
}

export function saveCustomTokens(tokens: Token[], storage: Pick<Storage, "setItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage) {
  if (!storage) return;
  storage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens.filter((token) => token.isCustom)));
}

export function mergeCustomToken(current: Token[], token: Token) {
  const exists = [...defaultTokens, ...current].some((item) => item.address.toLowerCase() === token.address.toLowerCase());
  return exists ? current : [...current, { ...token, isCustom: true }];
}

function isStoredCustomToken(token: Token) {
  return Boolean(
    token &&
    isAddress(token.address) &&
    token.symbol &&
    Number.isInteger(token.decimals) &&
    token.decimals >= 0 &&
    token.decimals <= 255
  );
}
