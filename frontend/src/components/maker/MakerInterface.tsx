import { useState, useEffect } from "react";
import { RequestList } from "./RequestList";
import { useWallet } from "../../contexts/WalletContext";
import { RFQRequest } from "../../types/rfq";
import { EthereumService } from "../../services/ethereum";
import { BitcoinService } from "../../services/bitcoin";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function MakerInterface() {
  const { address, isConnected } = useWallet();
  const [requests, setRequests] = useState<RFQRequest[]>([]);
  const [error, setError] = useState<string>();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [solverId, setSolverId] = useState<string>("");
  const [ethService] = useState(() => new EthereumService());
  const [btcService] = useState(() => new BitcoinService());
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Check if maker is registered
  useEffect(() => {
    if (!address) return;

    const checkRegistration = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rfq/solver/${address}`);
        if (response.ok) {
          const data = await response.json();
          setIsRegistered(true);
          setSolverId(data.id); // Store the solver ID for later use
        } else {
          setIsRegistered(false);
          setSolverId("");
        }
      } catch (err) {
        console.error("Error checking solver registration:", err);
      }
    };

    checkRegistration();
  }, [address]);

  // Poll for active requests and accepted quotes (orders)
  useEffect(() => {
    if (!isConnected || !isRegistered) return;

    const pollRequests = async () => {
      try {
        // Fetch active requests
        const requestsResponse = await fetch(`${API_BASE_URL}/rfq/requests/active`);
        if (!requestsResponse.ok) throw new Error("Failed to fetch requests");
        const requestsData = await requestsResponse.json();
        setRequests(requestsData);
        
        // Fetch any active orders that this maker is involved in
        if (address) {
          const ordersResponse = await fetch(`${API_BASE_URL}/rfq/solver/${solverId}/orders`);
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            // Filter for pending orders that need action
            const pendingOrders = ordersData.filter((order: any) => order.status === "pending");
            setActiveOrders(pendingOrders);
            
            // Connect to Ethereum for each order that involves ETH
            if (pendingOrders.length > 0) {
              await ethService.connect();
            }
          }
        }
      } catch (err) {
        console.error("Error polling data:", err);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollRequests, 5000);
    pollRequests(); // Initial poll

    return () => clearInterval(interval);
  }, [isConnected, isRegistered, address, solverId, ethService]);

  const handleRegister = async () => {
    try {
      if (!address) throw new Error("Please connect your wallet first");
      setIsRegistering(true);
      setError(undefined);

      const response = await fetch(`${API_BASE_URL}/rfq/solver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Maker " + address.slice(0, 6),
          address,
          supportedPairs: [
            {
              baseAsset: "ETH",
              quoteAsset: "BTC",
              chain: "ethereum",
            },
            {
              baseAsset: "BTC",
              quoteAsset: "ETH",
              chain: "bitcoin",
            },
          ],
          active: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to register as solver");

      setIsRegistered(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register as solver"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubmitQuote = async (requestId: string, price: number) => {
    try {
      if (!address) throw new Error("Please connect your wallet first");
      if (!solverId) throw new Error("Solver ID not found. Please try registering again");

      const request = requests.find((r) => r.id === requestId);
      if (!request) throw new Error("Request not found");

      // Calculate base and quote amounts based on the price and direction
      const baseAmount = parseFloat(request.amount.toString());
      const quoteAmount = baseAmount * price;

      setError(undefined);
      const response = await fetch(`${API_BASE_URL}/rfq/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          solverId, // Use the actual solver ID retrieved from the registration
          baseAmount,
          quoteAmount,
          premium: 0, // Set a default premium
          expiryTime: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit quote");
      } else {
        // Clear the error and indicate success
        setError(undefined);
        // Refresh the requests list
        const updatedRequests = requests.filter(r => r.id !== requestId);
        setRequests(updatedRequests);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quote");
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to the Maker Interface
        </h2>
        <p className="text-gray-600 mb-4">
          Connect your wallet to start providing liquidity
        </p>
      </div>
    );
  }

  // Handle on-chain commitments for atomic swaps
  const handleLockBitcoin = async (order: any) => {
    try {
      setError(undefined);
      
      // In a real application, this would:
      // 1. Create a P2SH transaction based on the hashlock 
      // 2. Sign the transaction with your Bitcoin private key
      // 3. Broadcast the transaction to the Bitcoin network
      // 4. Update the order status in the backend
      
      // Mock Bitcoin transaction
      const mockBtcTxHash = "0x" + Math.random().toString(16).substring(2, 42);
      
      // Update order status on the backend
      const response = await fetch(`${API_BASE_URL}/rfq/order/${order.id}/btclock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: mockBtcTxHash,
          solverAddress: address
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update order with BTC lock transaction");
      }
      
      // Remove this order from the active orders list
      setActiveOrders(prev => prev.filter(o => o.id !== order.id));
      
    } catch (err) {
      console.error("Error locking Bitcoin:", err);
      setError(err instanceof Error ? err.message : "Failed to lock Bitcoin");
    }
  };
  
  // Handle claiming ETH with the preimage
  const handleClaimEth = async (order: any, preimage: string) => {
    try {
      setError(undefined);
      
      // We would need the Ethereum swap ID here
      const swapId = `0x${Math.random().toString(16).slice(2, 42)}`; // Mock ID
      
      // Claim the ETH using the preimage
      const tx = await ethService.claimSwap(swapId, preimage);
      
      // Update order status on the backend
      if (tx.status === "confirmed") {
        const response = await fetch(`${API_BASE_URL}/rfq/order/${order.id}/ethclaim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash,
            solverAddress: address
          })
        });
        
        if (!response.ok) {
          throw new Error("Failed to update order with ETH claim transaction");
        }
        
        // Remove this order from the active orders list
        setActiveOrders(prev => prev.filter(o => o.id !== order.id));
      }
    } catch (err) {
      console.error("Error claiming ETH:", err);
      setError(err instanceof Error ? err.message : "Failed to claim ETH");
    }
  };

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Registration */}
      {!isRegistered && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Become a Liquidity Provider
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Register as a maker to start providing liquidity for cross-chain
                atomic swaps. You'll be able to view and quote requests for
                BTC-ETH pairs.
              </p>
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-200 transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Register Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Active Orders Requiring Action */}
      {isRegistered && activeOrders.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Pending Orders Requiring Action
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {activeOrders.length} Pending
              </span>
            </div>
            
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-medium truncate">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {order.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Asset Pair</p>
                      <p className="font-medium">{order.baseAsset}/{order.quoteAsset}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium">
                        {order.baseAmount} {order.baseAsset}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    {order.baseChain === "bitcoin" && !order.baseTxHash && (
                      <button
                        onClick={() => handleLockBitcoin(order)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Lock Bitcoin
                      </button>
                    )}
                    
                    {order.quoteChain === "ethereum" && order.baseTxHash && !order.quoteTxHash && (
                      <button
                        onClick={() => handleClaimEth(order, "0x12345")} // Placeholder preimage
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Claim ETH
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Requests */}
      {isRegistered && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Active Requests
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Registered Maker
              </span>
            </div>
            <RequestList
              requests={requests}
              onSubmitQuote={handleSubmitQuote}
            />
          </div>
        </div>
      )}
    </div>
  );
}
