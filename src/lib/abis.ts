export const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] }
] as const;

export const uniswapV2RouterAbi = [
  { type: "function", name: "factory", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "WETH", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "getAmountsOut", stateMutability: "view", inputs: [{ type: "uint256", name: "amountIn" }, { type: "address[]", name: "path" }], outputs: [{ type: "uint256[]", name: "amounts" }] },
  { type: "function", name: "getAmountsIn", stateMutability: "view", inputs: [{ type: "uint256", name: "amountOut" }, { type: "address[]", name: "path" }], outputs: [{ type: "uint256[]", name: "amounts" }] },
  { type: "function", name: "swapExactTokensForTokens", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "amountIn" }, { type: "uint256", name: "amountOutMin" }, { type: "address[]", name: "path" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256[]", name: "amounts" }] },
  { type: "function", name: "swapTokensForExactTokens", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "amountOut" }, { type: "uint256", name: "amountInMax" }, { type: "address[]", name: "path" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256[]", name: "amounts" }] },
  { type: "function", name: "swapExactETHForTokens", stateMutability: "payable", inputs: [{ type: "uint256", name: "amountOutMin" }, { type: "address[]", name: "path" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256[]", name: "amounts" }] },
  { type: "function", name: "swapExactTokensForETH", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "amountIn" }, { type: "uint256", name: "amountOutMin" }, { type: "address[]", name: "path" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256[]", name: "amounts" }] },
  { type: "function", name: "addLiquidity", stateMutability: "nonpayable", inputs: [{ type: "address", name: "tokenA" }, { type: "address", name: "tokenB" }, { type: "uint256", name: "amountADesired" }, { type: "uint256", name: "amountBDesired" }, { type: "uint256", name: "amountAMin" }, { type: "uint256", name: "amountBMin" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256", name: "amountA" }, { type: "uint256", name: "amountB" }, { type: "uint256", name: "liquidity" }] },
  { type: "function", name: "addLiquidityETH", stateMutability: "payable", inputs: [{ type: "address", name: "token" }, { type: "uint256", name: "amountTokenDesired" }, { type: "uint256", name: "amountTokenMin" }, { type: "uint256", name: "amountETHMin" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256", name: "amountToken" }, { type: "uint256", name: "amountETH" }, { type: "uint256", name: "liquidity" }] },
  { type: "function", name: "removeLiquidity", stateMutability: "nonpayable", inputs: [{ type: "address", name: "tokenA" }, { type: "address", name: "tokenB" }, { type: "uint256", name: "liquidity" }, { type: "uint256", name: "amountAMin" }, { type: "uint256", name: "amountBMin" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256", name: "amountA" }, { type: "uint256", name: "amountB" }] },
  { type: "function", name: "removeLiquidityETH", stateMutability: "nonpayable", inputs: [{ type: "address", name: "token" }, { type: "uint256", name: "liquidity" }, { type: "uint256", name: "amountTokenMin" }, { type: "uint256", name: "amountETHMin" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }], outputs: [{ type: "uint256", name: "amountToken" }, { type: "uint256", name: "amountETH" }] },
  { type: "function", name: "removeLiquidityWithPermit", stateMutability: "nonpayable", inputs: [{ type: "address", name: "tokenA" }, { type: "address", name: "tokenB" }, { type: "uint256", name: "liquidity" }, { type: "uint256", name: "amountAMin" }, { type: "uint256", name: "amountBMin" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }, { type: "bool", name: "approveMax" }, { type: "uint8", name: "v" }, { type: "bytes32", name: "r" }, { type: "bytes32", name: "s" }], outputs: [{ type: "uint256", name: "amountA" }, { type: "uint256", name: "amountB" }] },
  { type: "function", name: "removeLiquidityETHWithPermit", stateMutability: "nonpayable", inputs: [{ type: "address", name: "token" }, { type: "uint256", name: "liquidity" }, { type: "uint256", name: "amountTokenMin" }, { type: "uint256", name: "amountETHMin" }, { type: "address", name: "to" }, { type: "uint256", name: "deadline" }, { type: "bool", name: "approveMax" }, { type: "uint8", name: "v" }, { type: "bytes32", name: "r" }, { type: "bytes32", name: "s" }], outputs: [{ type: "uint256", name: "amountToken" }, { type: "uint256", name: "amountETH" }] }
] as const;

export const uniswapV2FactoryAbi = [
  { type: "function", name: "getPair", stateMutability: "view", inputs: [{ type: "address", name: "tokenA" }, { type: "address", name: "tokenB" }], outputs: [{ type: "address", name: "pair" }] },
  { type: "function", name: "createPair", stateMutability: "nonpayable", inputs: [{ type: "address", name: "tokenA" }, { type: "address", name: "tokenB" }], outputs: [{ type: "address", name: "pair" }] },
  { type: "function", name: "feeTo", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "feeToSetter", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }
] as const;

export const uniswapV2PairAbi = [
  { type: "function", name: "token0", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "token1", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "getReserves", stateMutability: "view", inputs: [], outputs: [{ type: "uint112" }, { type: "uint112" }, { type: "uint32" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "nonces", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }
] as const;

export const uniswapV3FactoryAbi = [
  { type: "function", name: "getPool", stateMutability: "view", inputs: [{ type: "address", name: "tokenA" }, { type: "address", name: "tokenB" }, { type: "uint24", name: "fee" }], outputs: [{ type: "address", name: "pool" }] }
] as const;

export const uniswapV3PoolAbi = [
  { type: "function", name: "slot0", stateMutability: "view", inputs: [], outputs: [{ type: "uint160", name: "sqrtPriceX96" }, { type: "int24", name: "tick" }, { type: "uint16", name: "observationIndex" }, { type: "uint16", name: "observationCardinality" }, { type: "uint16", name: "observationCardinalityNext" }, { type: "uint8", name: "feeProtocol" }, { type: "bool", name: "unlocked" }] },
  { type: "function", name: "liquidity", stateMutability: "view", inputs: [], outputs: [{ type: "uint128" }] },
  { type: "function", name: "feeGrowthGlobal0X128", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "feeGrowthGlobal1X128", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "ticks", stateMutability: "view", inputs: [{ type: "int24", name: "tick" }], outputs: [{ type: "uint128", name: "liquidityGross" }, { type: "int128", name: "liquidityNet" }, { type: "uint256", name: "feeGrowthOutside0X128" }, { type: "uint256", name: "feeGrowthOutside1X128" }, { type: "int56", name: "tickCumulativeOutside" }, { type: "uint160", name: "secondsPerLiquidityOutsideX128" }, { type: "uint32", name: "secondsOutside" }, { type: "bool", name: "initialized" }] }
] as const;

export const quoterV2Abi = [
  { type: "function", name: "quoteExactInputSingle", stateMutability: "nonpayable", inputs: [{ type: "tuple", name: "params", components: [{ type: "address", name: "tokenIn" }, { type: "address", name: "tokenOut" }, { type: "uint256", name: "amountIn" }, { type: "uint24", name: "fee" }, { type: "uint160", name: "sqrtPriceLimitX96" }] }], outputs: [{ type: "uint256", name: "amountOut" }, { type: "uint160", name: "sqrtPriceX96After" }, { type: "uint32", name: "initializedTicksCrossed" }, { type: "uint256", name: "gasEstimate" }] }
] as const;

export const swapRouterV3Abi = [
  { type: "function", name: "exactInputSingle", stateMutability: "payable", inputs: [{ type: "tuple", name: "params", components: [{ type: "address", name: "tokenIn" }, { type: "address", name: "tokenOut" }, { type: "uint24", name: "fee" }, { type: "address", name: "recipient" }, { type: "uint256", name: "deadline" }, { type: "uint256", name: "amountIn" }, { type: "uint256", name: "amountOutMinimum" }, { type: "uint160", name: "sqrtPriceLimitX96" }] }], outputs: [{ type: "uint256", name: "amountOut" }] },
  { type: "function", name: "unwrapWETH9", stateMutability: "payable", inputs: [{ type: "uint256", name: "amountMinimum" }, { type: "address", name: "recipient" }], outputs: [] },
  { type: "function", name: "multicall", stateMutability: "payable", inputs: [{ type: "bytes[]", name: "data" }], outputs: [{ type: "bytes[]", name: "results" }] }
] as const;

export const nonfungiblePositionManagerAbi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address", name: "owner" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "tokenOfOwnerByIndex", stateMutability: "view", inputs: [{ type: "address", name: "owner" }, { type: "uint256", name: "index" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "createAndInitializePoolIfNecessary", stateMutability: "payable", inputs: [{ type: "address", name: "token0" }, { type: "address", name: "token1" }, { type: "uint24", name: "fee" }, { type: "uint160", name: "sqrtPriceX96" }], outputs: [{ type: "address", name: "pool" }] },
  { type: "function", name: "mint", stateMutability: "payable", inputs: [{ type: "tuple", name: "params", components: [{ type: "address", name: "token0" }, { type: "address", name: "token1" }, { type: "uint24", name: "fee" }, { type: "int24", name: "tickLower" }, { type: "int24", name: "tickUpper" }, { type: "uint256", name: "amount0Desired" }, { type: "uint256", name: "amount1Desired" }, { type: "uint256", name: "amount0Min" }, { type: "uint256", name: "amount1Min" }, { type: "address", name: "recipient" }, { type: "uint256", name: "deadline" }] }], outputs: [{ type: "uint256", name: "tokenId" }, { type: "uint128", name: "liquidity" }, { type: "uint256", name: "amount0" }, { type: "uint256", name: "amount1" }] },
  { type: "function", name: "increaseLiquidity", stateMutability: "payable", inputs: [{ type: "tuple", name: "params", components: [{ type: "uint256", name: "tokenId" }, { type: "uint256", name: "amount0Desired" }, { type: "uint256", name: "amount1Desired" }, { type: "uint256", name: "amount0Min" }, { type: "uint256", name: "amount1Min" }, { type: "uint256", name: "deadline" }] }], outputs: [{ type: "uint128", name: "liquidity" }, { type: "uint256", name: "amount0" }, { type: "uint256", name: "amount1" }] },
  { type: "function", name: "positions", stateMutability: "view", inputs: [{ type: "uint256", name: "tokenId" }], outputs: [{ type: "uint96", name: "nonce" }, { type: "address", name: "operator" }, { type: "address", name: "token0" }, { type: "address", name: "token1" }, { type: "uint24", name: "fee" }, { type: "int24", name: "tickLower" }, { type: "int24", name: "tickUpper" }, { type: "uint128", name: "liquidity" }, { type: "uint256", name: "feeGrowthInside0LastX128" }, { type: "uint256", name: "feeGrowthInside1LastX128" }, { type: "uint128", name: "tokensOwed0" }, { type: "uint128", name: "tokensOwed1" }] },
  { type: "function", name: "decreaseLiquidity", stateMutability: "payable", inputs: [{ type: "tuple", name: "params", components: [{ type: "uint256", name: "tokenId" }, { type: "uint128", name: "liquidity" }, { type: "uint256", name: "amount0Min" }, { type: "uint256", name: "amount1Min" }, { type: "uint256", name: "deadline" }] }], outputs: [{ type: "uint256", name: "amount0" }, { type: "uint256", name: "amount1" }] },
  { type: "function", name: "collect", stateMutability: "payable", inputs: [{ type: "tuple", name: "params", components: [{ type: "uint256", name: "tokenId" }, { type: "address", name: "recipient" }, { type: "uint128", name: "amount0Max" }, { type: "uint128", name: "amount1Max" }] }], outputs: [{ type: "uint256", name: "amount0" }, { type: "uint256", name: "amount1" }] },
  { type: "function", name: "refundETH", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "multicall", stateMutability: "payable", inputs: [{ type: "bytes[]", name: "data" }], outputs: [{ type: "bytes[]", name: "results" }] }
] as const;

const v4PoolKeyComponents = [
  { type: "address", name: "currency0" },
  { type: "address", name: "currency1" },
  { type: "uint24", name: "fee" },
  { type: "int24", name: "tickSpacing" },
  { type: "address", name: "hooks" }
] as const;

export const permit2Abi = [
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address", name: "user" }, { type: "address", name: "token" }, { type: "address", name: "spender" }], outputs: [{ type: "uint160", name: "amount" }, { type: "uint48", name: "expiration" }, { type: "uint48", name: "nonce" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address", name: "token" }, { type: "address", name: "spender" }, { type: "uint160", name: "amount" }, { type: "uint48", name: "expiration" }], outputs: [] }
] as const;

export const v4PositionManagerAbi = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ type: "uint256", name: "tokenId" }], outputs: [{ type: "address" }] },
  { type: "function", name: "nextTokenId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getPositionLiquidity", stateMutability: "view", inputs: [{ type: "uint256", name: "tokenId" }], outputs: [{ type: "uint128", name: "liquidity" }] },
  { type: "function", name: "getPoolAndPositionInfo", stateMutability: "view", inputs: [{ type: "uint256", name: "tokenId" }], outputs: [{ type: "tuple", name: "poolKey", components: v4PoolKeyComponents }, { type: "uint256", name: "info" }] },
  { type: "function", name: "initializePool", stateMutability: "payable", inputs: [{ type: "tuple", name: "key", components: v4PoolKeyComponents }, { type: "uint160", name: "sqrtPriceX96" }], outputs: [{ type: "int24" }] },
  { type: "function", name: "permitBatch", stateMutability: "payable", inputs: [{ type: "address", name: "owner" }, { type: "tuple", name: "_permitBatch", components: [{ type: "tuple[]", name: "details", components: [{ type: "address", name: "token" }, { type: "uint160", name: "amount" }, { type: "uint48", name: "expiration" }, { type: "uint48", name: "nonce" }] }, { type: "address", name: "spender" }, { type: "uint256", name: "sigDeadline" }] }, { type: "bytes", name: "signature" }], outputs: [{ type: "bytes", name: "err" }] },
  { type: "function", name: "modifyLiquidities", stateMutability: "payable", inputs: [{ type: "bytes", name: "unlockData" }, { type: "uint256", name: "deadline" }], outputs: [] },
  { type: "function", name: "multicall", stateMutability: "payable", inputs: [{ type: "bytes[]", name: "data" }], outputs: [{ type: "bytes[]", name: "results" }] }
] as const;

export const v4StateViewAbi = [
  { type: "function", name: "getSlot0", stateMutability: "view", inputs: [{ type: "bytes32", name: "poolId" }], outputs: [{ type: "uint160", name: "sqrtPriceX96" }, { type: "int24", name: "tick" }, { type: "uint24", name: "protocolFee" }, { type: "uint24", name: "lpFee" }] },
  { type: "function", name: "getLiquidity", stateMutability: "view", inputs: [{ type: "bytes32", name: "poolId" }], outputs: [{ type: "uint128", name: "liquidity" }] },
  { type: "function", name: "getFeeGrowthInside", stateMutability: "view", inputs: [{ type: "bytes32", name: "poolId" }, { type: "int24", name: "tickLower" }, { type: "int24", name: "tickUpper" }], outputs: [{ type: "uint256", name: "feeGrowthInside0X128" }, { type: "uint256", name: "feeGrowthInside1X128" }] },
  { type: "function", name: "getPositionInfo", stateMutability: "view", inputs: [{ type: "bytes32", name: "poolId" }, { type: "address", name: "owner" }, { type: "int24", name: "tickLower" }, { type: "int24", name: "tickUpper" }, { type: "bytes32", name: "salt" }], outputs: [{ type: "uint128", name: "liquidity" }, { type: "uint256", name: "feeGrowthInside0LastX128" }, { type: "uint256", name: "feeGrowthInside1LastX128" }] }
] as const;

export const v4QuoterAbi = [
  { type: "function", name: "quoteExactInputSingle", stateMutability: "nonpayable", inputs: [{ type: "tuple", name: "params", components: [{ type: "tuple", name: "poolKey", components: v4PoolKeyComponents }, { type: "bool", name: "zeroForOne" }, { type: "uint128", name: "exactAmount" }, { type: "bytes", name: "hookData" }] }], outputs: [{ type: "uint256", name: "amountOut" }, { type: "uint256", name: "gasEstimate" }] }
] as const;

export const universalRouterAbi = [
  { type: "function", name: "execute", stateMutability: "payable", inputs: [{ type: "bytes", name: "commands" }, { type: "bytes[]", name: "inputs" }, { type: "uint256", name: "deadline" }], outputs: [] }
] as const;
