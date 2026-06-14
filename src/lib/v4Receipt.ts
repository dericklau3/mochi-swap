import { decodeEventLog, getAddress, zeroAddress, type Address, type Log } from "viem";
import { v4PositionManagerAddress } from "./contracts";

const transferEventAbi = [{
  type: "event",
  name: "Transfer",
  inputs: [
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: true, name: "tokenId", type: "uint256" }
  ]
}] as const;

export function getMintedV4TokenId(logs: Array<Pick<Log, "address" | "data" | "topics">>, owner?: Address) {
  for (const log of logs) {
    if (log.address.toLowerCase() !== v4PositionManagerAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi: transferEventAbi, data: log.data, topics: log.topics });
      if (decoded.eventName !== "Transfer" || decoded.args.from !== zeroAddress) continue;
      if (owner && getAddress(decoded.args.to) !== getAddress(owner)) continue;
      return decoded.args.tokenId;
    } catch {
      // Ignore unrelated PositionManager logs.
    }
  }
  return undefined;
}
