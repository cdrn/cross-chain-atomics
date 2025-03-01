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

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Base Asset</p>
            <p className="text-lg font-medium">{request.baseAsset}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quote Asset</p>
            <p className="text-lg font-medium">{request.quoteAsset}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-lg font-medium">{request.amount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Direction</p>
            <p className="text-lg font-medium capitalize">
              {request.direction}
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
