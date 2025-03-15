import { RFQRequest, RFQQuote } from "../../types/rfq";

interface QuoteListProps {
  request: RFQRequest;
  quotes: RFQQuote[];
  onAcceptQuote: (quote: RFQQuote) => void;
  onCancelRequest?: () => void;
}

export function QuoteList({ request, quotes, onAcceptQuote, onCancelRequest }: QuoteListProps) {
  return (
    <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-gray-900">
          Active Request
        </h2>
        {onCancelRequest && (
          <button 
            onClick={onCancelRequest}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        )}
      </div>

      <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Request Details
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Asset You're Trading</p>
            <div className="flex items-center">
              {request.baseAsset === "ETH" ? (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L5 12L12 16L19 12L12 2Z" fill="#627EEA" stroke="#627EEA" strokeWidth="0.5" />
                  <path d="M12 16L5 12L12 22L19 12L12 16Z" fill="#627EEA" stroke="#627EEA" strokeWidth="0.5" />
                  <path d="M12 2L19 12L12 16V2Z" fill="#C0CBF6" stroke="#C0CBF6" strokeWidth="0.5" />
                  <path d="M12 16L19 12L12 22V16Z" fill="#C0CBF6" stroke="#C0CBF6" strokeWidth="0.5" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#F7931A" />
                  <path d="M15.7 10.9C15.9 9.5 14.8 8.9 13.4 8.5L13.9 6.6L12.8 6.3L12.3 8.2C12 8.1 11.7 8.1 11.4 8L11.9 6.1L10.8 5.8L10.3 7.7C10.1 7.6 9.8 7.6 9.6 7.5L8 7.1L7.7 8.3C7.7 8.3 8.5 8.5 8.5 8.5C9 8.6 9.1 9 9.1 9.2L8.5 11.4C8.5 11.4 8.6 11.4 8.6 11.5C8.6 11.5 8.5 11.4 8.5 11.4L7.7 14.4C7.6 14.5 7.5 14.7 7.2 14.6C7.2 14.6 6.4 14.4 6.4 14.4L5.8 15.7L7.3 16.1C7.5 16.2 7.8 16.2 8 16.3L7.5 18.2L8.6 18.5L9.1 16.6C9.4 16.7 9.7 16.8 10 16.8L9.5 18.7L10.6 19L11.1 17.1C13 17.4 14.4 17.3 15.1 15.5C15.7 14.1 15.2 13.3 14.2 12.8C14.9 12.6 15.5 12.1 15.7 10.9ZM13.1 14.6C12.7 16 10.3 15.2 9.5 15L10.2 12.5C11 12.7 13.6 13.2 13.1 14.6ZM13.6 10.9C13.2 12.1 11.2 11.5 10.5 11.3L11.1 9.1C11.8 9.3 14 9.6 13.6 10.9Z" fill="white" />
                </svg>
              )}
              <p className="text-lg font-medium">{request.baseAsset}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Asset You'll Receive</p>
            <div className="flex items-center">
              {request.quoteAsset === "ETH" ? (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L5 12L12 16L19 12L12 2Z" fill="#627EEA" stroke="#627EEA" strokeWidth="0.5" />
                  <path d="M12 16L5 12L12 22L19 12L12 16Z" fill="#627EEA" stroke="#627EEA" strokeWidth="0.5" />
                  <path d="M12 2L19 12L12 16V2Z" fill="#C0CBF6" stroke="#C0CBF6" strokeWidth="0.5" />
                  <path d="M12 16L19 12L12 22V16Z" fill="#C0CBF6" stroke="#C0CBF6" strokeWidth="0.5" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#F7931A" />
                  <path d="M15.7 10.9C15.9 9.5 14.8 8.9 13.4 8.5L13.9 6.6L12.8 6.3L12.3 8.2C12 8.1 11.7 8.1 11.4 8L11.9 6.1L10.8 5.8L10.3 7.7C10.1 7.6 9.8 7.6 9.6 7.5L8 7.1L7.7 8.3C7.7 8.3 8.5 8.5 8.5 8.5C9 8.6 9.1 9 9.1 9.2L8.5 11.4C8.5 11.4 8.6 11.4 8.6 11.5C8.6 11.5 8.5 11.4 8.5 11.4L7.7 14.4C7.6 14.5 7.5 14.7 7.2 14.6C7.2 14.6 6.4 14.4 6.4 14.4L5.8 15.7L7.3 16.1C7.5 16.2 7.8 16.2 8 16.3L7.5 18.2L8.6 18.5L9.1 16.6C9.4 16.7 9.7 16.8 10 16.8L9.5 18.7L10.6 19L11.1 17.1C13 17.4 14.4 17.3 15.1 15.5C15.7 14.1 15.2 13.3 14.2 12.8C14.9 12.6 15.5 12.1 15.7 10.9ZM13.1 14.6C12.7 16 10.3 15.2 9.5 15L10.2 12.5C11 12.7 13.6 13.2 13.1 14.6ZM13.6 10.9C13.2 12.1 11.2 11.5 10.5 11.3L11.1 9.1C11.8 9.3 14 9.6 13.6 10.9Z" fill="white" />
                </svg>
              )}
              <p className="text-lg font-medium">{request.quoteAsset}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Amount</p>
            <p className="text-xl font-semibold text-gray-900">{request.amount} {request.baseAsset}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Request Status</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="mr-1.5 h-2 w-2 bg-green-500 rounded-full"></span>
              Active
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Request ID</p>
            <p className="text-sm font-medium bg-gray-100 text-gray-700 rounded px-2 py-1 truncate">
              {request.id.slice(0, 12)}...{request.id.slice(-8)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Created</p>
            <p className="text-sm text-gray-700">
              {new Date(request.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-medium text-gray-900 mb-4">
        Available Quotes
      </h3>

      {quotes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Quotes</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Liquidity providers are reviewing your request. Quotes should arrive shortly.
            </p>
            <div className="mt-4 inline-flex space-x-1">
              <span className="animate-bounce inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
              <span className="animate-bounce inline-block w-2 h-2 bg-indigo-600 rounded-full" style={{ animationDelay: '0.2s' }}></span>
              <span className="animate-bounce inline-block w-2 h-2 bg-indigo-600 rounded-full" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Sort quotes by best rate first */}
          {quotes.sort((a, b) => {
            const rateA = a.quoteAmount / a.baseAmount;
            const rateB = b.quoteAmount / b.baseAmount;
            return request.direction === "sell" ? rateB - rateA : rateA - rateB;
          }).map((quote, index) => {
            const rate = quote.quoteAmount / quote.baseAmount;
            const isBestRate = index === 0;
            const expiresIn = Math.max(0, Math.floor((quote.expiryTime * 1000 - Date.now()) / 60000)); // minutes
            return (
              <div
                key={quote.id}
                className={`border rounded-lg p-5 mb-4 transition-all ${
                  isBestRate 
                    ? 'border-indigo-200 bg-indigo-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {isBestRate && (
                  <div className="text-xs font-medium text-indigo-600 uppercase mb-2 flex items-center">
                    <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Best Rate Available
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Rate</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">
                        {rate.toFixed(6)}
                      </p>
                      <p className="ml-1 text-sm text-gray-500">
                        {request.quoteAsset}/{request.baseAsset}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">You will receive</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {quote.quoteAmount.toFixed(6)} 
                      <span className="ml-1 text-sm text-gray-500">{request.quoteAsset}</span>
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-sm text-gray-500">Maker ID</p>
                    <p className="text-sm font-medium bg-indigo-50 text-indigo-800 rounded px-2 py-1 truncate">
                      {quote.solverId.slice(0, 8)}...{quote.solverId.slice(-6)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Expires in</p>
                    <p className={`text-sm font-medium ${expiresIn < 10 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {expiresIn} minute{expiresIn !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {isBestRate && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                        <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        Recommended
                      </span>
                    )}
                    {quote.premium > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Premium: {quote.premium.toFixed(6)} {request.baseAsset}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onAcceptQuote(quote)}
                    className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                      isBestRate
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-700'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {isBestRate ? (
                      <>
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept Best Quote
                      </>
                    ) : (
                      'Accept Quote'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
