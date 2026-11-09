import { useCallback, useRef, useState } from "react";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { targetChain } from "../lib/chains";
import { SimulationFailedError } from "../lib/errors";

/** Simulate with the connected sender before requesting any wallet transaction. */
export function useSimulatedWriteContract() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: targetChain.id });
  const write = useWriteContract();
  const [simulationError, setSimulationError] = useState<Error | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const inFlight = useRef(false);
  const currentWallet = useRef({ address, chainId });
  currentWallet.current = { address, chainId };

  type WriteRequest = Parameters<typeof write.writeContract>[0];

  const writeContract = useCallback(async (variables: WriteRequest) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSimulationError(null);
    setIsSimulating(true);
    try {
      if (!address || !publicClient) throw new Error("Wallet or RPC client is unavailable.");
      if (chainId !== targetChain.id) throw new Error("Wrong network. Please switch to " + targetChain.name + ".");

      // viem returns the prepared write request only after eth_call succeeds.
      const { request } = await publicClient.simulateContract({
        ...variables,
        account: address
      } as Parameters<typeof publicClient.simulateContract>[0]);

      // A slow RPC must never prompt an account/chain that changed mid-request.
      if (currentWallet.current.address !== address || currentWallet.current.chainId !== chainId) {
        throw new Error("Wallet or network changed during simulation. Please try again.");
      }
      write.writeContract(request as WriteRequest);
    } catch (error) {
      setSimulationError(new SimulationFailedError(error));
    } finally {
      inFlight.current = false;
      setIsSimulating(false);
    }
  }, [address, chainId, publicClient, write.writeContract]);

  return {
    ...write,
    writeContract,
    isPending: isSimulating || write.isPending,
    error: simulationError ?? write.error
  };
}
