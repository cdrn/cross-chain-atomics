import { useState } from "react";
import { RFQRequest } from "../../types/rfq";

interface RequestListProps {
  requests: RFQRequest[];
  onSubmitQuote: (requestId: string, price: number) => void;
}

interface QuoteFormState {
  requestId: string | null;
  price: string;
}

export function RequestList({ requests, onSubmitQuote }: RequestListProps) {
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({
    requestId: null,
    price: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.requestId || !quoteForm.price) return;

    onSubmitQuote(quoteForm.requestId, parseFloat(quoteForm.price));
    setQuoteForm({ requestId: null, price: "" });
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
                    className="flex items-center gap-2 justify-end"
                  >
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        value={quoteForm.price}
                        onChange={(e) =>
                          setQuoteForm((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                        placeholder="Price"
                        className="block w-24 rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        step="any"
                        min="0"
                        required
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">
                          {request.quoteAsset}
                        </span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQuoteForm({ requestId: null, price: "" })
                      }
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() =>
                      setQuoteForm({ requestId: request.id, price: "" })
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
