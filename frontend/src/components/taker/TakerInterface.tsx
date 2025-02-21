import { useState, useEffect } from "react";
import { QuoteRequestForm } from "./QuoteRequestForm";
import { QuoteList } from "./QuoteList";
import { useWallet } from "../../contexts/WalletContext";
import { RFQRequest, RFQQuote } from "../../types/rfq";

export function TakerInterface() {
  const { address, isConnected } = useWallet();
  const [activeRequest, setActiveRequest] = useState<RFQRequest | null>(null);
  const [quotes, setQuotes] = useState<RFQQuote[]>([]);
  const [error, setError] = useState<string>();

  // Poll for quotes when there's an active request
  useEffect(() => {
    if (!activeRequest) return;

    const pollQuotes = async () => {
      try {
        const response = await fetch(`/api/rfq/quotes/${activeRequest.id}`);
        if (!response.ok) throw new Error("Failed to fetch quotes");
        const data = await response.json();
        setQuotes(data);
      } catch (err) {
        console.error("Error polling quotes:", err);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollQuotes, 5000);
    pollQuotes(); // Initial poll

    return () => clearInterval(interval);
  }, [activeRequest]);

  const handleCreateRequest = async (
    request: Omit<RFQRequest, "id" | "status" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (!address) throw new Error("Please connect your wallet first");

      const response = await fetch("/api/rfq/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, requesterAddress: address }),
      });

      if (!response.ok) throw new Error("Failed to create request");

      const data = await response.json();
      setActiveRequest(data);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      if (!address) throw new Error("Please connect your wallet first");

      const response = await fetch(`/api/rfq/quotes/${quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterAddress: address }),
      });

      if (!response.ok) throw new Error("Failed to accept quote");

      const data = await response.json();
      // TODO: Navigate to swap execution page
      console.log("Quote accepted, order created:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    }
  };

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Quote Request Form */}
      {isConnected && !activeRequest && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Request a Quote
            </h2>
            <QuoteRequestForm onSubmit={handleCreateRequest} />
          </div>
        </div>
      )}

      {/* Active Request and Quotes */}
      {activeRequest && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Active Request
            </h2>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Request ID: {activeRequest.id}
              </p>
              <p className="text-sm text-gray-500">
                Status: {activeRequest.status}
              </p>
              <p className="text-sm text-gray-500">
                Amount: {activeRequest.amount.toString()}{" "}
                {activeRequest.baseAsset}
              </p>
            </div>
            <QuoteList quotes={quotes} onAcceptQuote={handleAcceptQuote} />
          </div>
        </div>
      )}
    </div>
  );
}
