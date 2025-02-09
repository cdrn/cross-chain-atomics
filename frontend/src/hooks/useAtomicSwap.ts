import { useState, useEffect, useCallback } from "react";
import { EthereumService } from "../services/ethereum";
import { BitcoinService } from "../services/bitcoin";
import { SwapState, SwapOrder, ChainTransaction } from "../types";

export function useAtomicSwap(orderId?: string) {
  const [state, setState] = useState<SwapState>({
    ethLockConfirmed: false,
    btcLockConfirmed: false,
    ethClaimConfirmed: false,
    btcClaimConfirmed: false,
    currentStep: "init",
  });

  const [ethService] = useState(() => new EthereumService());
  const [btcService] = useState(() => new BitcoinService());

  const [error, setError] = useState<string>();
  const [order, setOrder] = useState<SwapOrder>();
  const [ethTx, setEthTx] = useState<ChainTransaction>();
  const [btcTx, setBtcTx] = useState<ChainTransaction>();

  // Connect to Ethereum
  const connectWallet = useCallback(
    async (contractAddress?: string) => {
      try {
        const result = await ethService.connect(contractAddress);
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to connect wallet"
        );
        throw err;
      }
    },
    [ethService]
  );

  // Initialize swap as taker
  const initializeSwap = useCallback(
    async (order: SwapOrder) => {
      try {
        if (!ethService.getContractAddress()) {
          throw new Error("Contract address not set");
        }
        setOrder(order);
        setState((prev) => ({ ...prev, currentStep: "ethLock" }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize swap"
        );
      }
    },
    [ethService]
  );

  // Lock ETH
  const lockEth = useCallback(async () => {
    if (!order) return;

    try {
      setState((prev) => ({ ...prev, currentStep: "ethLock" }));
      const tx = await ethService.createSwap(
        order.maker,
        order.id, // Using orderId as hashlock for this example
        order.expiryTime,
        BigInt(order.premium),
        BigInt(order.takerAmount)
      );
      setEthTx(tx);

      if (tx.status === "confirmed") {
        setState((prev) => ({
          ...prev,
          ethLockConfirmed: true,
          currentStep: "btcLock",
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lock ETH");
      setState((prev) => ({ ...prev, currentStep: "failed" }));
    }
  }, [order, ethService]);

  // Watch for BTC lock
  const watchBtcLock = useCallback(
    (btcAddress: string) => {
      if (!order) return;

      return btcService.watchAddress(btcAddress, (tx) => {
        setBtcTx(tx);
        if (tx.status === "confirmed") {
          setState((prev) => ({
            ...prev,
            btcLockConfirmed: true,
            currentStep: "ethClaim",
          }));
        }
      });
    },
    [order, btcService]
  );

  // Watch for ETH claim
  const watchEthClaim = useCallback(
    (swapId: string) => {
      if (!order) return;

      ethService.watchSwapEvents(swapId, (event) => {
        if (event.type === "claimed") {
          setState((prev) => ({
            ...prev,
            ethClaimConfirmed: true,
            currentStep: "btcClaim",
          }));
        }
      });
    },
    [order, ethService]
  );

  // Claim BTC
  const claimBtc = useCallback(
    async (rawTx: string) => {
      try {
        const txHash = await btcService.broadcastTransaction(rawTx);
        const tx = await btcService.verifyTransaction(txHash);
        setBtcTx(tx);

        if (tx.status === "confirmed") {
          setState((prev) => ({
            ...prev,
            btcClaimConfirmed: true,
            currentStep: "completed",
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to claim BTC");
        setState((prev) => ({ ...prev, currentStep: "failed" }));
      }
    },
    [btcService]
  );

  // Refund ETH if needed
  const refundEth = useCallback(
    async (swapId: string) => {
      try {
        const tx = await ethService.refundSwap(swapId);
        setEthTx(tx);

        if (tx.status === "confirmed") {
          setState((prev) => ({
            ...prev,
            currentStep: "failed",
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refund ETH");
      }
    },
    [ethService]
  );

  // Load existing swap if orderId is provided
  useEffect(() => {
    if (orderId) {
      // TODO: Load existing swap state
    }
  }, [orderId]);

  return {
    state,
    error,
    order,
    ethTx,
    btcTx,
    connectWallet,
    initializeSwap,
    lockEth,
    watchBtcLock,
    watchEthClaim,
    claimBtc,
    refundEth,
  };
}
