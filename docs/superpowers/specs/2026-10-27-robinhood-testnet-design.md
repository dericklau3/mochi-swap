# Robinhood testnet V2 support

Approved in chat: add a top-level BSC / Robinhood testnet selector that reloads the page. Keep BSC as the default. Bind reads, writes, native assets and stored tokens/positions to the selected application network. Reset the position route on network changes.

Robinhood uses chain ID 46630, ETH, the official public RPC and explorer, and the supplied WETH, V2 Factory and Router. Only V2 is available there; V3/V4 UI, quotes and deep links must be blocked. ETH and WETH are the initial token list; users import another ERC20 to trade or supply liquidity. Preserve legacy BSC storage.

Approaches: chosen page reload fits the existing static contract exports and clears transient query/form state. A fully reactive network context would require a broader hook and application-state refactor and is deferred. README documents addresses, constructor arguments, RPC override and usage. Verify configuration, cache isolation, V2 transaction parameters, regression suite, lint, build and browser UI; do not broadcast transactions.
