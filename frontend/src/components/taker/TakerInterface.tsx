import { useState, useEffect } from "react";
import { QuoteRequestForm } from "./QuoteRequestForm";
import { QuoteList } from "./QuoteList";
import { SwapExecution } from "./SwapExecution";
import { useWallet } from "../../contexts/WalletContext";
import { RFQRequest, RFQQuote } from "../../types/rfq";

// Get the base URL without the /api/rfq part
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function TakerInterface() {
  const { address, isConnected } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<RFQRequest | null>(null);
  const [quotes, setQuotes] = useState<RFQQuote[]>([]);
  const [showExecution, setShowExecution] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  useEffect(() => {
    let pollInterval: number | null = null;

    if (activeRequest) {
      const pollQuotes = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/rfq/request/${activeRequest.id}/quotes`
          );
          if (!response.ok) throw new Error("Failed to fetch quotes");
          const data = await response.json();
          setQuotes(data);
        } catch (err) {
          console.error("Error polling quotes:", err);
        }
      };

      pollQuotes(); // Initial poll
      pollInterval = window.setInterval(pollQuotes, 5000);
    }

    return () => {
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }, [activeRequest]);

  const handleCreateRequest = async (formData: {
    baseAsset: string;
    quoteAsset: string;
    baseChain: string;
    quoteChain: string;
    amount: number;
    direction: "buy" | "sell";
    timeToLive: number;
  }) => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/rfq/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          requesterAddress: address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create RFQ request");
      }

      const data = await response.json();
      setActiveRequest(data);
      setQuotes([]);
    } catch (err) {
      console.error("Error creating request:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create RFQ request"
      );
    }
  };

  // Generate preimage and hashlock for atomic swap
  const generatePreimage = async (): Promise<{ preimage: string; hashlock: string }> => {
    // Generate a random 32-byte preimage using crypto.getRandomValues
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    
    // Convert to hex string
    const preimage = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Calculate hashlock using SHA-256 (use async digest instead of digestSync)
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(preimage));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashlock = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { preimage, hashlock };
  };

  const handleAcceptQuote = async (quote: RFQQuote) => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError(null);
      
      // Generate the preimage and hashlock
      const { preimage, hashlock } = await generatePreimage();
      
      // Store preimage in localStorage (for demo purposes - in a real app, use more secure storage)
      localStorage.setItem(`preimage_${quote.id}`, preimage);
      
      const response = await fetch(
        `${API_BASE_URL}/rfq/quote/${quote.id}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requesterAddress: address,
            hashlock: hashlock,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept quote");
      }
      
      // Get the order data which should include the hashlock
      const orderData = await response.json();
      
      // Show the SwapExecution component to initiate the swap
      setShowExecution(true);
      setCurrentOrder(orderData);
      
      // Clear the active request and quotes after accepting
      setActiveRequest(null);
      setQuotes([]);
    } catch (err) {
      console.error("Error accepting quote:", err);
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    }
  };
  
  const handleCancelRequest = () => {
    // In a real implementation, we would call an API to cancel the request
    // For now, just clear the local state
    setActiveRequest(null);
    setQuotes([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      {showExecution && currentOrder ? (
        <div>
          <button 
            onClick={() => setShowExecution(false)}
            className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Quotes
          </button>
          
          <SwapExecution order={currentOrder} />
        </div>
      ) : !activeRequest ? (
        <QuoteRequestForm onSubmit={handleCreateRequest} />
      ) : (
        <QuoteList
          request={activeRequest}
          quotes={quotes}
          onAcceptQuote={handleAcceptQuote}
          onCancelRequest={handleCancelRequest}
        />
      )}
    </div>
  );
}
