import { useState, useEffect } from "react";
import { RFQRequest } from "../../types/rfq";

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface RequestListProps {
  requests: RFQRequest[];
  onSubmitQuote: (requestId: string, price: number) => void;
}

interface QuoteFormState {
  requestId: string | null;
  price: string;
  useIndicative: boolean;
}

interface IndicativePricing {
  price: string;
  premium: string;
  timestamp: number;
}

export function RequestList({ requests, onSubmitQuote }: RequestListProps) {
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({
    requestId: null,
    price: "",
    useIndicative: true
  });
  const [indicativePrices, setIndicativePrices] = useState<Record<string, IndicativePricing>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({});

  // Fetch indicative price from the Black-Scholes endpoint when a request is selected
  useEffect(() => {
    if (!quoteForm.requestId) return;
    
    const fetchIndicativePrice = async (request: RFQRequest) => {
      try {
        setLoadingPrices(prev => ({ ...prev, [request.id]: true }));
        
        // Call the Black-Scholes pricing endpoint with request details
        const timeToExpiryHours = 24; // 24 hour default expiry time
        const response = await fetch(
          `${API_BASE_URL}/pricing/${request.baseAsset}/${request.quoteAsset}?amount=${request.amount}&timeToExpiryHours=${timeToExpiryHours}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch pricing data");
        }
        
        const pricingData = await response.json();
        
        const pricing: IndicativePricing = {
          price: pricingData.price,
          premium: pricingData.premium,
          timestamp: pricingData.timestamp
        };
        
        setIndicativePrices(prev => ({ ...prev, [request.id]: pricing }));
        
        // If useIndicative is true, set the price field to the indicative price
        if (quoteForm.useIndicative) {
          setQuoteForm(prev => ({ ...prev, price: pricingData.price }));
        }
      } catch (err) {
        console.error("Error fetching indicative price:", err);
        // Fallback to reasonable default values if the API call fails
        const fallbackPrice = request.baseAsset === "ETH" ? "0.065" : "15.5";
        const fallbackPremium = (parseFloat(request.amount.toString()) * 0.01).toFixed(6);
        
        const fallbackPricing: IndicativePricing = {
          price: fallbackPrice,
          premium: fallbackPremium,
          timestamp: Date.now()
        };
        
        setIndicativePrices(prev => ({ ...prev, [request.id]: fallbackPricing }));
        
        if (quoteForm.useIndicative) {
          setQuoteForm(prev => ({ ...prev, price: fallbackPrice }));
        }
      } finally {
        setLoadingPrices(prev => ({ ...prev, [request.id]: false }));
      }
    };
    
    const selectedRequest = requests.find(r => r.id === quoteForm.requestId);
    if (selectedRequest) {
      fetchIndicativePrice(selectedRequest);
    }
  }, [quoteForm.requestId, quoteForm.useIndicative, requests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.requestId || !quoteForm.price) return;

    onSubmitQuote(quoteForm.requestId, parseFloat(quoteForm.price));
    setQuoteForm({ requestId: null, price: "", useIndicative: true });
  };
  
  const handleToggleIndicative = () => {
    setQuoteForm(prev => {
      // If turning on indicative pricing and we have the data, update the price
      if (!prev.useIndicative && prev.requestId && indicativePrices[prev.requestId]) {
        return { 
          ...prev, 
          useIndicative: true,
          price: indicativePrices[prev.requestId].price
        };
      }
      return { ...prev, useIndicative: !prev.useIndicative };
    });
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No active requests
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Wait for new requests to appear or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
            >
              Requester
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Pair
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Amount
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Chains
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-500">
                      {request.requesterAddress.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">
                      {request.requesterAddress.slice(0, 6)}...
                      {request.requesterAddress.slice(-4)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="font-medium text-gray-900">
                  {request.baseAsset}/{request.quoteAsset}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="font-medium text-gray-900">
                  {request.amount} {request.baseAsset}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {request.baseChain}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {request.quoteChain}
                  </span>
                </div>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                {quoteForm.requestId === request.id ? (
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col items-end gap-3"
                  >
                    {/* Price field with loading indicator */}
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={quoteForm.price}
                        onChange={(e) => {
                          // Allow only numbers and decimals
                          const value = e.target.value;
                          if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                            setQuoteForm((prev) => ({
                              ...prev,
                              price: value,
                              // If user manually changes price, turn off indicative pricing
                              useIndicative: value === indicativePrices[request.id]?.price ? prev.useIndicative : false
                            }));
                          }
                        }}
                        placeholder={loadingPrices[request.id] ? "Loading..." : "Price"}
                        className={`block w-full sm:w-48 rounded-md border-gray-300 pr-16 pl-3 p-2 text-right focus:border-blue-500 focus:ring-blue-500 text-sm bg-white font-medium text-gray-900 ${loadingPrices[request.id] ? 'animate-pulse' : ''}`}
                        required
                        disabled={loadingPrices[request.id]}
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm font-medium">
                          {request.quoteAsset}
                        </span>
                      </div>
                    </div>
                    
                    {/* Use indicative pricing checkbox */}
                    <div className="flex items-center mb-2">
                      <input
                        id={`use-indicative-${request.id}`}
                        type="checkbox" 
                        checked={quoteForm.useIndicative}
                        onChange={handleToggleIndicative}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`use-indicative-${request.id}`} 
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Use indicative pricing
                      </label>
                    </div>
                    
                    {/* Indicative price info */}
                    {indicativePrices[request.id] && (
                      <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 w-full">
                        <div className="flex justify-between">
                          <span>Indicative price:</span>
                          <span>{indicativePrices[request.id].price} {request.quoteAsset}</span>
                        </div>
                        {parseFloat(indicativePrices[request.id].premium) > 0 && (
                          <div className="flex justify-between mt-1">
                            <span>Premium:</span>
                            <span>{indicativePrices[request.id].premium} {request.baseAsset}</span>
                          </div>
                        )}
                        <div className="mt-1 text-xs text-blue-600">
                          Based on Black-Scholes volatility model
                        </div>
                        <div className="text-xs text-blue-600">
                          Last updated: {new Date(indicativePrices[request.id].timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        Submit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setQuoteForm({ requestId: null, price: "", useIndicative: true })
                        }
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() =>
                      setQuoteForm({ requestId: request.id, price: "", useIndicative: true })
                    }
                    className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quote
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
