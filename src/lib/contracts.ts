import { zeroAddress, type Address } from "viem";
import { supportsV3V4, targetNetwork } from "./chains";

export const CONTRACTS = {
  robinhoodTestnet: {
    weth: { address: "0xFea12dfD7FA27BFf872AEA477f728099B1c71Bd4" as Address },
    uniswapV2Factory: {
      address: "0xa0cec339C549BB10b9720744CdAfb15A21B085A9" as Address,
      args: { feeToSetter: "0xD524a42103c81abEe242870058F4A28b192d5720" as Address }
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
export const v3FactoryAddress = supportsV3V4 ? CONTRACTS.bscTestnet.uniswapV3Factory.address : zeroAddress;
export const v3PositionManagerAddress = supportsV3V4 ? CONTRACTS.bscTestnet.nonfungiblePositionManager.address : zeroAddress;
export const v3QuoterAddress = supportsV3V4 ? CONTRACTS.bscTestnet.quoterV2.address : zeroAddress;
export const v3SwapRouterAddress = supportsV3V4 ? CONTRACTS.bscTestnet.swapRouter.address : zeroAddress;
export const permit2Address = supportsV3V4 ? CONTRACTS.bscTestnet.permit2.address : zeroAddress;
export const v4PoolManagerAddress = supportsV3V4 ? CONTRACTS.bscTestnet.v4PoolManager.address : zeroAddress;
export const v4PositionManagerAddress = supportsV3V4 ? CONTRACTS.bscTestnet.v4PositionManager.address : zeroAddress;
export const v4StateViewAddress = supportsV3V4 ? CONTRACTS.bscTestnet.v4StateView.address : zeroAddress;
export const v4QuoterAddress = supportsV3V4 ? CONTRACTS.bscTestnet.v4Quoter.address : zeroAddress;
export const universalRouterAddress = supportsV3V4 ? CONTRACTS.bscTestnet.universalRouter.address : zeroAddress;
