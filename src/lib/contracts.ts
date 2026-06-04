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
    }
  }
} as const;

export const routerAddress = CONTRACTS.bscTestnet.uniswapV2Router.address;
export const factoryAddress = CONTRACTS.bscTestnet.uniswapV2Factory.address;
