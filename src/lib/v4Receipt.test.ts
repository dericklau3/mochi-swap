import { describe, expect, it } from "vitest";
import { encodeEventTopics, zeroAddress, type Log } from "viem";
import { v4PositionManagerAddress } from "./contracts";
import { getMintedV4TokenId } from "./v4Receipt";

const transferEvent = {
  type: "event",
  name: "Transfer",
  inputs: [
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: true, name: "tokenId", type: "uint256" }
  ]
} as const;

describe("V4 receipt parsing", () => {
  it("finds the PositionManager ERC-721 mint token id", () => {
    const owner = "0x0000000000000000000000000000000000000001";
    const topics = encodeEventTopics({ abi: [transferEvent], eventName: "Transfer", args: { from: zeroAddress, to: owner, tokenId: 42n } });
    const logs = [{ address: v4PositionManagerAddress, topics: topics as unknown as Log["topics"], data: "0x" as const }];

    expect(getMintedV4TokenId(logs, owner)).toBe(42n);
  });
});
