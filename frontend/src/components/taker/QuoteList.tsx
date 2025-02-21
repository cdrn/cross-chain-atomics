import { RFQQuote } from "../../types/rfq";

interface QuoteListProps {
  quotes: RFQQuote[];
  onAcceptQuote: (quoteId: string) => void;
}

export function QuoteList({ quotes, onAcceptQuote }: QuoteListProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No quotes available yet. Please wait for makers to respond.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Available Quotes</h3>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Maker
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Total
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Expiry
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {quotes.map((quote) => {
              const expiryDate = new Date(quote.expiresAt);
              const now = new Date();
              const isExpired = expiryDate < now;

              return (
                <tr key={quote.id}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {quote.makerAddress.slice(0, 6)}...
                    {quote.makerAddress.slice(-4)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {quote.price} {quote.quoteAsset}/{quote.baseAsset}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {(
                      parseFloat(quote.price.toString()) *
                      parseFloat(quote.amount.toString())
                    ).toFixed(8)}{" "}
                    {quote.quoteAsset}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {isExpired ? (
                      <span className="text-red-600">Expired</span>
                    ) : (
                      <span>
                        {Math.max(
                          0,
                          Math.floor(
                            (expiryDate.getTime() - now.getTime()) / 1000
                          )
                        )}
                        s
                      </span>
                    )}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => onAcceptQuote(quote.id)}
                      disabled={isExpired}
                      className={`text-blue-600 hover:text-blue-900 ${
                        isExpired ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Accept
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
