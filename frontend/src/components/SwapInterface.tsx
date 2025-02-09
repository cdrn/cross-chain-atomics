import { useState } from "react";
import { useAtomicSwap } from "../hooks/useAtomicSwap";
import { SwapOrder } from "../types";
import { Settings } from "./Settings";

export function SwapInterface() {
  const [ethConnected, setEthConnected] = useState(false);
  const [chainId, setChainId] = useState<number>();
  const [showSettings, setShowSettings] = useState(false);

  const {
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
  } = useAtomicSwap();

  const handleConnectEth = async () => {
    try {
      const { address, chainId } = await connectWallet();
      setEthConnected(true);
      setChainId(chainId);
    } catch (err) {
      console.error("Failed to connect ETH wallet:", err);
    }
  };

  const handleSaveSettings = async (address: string) => {
    try {
      const { address: connectedAddress, chainId } = await connectWallet(
        address
      );
      setEthConnected(true);
      setChainId(chainId);
    } catch (err) {
      console.error("Failed to connect with new settings:", err);
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case "init":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Start New Swap</h2>
            <button
              onClick={() => {
                // TODO: Replace with actual order from backend
                const mockOrder: SwapOrder = {
                  id: "0x123",
                  maker: "0x456",
                  makerChain: "bitcoin",
                  takerChain: "ethereum",
                  makerAmount: "1000000000000000000", // 1 BTC in sats
                  takerAmount: "1000000000000000000", // 1 ETH in wei
                  expiryTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                  premium: "100000000000000000", // 0.1 ETH in wei
                  status: "open",
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                initializeSwap(mockOrder);
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              disabled={!ethConnected}
            >
              Start New Swap
            </button>
            {!ethConnected && (
              <p className="text-sm text-gray-600">
                Please connect your ETH wallet to start a swap
              </p>
            )}
          </div>
        );

      case "ethLock":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Lock ETH</h2>
            <p className="text-gray-600">
              Lock your ETH to start the atomic swap process.
            </p>
            <button
              onClick={lockEth}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Lock ETH
            </button>
            {ethTx && (
              <div className="text-sm text-gray-600">
                Transaction: {ethTx.hash}
                <br />
                Status: {ethTx.status}
                <br />
                Confirmations: {ethTx.confirmations}
              </div>
            )}
          </div>
        );

      case "btcLock":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Waiting for BTC Lock</h2>
            <p className="text-gray-600">
              Waiting for the maker to lock their Bitcoin...
            </p>
            {btcTx && (
              <div className="text-sm text-gray-600">
                Transaction: {btcTx.hash}
                <br />
                Status: {btcTx.status}
                <br />
                Confirmations: {btcTx.confirmations}
              </div>
            )}
          </div>
        );

      case "ethClaim":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Waiting for ETH Claim</h2>
            <p className="text-gray-600">
              Waiting for the maker to claim the locked ETH...
            </p>
          </div>
        );

      case "btcClaim":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Claim BTC</h2>
            <p className="text-gray-600">
              The maker has claimed the ETH. You can now claim the BTC.
            </p>
            <button
              onClick={() => claimBtc("raw_tx_here")} // TODO: Get actual raw tx
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Claim BTC
            </button>
          </div>
        );

      case "completed":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-green-500">
              Swap Completed!
            </h2>
            <p className="text-gray-600">
              The atomic swap has been successfully completed.
            </p>
          </div>
        );

      case "failed":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-red-500">Swap Failed</h2>
            <p className="text-gray-600">
              {error || "The swap has failed. You can try to refund your ETH."}
            </p>
            {order && (
              <button
                onClick={() => refundEth(order.id)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Refund ETH
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div>
      {/* Header with Wallet Connection */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Atomic Swap</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleConnectEth}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              ethConnected
                ? "bg-green-100 text-green-800"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {ethConnected ? "Connected ✓" : "Connect Wallet"}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-600 hover:text-gray-800"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {[
            { step: "init", label: "Start", icon: "🚀" },
            { step: "ethLock", label: "Lock ETH", icon: "🔒" },
            { step: "btcLock", label: "Lock BTC", icon: "₿" },
            { step: "ethClaim", label: "Claim ETH", icon: "🔑" },
            { step: "btcClaim", label: "Claim BTC", icon: "💎" },
            { step: "completed", label: "Done", icon: "✨" },
          ].map(({ step, label, icon }) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`text-2xl mb-2 ${
                  state.currentStep === step ? "opacity-100" : "opacity-30"
                }`}
              >
                {icon}
              </div>
              <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-lg p-6">{renderStep()}</div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentChainId={chainId}
      />

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-bold mb-2">Debug Info</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({ state, order, ethTx, btcTx }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
