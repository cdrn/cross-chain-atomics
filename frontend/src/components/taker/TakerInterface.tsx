import { useState, useEffect } from "react";
import { QuoteRequestForm } from "./QuoteRequestForm";
import { QuoteList } from "./QuoteList";
import { useWallet } from "../../contexts/WalletContext";
import { RFQRequest, RFQQuote } from "../../types/rfq";

// Get the base URL without the /api/rfq part
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function TakerInterface() {
  const { address, isConnected } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<RFQRequest | null>(null);
  const [quotes, setQuotes] = useState<RFQQuote[]>([]);

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
  const generatePreimage = (): { preimage: string; hashlock: string } => {
    // Generate a random 32-byte preimage using crypto.getRandomValues
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    
    // Convert to hex string
    const preimage = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Calculate hashlock using SHA-256
    const hashBuffer = crypto.subtle.digestSync('SHA-256', new TextEncoder().encode(preimage));
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
      const { preimage, hashlock } = generatePreimage();
      
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
      
      // Initialize the atomic swap process with the order data
      // TODO: Navigate to swap execution page or initialize swap component
      console.log("Swap initiated with hashlock:", hashlock);
      console.log("Order data:", orderData);

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

      {!activeRequest ? (
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
