import { useState } from "react";
import { useAtomicSwap } from "../hooks/useAtomicSwap";
import { Settings } from "./Settings";
import { SwapForm } from "./SwapForm";
import { ethers } from "ethers";

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

  const handleSwapSubmit = async (values: {
    ethAmount: string;
    btcAmount: string;
    makerAddress: string;
  }) => {
    const mockOrder = {
      id: "0x" + Math.random().toString(16).substring(2),
      maker: values.makerAddress,
      makerChain: "bitcoin" as const,
      takerChain: "ethereum" as const,
      makerAmount: ethers.parseUnits(values.btcAmount, 8).toString(), // BTC amount in sats
      takerAmount: ethers.parseEther(values.ethAmount).toString(), // ETH amount in wei
      expiryTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      premium: (ethers.parseEther(values.ethAmount) / 10n).toString(), // 10% premium
      status: "open" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await initializeSwap(mockOrder);
  };

  const renderSwapProgress = () => {
    if (state.currentStep === "init") {
      return null;
    }

    return (
      <div className="mt-8 space-y-6">
        <div className="flex justify-between">
          {[
            { step: "ethLock", label: "Lock ETH", emoji: "🔒" },
            { step: "btcLock", label: "Lock BTC", emoji: "₿" },
            { step: "ethClaim", label: "Claim ETH", emoji: "🔑" },
            { step: "btcClaim", label: "Claim BTC", emoji: "💎" },
            { step: "completed", label: "Done", emoji: "✨" },
          ].map(({ step, label, emoji }) => (
            <div
              key={step}
              className={`flex flex-col items-center ${
                state.currentStep === step ? "opacity-100" : "opacity-50"
              }`}
            >
              <span className="text-2xl mb-1">{emoji}</span>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        )}

        {ethTx && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">ETH Transaction</h3>
            <div className="text-sm text-gray-600">
              <p>Hash: {ethTx.hash}</p>
              <p>Status: {ethTx.status}</p>
              <p>Confirmations: {ethTx.confirmations}</p>
            </div>
          </div>
        )}

        {btcTx && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">BTC Transaction</h3>
            <div className="text-sm text-gray-600">
              <p>Hash: {btcTx.hash}</p>
              <p>Status: {btcTx.status}</p>
              <p>Confirmations: {btcTx.confirmations}</p>
            </div>
          </div>
        )}

        {state.currentStep === "ethLock" && (
          <button
            onClick={lockEth}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Lock ETH
          </button>
        )}

        {state.currentStep === "failed" && order && (
          <button
            onClick={() => refundEth(order.id)}
            className="w-full py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Refund ETH
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header with Wallet Connection */}
      <div className="flex justify-between items-center mb-8">
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

      {/* Swap Form */}
      <SwapForm
        onSubmit={handleSwapSubmit}
        disabled={!ethConnected || state.currentStep !== "init"}
      />

      {/* Swap Progress */}
      {renderSwapProgress()}

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentChainId={chainId}
      />
    </div>
  );
}
