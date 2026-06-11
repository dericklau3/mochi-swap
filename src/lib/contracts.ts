import type { Address } from "viem";

export const CONTRACTS = {
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
    }
  }
} as const;

export const routerAddress = CONTRACTS.bscTestnet.uniswapV2Router.address;
export const factoryAddress = CONTRACTS.bscTestnet.uniswapV2Factory.address;
export const v3FactoryAddress = CONTRACTS.bscTestnet.uniswapV3Factory.address;
export const v3PositionManagerAddress = CONTRACTS.bscTestnet.nonfungiblePositionManager.address;
export const v3QuoterAddress = CONTRACTS.bscTestnet.quoterV2.address;
export const v3SwapRouterAddress = CONTRACTS.bscTestnet.swapRouter.address;
