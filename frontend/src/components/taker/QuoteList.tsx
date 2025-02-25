import { RFQRequest, RFQQuote } from "../../types/rfq";

interface QuoteListProps {
  request: RFQRequest;
  quotes: RFQQuote[];
  onAcceptQuote: (quote: RFQQuote) => void;
}

export function QuoteList({ request, quotes, onAcceptQuote }: QuoteListProps) {
  return (
    <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-medium text-gray-900 mb-6">
        Active Request
      </h2>

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
        <p className="text-gray-500 text-center py-8">
          Waiting for quotes... This may take a few moments.
        </p>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Rate</p>
                  <p className="text-lg font-medium">
                    {(quote.quoteAmount / quote.baseAmount).toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-lg font-medium">{quote.baseAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Solver ID</p>
                  <p className="text-sm font-mono truncate">{quote.solverId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expires</p>
                  <p className="text-sm">
                    {new Date(quote.expiryTime * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onAcceptQuote(quote)}
                className="w-full bg-[#4F46E5] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-colors duration-200"
              >
                Accept Quote
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
