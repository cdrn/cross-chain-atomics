import { useState, useEffect } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { RFQRequest, RFQQuote } from "../../types/rfq";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define interfaces to include quotes with each request
interface RequestWithQuotes extends Omit<RFQRequest, 'createdAt' | 'updatedAt'> {
  quotes: QuoteWithDateObjects[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Define a version of RFQQuote with Date objects instead of strings
interface QuoteWithDateObjects extends Omit<RFQQuote, 'createdAt' | 'updatedAt'> {
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function MyQuotesInterface() {
  const { address, isConnected, connect } = useWallet();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<RequestWithQuotes[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Define the fetch function outside the effect so we can reuse it
  const fetchMyRequests = async (isRefresh = false) => {
    if (!isConnected || !address) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      setError(null);
      
      // Fetch user's requests from the backend
      const response = await fetch(`${API_BASE_URL}/rfq/user/${address}/requests`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch your quote requests. Please try again.");
      }
      
      const data = await response.json();
      
      // Now fetch quotes for each request
      const requestsWithQuotes: RequestWithQuotes[] = [];
      
      // Use Promise.all to fetch quotes for all requests in parallel
      await Promise.all(
        data.map(async (request: RFQRequest) => {
          try {
            const quotesResponse = await fetch(`${API_BASE_URL}/rfq/request/${request.id}/quotes`);
            let quotes: RFQQuote[] = [];
            
            if (quotesResponse.ok) {
              quotes = await quotesResponse.json();
            }
            
            // Convert date strings to Date objects
            const processedRequest: RequestWithQuotes = {
              ...request,
              createdAt: new Date(request.createdAt),
              updatedAt: new Date(request.updatedAt),
              quotes: quotes.map(q => ({
                ...q,
                createdAt: new Date(q.createdAt),
                updatedAt: new Date(q.updatedAt)
              }) as QuoteWithDateObjects)
            };
            
            requestsWithQuotes.push(processedRequest);
          } catch (err) {
            console.error(`Error fetching quotes for request ${request.id}:`, err);
          }
        })
      );
      
      // Sort by most recent first
      requestsWithQuotes.sort((a, b) => 
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
      
      setMyRequests(requestsWithQuotes);
    } catch (err) {
      console.error("Error fetching quote history:", err);
      setError("Failed to load your quote history. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch data when component mounts or address/connection changes
  useEffect(() => {
    if (isConnected && address) {
      fetchMyRequests();
    }
  }, [address, isConnected]);
  
  const handleToggleRequest = (requestId: string) => {
    if (expandedRequestId === requestId) {
      setExpandedRequestId(null);
    } else {
      setExpandedRequestId(requestId);
    }
  };
  
  const handleAcceptQuote = async (quoteId: string) => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/rfq/quote/${quoteId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requesterAddress: address,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept quote");
      }

      // Refresh the requests
      // For now, just simulate success
      setMyRequests(prevRequests => 
        prevRequests.map(req => {
          if (req.quotes.some(q => q.id === quoteId)) {
            return {
              ...req,
              status: "filled",
              quotes: req.quotes.map(q => 
                q.id === quoteId ? { ...q, status: "accepted" } : q
              )
            };
          }
          return req;
        })
      );
    } catch (err) {
      console.error("Error accepting quote:", err);
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "quoted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Quoted
          </span>
        );
      case "filled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Filled
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Expired
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          View Your Quote History
        </h2>
        <p className="text-gray-600 mb-6">
          Connect your wallet to see your quote history and manage open quotes.
        </p>
        <button
          onClick={connect}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 5 C10 7 14 9 12 11 C 10 13 14 15 12 17" />
            <path d="M5 12 C7 10 9 14 11 12 C 13 10 15 14 17 12" />
          </svg>
          Connect Wallet
        </button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 opacity-75"></div>
            <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 3 C10 7 14 7 12 12 C 10 17 14 17 12 21" className="animate-spin-slow" />
                <path d="M3 12 C7 10 7 14 12 12 C 17 10 17 14 21 12" className="animate-spin-slow" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Your Quotes</h3>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Quote Requests</h1>
        <button
          onClick={() => fetchMyRequests(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="mr-1.5 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>
      
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
      
      {myRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Quote Requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't made any quote requests yet.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {myRequests.map((request) => (
              <li key={request.id} className="">
                <div 
                  className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50"
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleRequest(request.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {request.amount} {request.baseAsset} → {request.quoteAsset}
                      </p>
                      <div className="ml-3">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      {request.quotes.length > 0 && (
                        <div className="mr-4 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                          {request.quotes.length} Quote{request.quotes.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      <div>
                        <svg className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedRequestId === request.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        From {request.baseChain} to {request.quoteChain}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {request.createdAt && typeof request.createdAt.toLocaleString === 'function' 
                          ? request.createdAt.toLocaleString() 
                          : new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span className="capitalize">{request.direction}</span>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Quote List */}
                {expandedRequestId === request.id && (
                  <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-100">
                    {request.quotes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-3">
                        No quotes received yet for this request.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-500">Available Quotes</h4>
                        {request.quotes.map((quote) => {
                          // Add safety checks to prevent calculations with undefined/null values
                          const quoteAmount = typeof quote.quoteAmount === 'number' 
                            ? quote.quoteAmount 
                            : parseFloat(quote.quoteAmount as any) || 0;
                          
                          const baseAmount = typeof quote.baseAmount === 'number' 
                            ? quote.baseAmount 
                            : parseFloat(quote.baseAmount as any) || 1;  // Avoid division by zero
                          
                          const rate = quoteAmount / baseAmount;
                          
                          // Handle expiry time safely
                          const expiryTimeMs = quote.expiryTime 
                            ? (typeof quote.expiryTime === 'number' 
                                ? quote.expiryTime * 1000  // Convert seconds to ms
                                : new Date(quote.expiryTime).getTime()) 
                            : 0;
                          
                          const expiresIn = Math.max(0, Math.floor((expiryTimeMs - Date.now()) / 60000)); // minutes
                          const isExpired = expiresIn === 0;
                          
                          return (
                            <div 
                              key={quote.id} 
                              className={`border rounded-lg p-4 ${
                                quote.status === 'accepted' 
                                  ? 'border-green-200 bg-green-50' 
                                  : isExpired 
                                    ? 'border-gray-200 bg-gray-50 opacity-75'
                                    : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium text-gray-900">Rate</p>
                                    {quote.status === 'accepted' && (
                                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Accepted
                                      </span>
                                    )}
                                    {isExpired && quote.status === 'pending' && (
                                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xl font-semibold text-gray-900">
                                    {isNaN(rate) ? '0.000000' : rate.toFixed(6)} 
                                    <span className="ml-1 text-sm text-gray-500">
                                      {request.quoteAsset}/{request.baseAsset}
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-500">You will receive</p>
                                  <p className="text-lg font-medium text-gray-900">
                                    {quoteAmount.toFixed(6)} 
                                    <span className="ml-1 text-sm text-gray-500">{request.quoteAsset}</span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Maker ID</p>
                                  <p className="font-medium bg-indigo-50 text-indigo-800 rounded px-2 py-1 truncate">
                                    {typeof quote.solverId === 'string' ? 
                                      `${quote.solverId.slice(0, 6)}...${quote.solverId.slice(-4)}` :
                                      quote.solverId
                                    }
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-500">
                                    {quote.status === 'accepted' ? 'Accepted' : isExpired ? 'Expired' : 'Expires in'}
                                  </p>
                                  <p className={`font-medium ${isExpired ? 'text-gray-500' : expiresIn < 10 ? 'text-orange-600' : 'text-gray-600'}`}>
                                    {quote.status === 'accepted' && quote.updatedAt ? 
                                      (typeof quote.updatedAt === 'object' && quote.updatedAt.toLocaleString ? 
                                        quote.updatedAt.toLocaleString() : 
                                        new Date(quote.updatedAt).toLocaleString()) : 
                                      isExpired ? 
                                        'Expired' : 
                                        `${expiresIn} minute${expiresIn !== 1 ? 's' : ''}`
                                    }
                                  </p>
                                </div>
                              </div>
                              
                              {quote.status === 'pending' && !isExpired && (
                                <div className="flex justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        handleAcceptQuote(quote.id);
                                      } catch (err) {
                                        console.error("Error accepting quote:", err);
                                      }
                                    }}
                                    className="inline-flex items-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Accept Quote
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}