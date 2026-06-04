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
