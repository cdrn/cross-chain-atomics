import { useState, useEffect } from "react";
import { useAtomicSwap } from "../../hooks/useAtomicSwap";
import { RFQOrder } from "../../types/rfq";
import { SwapOrder } from "../../types";

interface SwapExecutionProps {
  order: RFQOrder;
}

export function SwapExecution({ order }: SwapExecutionProps) {
  const [preimage, setPreimage] = useState<string | null>(null);
  
  // Convert RFQOrder to SwapOrder format for the useAtomicSwap hook
  const swapOrder: SwapOrder = {
    id: order.id,
    maker: order.makerAddress,
    taker: order.takerAddress,
    makerChain: order.baseChain === "bitcoin" ? "bitcoin" : "ethereum",
    takerChain: order.quoteChain === "bitcoin" ? "bitcoin" : "ethereum",
    makerAmount: order.baseAmount,
    takerAmount: order.quoteAmount,
    expiryTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    premium: 0, // Set appropriate premium from order
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const {
    state,
    error,
    connectWallet,
    initializeSwap,
    lockEth,
    watchBtcLock,
    watchEthClaim,
    claimBtc,
    refundEth,
  } = useAtomicSwap();

  // Load preimage from localStorage
  useEffect(() => {
    const storedPreimage = localStorage.getItem(`preimage_${order.id}`);
    if (storedPreimage) {
      setPreimage(storedPreimage);
    }
  }, [order.id]);

  // Initialize the swap when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await connectWallet();
        await initializeSwap(swapOrder);
      } catch (error) {
        console.error("Failed to initialize swap:", error);
      }
    };

    initialize();
  }, []);

  // Execute steps based on current state
  useEffect(() => {
    const executeStep = async () => {
      try {
        if (state.currentStep === "ethLock") {
          await lockEth();
        } else if (state.currentStep === "btcLock") {
          // Set up watcher for Bitcoin transaction
          // NOTE: You'll need a Bitcoin address to watch
          const btcAddress = ""; // This should come from maker
          watchBtcLock(btcAddress);
        } else if (state.currentStep === "ethClaim") {
          // Start watching for ETH claim
          watchEthClaim(order.id);
        } else if (state.currentStep === "btcClaim" && preimage) {
          // Generate Bitcoin claim transaction (would require Bitcoin library integration)
          // This is a placeholder - actual implementation would use bitcoinjs-lib
          const rawTx = ""; // Generate using preimage
          await claimBtc(rawTx);
        }
      } catch (error) {
        console.error(`Error executing step ${state.currentStep}:`, error);
      }
    };

    executeStep();
  }, [state.currentStep]);

  const renderStepStatus = (step: string, completed: boolean) => {
    return (
      <div className="flex items-center mb-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
            completed
              ? "bg-green-500"
              : state.currentStep === step
              ? "bg-blue-500"
              : "bg-gray-300"
          }`}
        >
          {completed ? (
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <span className="text-white font-medium">
              {step === "ethLock"
                ? "1"
                : step === "btcLock"
                ? "2"
                : step === "ethClaim"
                ? "3"
                : "4"}
            </span>
          )}
        </div>
        <div>
          <p
            className={`font-medium ${
              completed
                ? "text-green-600"
                : state.currentStep === step
                ? "text-blue-600"
                : "text-gray-600"
            }`}
          >
            {step === "ethLock"
              ? "Lock ETH"
              : step === "btcLock"
              ? "Lock BTC"
              : step === "ethClaim"
              ? "ETH Claim"
              : "BTC Claim"}
          </p>
          <p className="text-sm text-gray-500">
            {step === "ethLock"
              ? "Lock your ETH in the contract"
              : step === "btcLock"
              ? "Wait for maker to lock BTC"
              : step === "ethClaim"
              ? "Maker claims ETH using secret"
              : "Claim BTC using revealed secret"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Swap Execution</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg shadow-sm">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Swap Progress</h3>
        
        {renderStepStatus("ethLock", state.ethLockConfirmed)}
        {renderStepStatus("btcLock", state.btcLockConfirmed)}
        {renderStepStatus("ethClaim", state.ethClaimConfirmed)}
        {renderStepStatus("btcClaim", state.btcClaimConfirmed)}

        {state.currentStep === "completed" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium">
              Swap completed successfully!
            </p>
          </div>
        )}

        {state.currentStep === "failed" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">
              Swap failed. Please check the error message.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Swap Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-medium">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Hash Lock</p>
            <p className="font-medium">{order.hashlock.substring(0, 20)}...</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Base Chain</p>
            <p className="font-medium">{order.baseChain}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quote Chain</p>
            <p className="font-medium">{order.quoteChain}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Base Amount</p>
            <p className="font-medium">{order.baseAmount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quote Amount</p>
            <p className="font-medium">{order.quoteAmount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}