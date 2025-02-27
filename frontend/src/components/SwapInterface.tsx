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
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-200 transform hover:scale-[1.01] flex items-center justify-center"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Lock ETH
          </button>
        )}

        {state.currentStep === "failed" && order && (
          <button
            onClick={() => refundEth(order.id)}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200 transform hover:scale-[1.01] flex items-center justify-center"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
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
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              ethConnected
                ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-sm"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-200 transform hover:scale-[1.01]"
            }`}
          >
            {ethConnected ? (
              <>
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected
              </>
            ) : (
              <>
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Connect Wallet
              </>
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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
