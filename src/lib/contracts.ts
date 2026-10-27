import { zeroAddress, type Address } from "viem";
import { supportsV4, targetNetwork } from "./chains";

export const CONTRACTS = {
  robinhoodTestnet: {
    weth: { address: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address },
    uniswapV2Factory: {
      address: "0xa0cec339C549BB10b9720744CdAfb15A21B085A9" as Address,
      args: { feeToSetter: "0xD524a42103c81abEe242870058F4A28b192d5720" as Address }
    },
    uniswapV3Factory: {
      address: "0x352A92bAc9F383915B48B27237136eCA7Ea6485B" as Address
    },
    uniswapInterfaceMulticall: {
      address: "0xaA771b92264Df81560d9E71b5411feB51748222a" as Address
    },
    proxyAdmin: {
      address: "0x61d143c4c20b61E246a33e267434C2c44c1bf0D8" as Address
    },
    tickLens: {
      address: "0xEb8C226F18022E52DFaCBa14BdaCBe2d8Cf0c0b6" as Address
    },
    nftDescriptor: {
      address: "0x9d1E307330a734a4411ddAd1a99d73029b5D6dC8" as Address
    },
    nonfungibleTokenPositionDescriptorImpl: {
      address: "0x756e7db9D51553E8f7994157d58e0077C4f488A1" as Address,
      args: {
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address
      }
    },
    nonfungibleTokenPositionDescriptor: {
      address: "0xC2C699671125FAF4F0497132003661E292d8dD81" as Address,
      args: {
        logic: "0x756e7db9D51553E8f7994157d58e0077C4f488A1" as Address,
        admin: "0x61d143c4c20b61E246a33e267434C2c44c1bf0D8" as Address,
        data: "0x"
      }
    },
    nonfungiblePositionManager: {
      address: "0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe" as Address,
      args: {
        factory: "0x352A92bAc9F383915B48B27237136eCA7Ea6485B" as Address,
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address,
        tokenDescriptor: "0xC2C699671125FAF4F0497132003661E292d8dD81" as Address
      }
    },
    v3Migrator: {
      address: "0xfE4c99119256E64B084D57c8120bD5c8AB2f486F" as Address,
      args: {
        factory: "0x352A92bAc9F383915B48B27237136eCA7Ea6485B" as Address,
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address,
        nonfungiblePositionManager: "0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe" as Address
      }
    },
    quoter: {
      address: "0xcC325CdDCBe0434Ba064D84bCe71816C83AC1B20" as Address,
      args: {
        factory: "0x352A92bAc9F383915B48B27237136eCA7Ea6485B" as Address,
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address
      }
    },
    quoterV2: {
      address: "0xe2eDbCdD87cd52b33a41d67434F6D6a6b3075291" as Address,
      args: {
        factory: "0x352A92bAc9F383915B48B27237136eCA7Ea6485B" as Address,
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address
      }
    },
    swapRouter: {
      address: "0xc98A0311Ba733fBd2f4b21397df598f9e5a814fc" as Address,
      args: {
        factory: "0x352A92bAc9F383915B48B27237136eCA7Ea6485B" as Address,
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address
      }
    },
    swapRouter02: {
      address: "0x1Ba7A342477130d7C35CACC42879772ED6afC0A0" as Address,
      args: {
        factory: "0x352A92bAc9F383915B48B27237136eCA7Ea6485B" as Address,
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address,
        v2Factory: "0xa0cec339C549BB10b9720744CdAfb15A21B085A9" as Address,
        positionManager: "0xEf922Cf3C8430A52Ad30B84fF464BC51906A89Fe" as Address
      }
    },
    uniswapV2Router: {
      address: "0xdd67C669F804e36F496Eb228a361A465a1DDDAac" as Address,
      args: {
        factory: "0xa0cec339C549BB10b9720744CdAfb15A21B085A9" as Address,
        weth: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address
      }
    }
  },
  bscTestnet: {
    weth: {
      address: "0x04E0459121DB7D49AE932428762a44B616E967D6" as Address
    },
    usdt: {
      address: "0xa83C8A2162225c0DeD2d288FaF453076682a861C" as Address
    },
    uniswapV2Factory: {
      address: "0x842f00Caae1f75aBECcAEc69c9c2c9f73E3d6C9A" as Address,
      args: {
        feeToSetter: "0x4408e1c6745B43350711317C89Db35B479992e5C" as Address
      }
    },
    uniswapV2Router: {
      address: "0x68a5614cD96FE32485D4D5549d0bEd87a6765cF3" as Address,
      args: {
        factory: "0x842f00Caae1f75aBECcAEc69c9c2c9f73E3d6C9A" as Address,
        weth: "0x04E0459121DB7D49AE932428762a44B616E967D6" as Address
      }
    },
    uniswapV3Factory: {
      address: "0xFB1370296ab08f5404653b57F845C73885574D63" as Address
    },
    uniswapInterfaceMulticall: {
      address: "0x95da2e1591cAD0e320Ab9dd37F688c8667D63EAF" as Address
    },
    tickLens: {
      address: "0xF0683FEbEfE3186FCfeb4b04615Df603F9dd4a09" as Address
    },
    nonfungiblePositionManager: {
      address: "0x40A9776F35cfc9e02e6985b02b9586fE8357b369" as Address
    },
    quoterV2: {
      address: "0xFF3d4D112680Ea24866F1ba9B91bcBbB79c17BAD" as Address
    },
    swapRouter: {
      address: "0x98fA55c53434A96b96aA96f0CF15C759d4FcD901" as Address
    },
    permit2: {
      address: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address
    },
    v4PoolManager: {
      address: "0xe60Fc7C84A697270797986e342e2fe2A1A0310cA" as Address
    },
    v4PositionManager: {
      address: "0x38342ef4253091B8C4535eBcE1492077BAA7e023" as Address
    },
    v4StateView: {
      address: "0x25c413Edc80F97dce81479fF4DAC67940095CcB5" as Address
    },
    v4Quoter: {
      address: "0xbE46d4cA46aC3217e5547fB93b9B50Daf92bC213" as Address
    },
    universalRouter: {
      address: "0x5EEA3b6053f56C0f1D48F7215D26c3c0ab6C67b1" as Address
    }
  }
} as const;

export const activeContracts = CONTRACTS[targetNetwork];

export const routerAddress = activeContracts.uniswapV2Router.address;
export const factoryAddress = activeContracts.uniswapV2Factory.address;
export const v3FactoryAddress = activeContracts.uniswapV3Factory.address;
export const v3PositionManagerAddress = activeContracts.nonfungiblePositionManager.address;
export const v3QuoterAddress = activeContracts.quoterV2.address;
export const v3SwapRouterAddress = activeContracts.swapRouter.address;
export const permit2Address = supportsV4 ? CONTRACTS.bscTestnet.permit2.address : zeroAddress;
export const v4PoolManagerAddress = supportsV4 ? CONTRACTS.bscTestnet.v4PoolManager.address : zeroAddress;
export const v4PositionManagerAddress = supportsV4 ? CONTRACTS.bscTestnet.v4PositionManager.address : zeroAddress;
export const v4StateViewAddress = supportsV4 ? CONTRACTS.bscTestnet.v4StateView.address : zeroAddress;
export const v4QuoterAddress = supportsV4 ? CONTRACTS.bscTestnet.v4Quoter.address : zeroAddress;
export const universalRouterAddress = supportsV4 ? CONTRACTS.bscTestnet.universalRouter.address : zeroAddress;
