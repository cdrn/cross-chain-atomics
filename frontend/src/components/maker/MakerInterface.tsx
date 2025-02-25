import { useState, useEffect } from "react";
import { RequestList } from "./RequestList";
import { useWallet } from "../../contexts/WalletContext";
import { RFQRequest } from "../../types/rfq";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function MakerInterface() {
  const { address, isConnected } = useWallet();
  const [requests, setRequests] = useState<RFQRequest[]>([]);
  const [error, setError] = useState<string>();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check if maker is registered
  useEffect(() => {
    if (!address) return;

    const checkRegistration = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rfq/solver/${address}`);
        setIsRegistered(response.ok);
      } catch (err) {
        console.error("Error checking solver registration:", err);
      }
    };

    checkRegistration();
  }, [address]);

  // Poll for active requests
  useEffect(() => {
    if (!isConnected || !isRegistered) return;

    const pollRequests = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rfq/requests/active`);
        if (!response.ok) throw new Error("Failed to fetch requests");
        const data = await response.json();
        setRequests(data);
      } catch (err) {
        console.error("Error polling requests:", err);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollRequests, 5000);
    pollRequests(); // Initial poll

    return () => clearInterval(interval);
  }, [isConnected, isRegistered]);

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
          solverId: address, // Using address as solverId
          baseAmount,
          quoteAmount,
          premium: 0, // Set a default premium
          expiryTime: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        }),
      });

      if (!response.ok) throw new Error("Failed to submit quote");
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

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
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
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering ? "Registering..." : "Register Now"}
              </button>
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
