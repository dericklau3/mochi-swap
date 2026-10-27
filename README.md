# Mochi Swap

## 网络使用

顶部网络选择器支持 BSC Testnet 和 Robinhood Testnet，默认 BSC Testnet。切换应用网络会重新加载页面并回到 Swap；钱包网络不一致时，点击 `Switch wallet` 或页面中的 `Switch Network` 切换钱包。

- BSC Testnet：支持 V2 / V3 / V4。
- Robinhood Testnet：支持 V2 / V3 兑换、ERC20 授权、创建/添加和移除流动性及仓位管理。V4 暂未配置。
- 自定义代币和 LP 仓位按网络隔离，原有 BSC 数据保留。Robinhood 初始代币为 ETH / WETH；两者在 V2 中对应同一资产，需通过代币选择器导入另一个 ERC20 地址后交易或创建池。兑换还需要相应池中已有流动性。

可直接通过 `?network=robinhoodTestnet#/swap` 打开 Robinhood 网络。复制 `.env.example` 为 `.env.local` 后可配置 `VITE_ROBINHOOD_TESTNET_RPC_URL`，留空使用官方公共 RPC；更改环境变量后需重启开发服务或重新构建。

## Robinhood Testnet

网络参数来自 [Robinhood 官方连接文档](https://docs.robinhood.com/chain/connecting/)。

| 参数 | 值 |
| --- | --- |
| Chain ID | `46630` |
| 原生币 | ETH（18 decimals） |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| 浏览器 | [Robinhood Testnet Explorer](https://explorer.testnet.chain.robinhood.com) |

### Uniswap V2 合约地址

| 合约 | 地址 |
| --- | --- |
| WETH | [0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4](https://explorer.testnet.chain.robinhood.com/address/0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4) |
| `uniswapV2Factory` | [0xa0cec339C549BB10b9720744CdAfb15A21B085A9](https://explorer.testnet.chain.robinhood.com/address/0xa0cec339C549BB10b9720744CdAfb15A21B085A9) |
| `uniswapV2Router` | [0xdd67C669F804e36F496Eb228a361A465a1DDDAac](https://explorer.testnet.chain.robinhood.com/address/0xdd67C669F804e36F496Eb228a361A465a1DDDAac) |

Factory 构造参数 `feeToSetter`：`0xD524a42103c81abEe242870058F4A28b192d5720`。
Router 构造参数 `factory`：`0xa0cec339C549BB10b9720744CdAfb15A21B085A9`，`weth`：`0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4`。

### Uniswap V3 合约地址

| 合约 | 地址 |
| --- | --- |
| `uniswapV3Factory` | [0x352A92bAc9F383915B48B27237136eCA7Ea6485B](https://explorer.testnet.chain.robinhood.com/address/0x352A92bAc9F383915B48B27237136eCA7Ea6485B) |
| `uniswapInterfaceMulticall` | [0xaA771b92264Df81560d9E71b5411feB51748222a](https://explorer.testnet.chain.robinhood.com/address/0xaA771b92264Df81560d9E71b5411feB51748222a) |
| `proxyAdmin` | [0x61d143c4c20b61E246a33e267434C2c44c1bf0D8](https://explorer.testnet.chain.robinhood.com/address/0x61d143c4c20b61E246a33e267434C2c44c1bf0D8) |
| `tickLens` | [0xEb8C226F18022E52DFaCBa14BdaCBe2d8Cf0c0b6](https://explorer.testnet.chain.robinhood.com/address/0xEb8C226F18022E52DFaCBa14BdaCBe2d8Cf0c0b6) |
| `nftDescriptor` | [0x9d1E307330a734a4411ddAd1a99d73029b5D6dC8](https://explorer.testnet.chain.robinhood.com/address/0x9d1E307330a734a4411ddAd1a99d73029b5D6dC8) |
| `nonfungibleTokenPositionDescriptorImpl` | [0x756e7db9D51553E8f7994157d58e0077C4f488A1](https://explorer.testnet.chain.robinhood.com/address/0x756e7db9D51553E8f7994157d58e0077C4f488A1) |
| `nonfungibleTokenPositionDescriptor` | [0xC2C699671125FAF4F0497132003661E292d8dD81](https://explorer.testnet.chain.robinhood.com/address/0xC2C699671125FAF4F0497132003661E292d8dD81) |
| `nonfungiblePositionManager` | [0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe](https://explorer.testnet.chain.robinhood.com/address/0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe) |
| `v3Migrator` | [0xfE4c99119256E64B084D57c8120bD5c8AB2f486F](https://explorer.testnet.chain.robinhood.com/address/0xfE4c99119256E64B084D57c8120bD5c8AB2f486F) |
| `quoter` | [0xcC325CdDCBe0434Ba064D84bCe71816C83AC1B20](https://explorer.testnet.chain.robinhood.com/address/0xcC325CdDCBe0434Ba064D84bCe71816C83AC1B20) |
| `quoterV2` | [0xe2eDbCdD87cd52b33a41d67434F6D6a6b3075291](https://explorer.testnet.chain.robinhood.com/address/0xe2eDbCdD87cd52b33a41d67434F6D6a6b3075291) |
| `swapRouter` | [0xc98A0311Ba733fBd2f4b21397df598f9e5a814fc](https://explorer.testnet.chain.robinhood.com/address/0xc98A0311Ba733fBd2f4b21397df598f9e5a814fc) |
| `swapRouter02` | [0x1Ba7A342477130d7C35CACC42879772ED6afC0A0](https://explorer.testnet.chain.robinhood.com/address/0x1Ba7A342477130d7C35CACC42879772ED6afC0A0) |

V3 报价使用 `quoterV2`，交易使用 `swapRouter`（含 deadline 的现有 V3 ABI）。`swapRouter02` 与其余辅助合约一并记录，暂未用于前端交易路由。按已跟踪代币对读取钱包中的 V3 NFT 仓位，支持创建、增加/移除流动性及领取费用。

构造参数（地址与上述表格对应）：

| 合约 | 参数 |
| --- | --- |
| `quoter` | `factory=0x352A92bAc9F383915B48B27237136eCA7Ea6485B`, `weth=0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4` |
| `quoterV2` | `factory=0x352A92bAc9F383915B48B27237136eCA7Ea6485B`, `weth=0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4` |
| `swapRouter` | `factory=0x352A92bAc9F383915B48B27237136eCA7Ea6485B`, `weth=0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4` |
| `nonfungiblePositionManager` | `factory=0x352A92bAc9F383915B48B27237136eCA7Ea6485B`, `weth=0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4`, `tokenDescriptor=0xC2C699671125FAF4F0497132003661E292d8dD81` |
| `v3Migrator` | `factory=0x352A92bAc9F383915B48B27237136eCA7Ea6485B`, `weth=0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4`, `nonfungiblePositionManager=0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe` |
| `swapRouter02` | `factory=0x352A92bAc9F383915B48B27237136eCA7Ea6485B`, `weth=0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4`, `v2Factory=0xa0cec339C549BB10b9720744CdAfb15A21B085A9`, `positionManager=0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe` |
| `nonfungibleTokenPositionDescriptorImpl` | `weth=0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4` |
| `nonfungibleTokenPositionDescriptor` | `logic=0x756e7db9D51553E8f7994157d58e0077C4f488A1`, `admin=0x61d143c4c20b61E246a33e267434C2c44c1bf0D8`, `data=0x` |

`swapRouter02` 的 V2 Factory 参数在配置中规范命名为 `v2Factory`（原始部署信息中的 `v2Facotry`）。

## bsctest 合约地址

### 代币

| 合约 | 地址 |
| --- | --- |
| WBNB | [0x04E0459121DB7D49AE932428762a44B616E967D6](https://testnet.bscscan.com/address/0x04E0459121DB7D49AE932428762a44B616E967D6) |
| USDT | [0xa83C8A2162225c0DeD2d288FaF453076682a861C](https://testnet.bscscan.com/address/0xa83C8A2162225c0DeD2d288FaF453076682a861C) |

### Uniswap V2

| 合约 | 地址 |
| --- | --- |
| `uniswapV2Factory` | [0x842f00Caae1f75aBECcAEc69c9c2c9f73E3d6C9A](https://testnet.bscscan.com/address/0x842f00Caae1f75aBECcAEc69c9c2c9f73E3d6C9A) |
| `uniswapV2Router` | [0x68a5614cD96FE32485D4D5549d0bEd87a6765cF3](https://testnet.bscscan.com/address/0x68a5614cD96FE32485D4D5549d0bEd87a6765cF3) |

### Uniswap V3

| 合约 | 地址 |
| --- | --- |
| `uniswapV3Factory` | [0xFB1370296ab08f5404653b57F845C73885574D63](https://testnet.bscscan.com/address/0xFB1370296ab08f5404653b57F845C73885574D63) |
| `uniswapInterfaceMulticall` | [0x95da2e1591cAD0e320Ab9dd37F688c8667D63EAF](https://testnet.bscscan.com/address/0x95da2e1591cAD0e320Ab9dd37F688c8667D63EAF) |
| `tickLens` | [0xF0683FEbEfE3186FCfeb4b04615Df603F9dd4a09](https://testnet.bscscan.com/address/0xF0683FEbEfE3186FCfeb4b04615Df603F9dd4a09) |
| `nonfungiblePositionManager` | [0x40A9776F35cfc9e02e6985b02b9586fE8357b369](https://testnet.bscscan.com/address/0x40A9776F35cfc9e02e6985b02b9586fE8357b369) |
| `quoterV2` | [0xFF3d4D112680Ea24866F1ba9B91bcBbB79c17BAD](https://testnet.bscscan.com/address/0xFF3d4D112680Ea24866F1ba9B91bcBbB79c17BAD) |
| `swapRouter` | [0x98fA55c53434A96b96aA96f0CF15C759d4FcD901](https://testnet.bscscan.com/address/0x98fA55c53434A96b96aA96f0CF15C759d4FcD901) |

### Uniswap V4

| 合约 | 地址 |
| --- | --- |
| `permit2` | [0x000000000022D473030F116dDEE9F6B43aC78BA3](https://testnet.bscscan.com/address/0x000000000022D473030F116dDEE9F6B43aC78BA3) |
| `v4PoolManager` | [0xe60Fc7C84A697270797986e342e2fe2A1A0310cA](https://testnet.bscscan.com/address/0xe60Fc7C84A697270797986e342e2fe2A1A0310cA) |
| `v4PositionManager` | [0x38342ef4253091B8C4535eBcE1492077BAA7e023](https://testnet.bscscan.com/address/0x38342ef4253091B8C4535eBcE1492077BAA7e023) |
| `v4StateView` | [0x25c413Edc80F97dce81479fF4DAC67940095CcB5](https://testnet.bscscan.com/address/0x25c413Edc80F97dce81479fF4DAC67940095CcB5) |
| `v4Quoter` | [0xbE46d4cA46aC3217e5547fB93b9B50Daf92bC213](https://testnet.bscscan.com/address/0xbE46d4cA46aC3217e5547fB93b9B50Daf92bC213) |
| `universalRouter` | [0x5EEA3b6053f56C0f1D48F7215D26c3c0ab6C67b1](https://testnet.bscscan.com/address/0x5EEA3b6053f56C0f1D48F7215D26c3c0ab6C67b1) |
