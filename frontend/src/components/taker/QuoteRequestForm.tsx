import { useState } from "react";

interface QuoteRequestFormProps {
  onSubmit: (request: {
    baseAsset: string;
    quoteAsset: string;
    baseChain: string;
    quoteChain: string;
    amount: number;
    direction: "buy" | "sell";
    timeToLive: number;
  }) => void;
}

export function QuoteRequestForm({ onSubmit }: QuoteRequestFormProps) {
  const [formData, setFormData] = useState({
    baseAsset: "ETH",
    quoteAsset: "BTC",
    baseChain: "ethereum",
    quoteChain: "bitcoin",
    amount: "",
    direction: "sell" as "buy" | "sell",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      timeToLive: 3600, // 1 hour
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    // Don't handle amount changes here - they are handled in the input directly
    if (name !== 'amount') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const selectClass =
    "appearance-none w-full bg-white py-3 px-4 pr-8 rounded-lg border border-gray-200 text-gray-900 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const labelClass = "block text-gray-600 text-base mb-2";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 space-y-8">
        {/* Base Asset Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-medium text-gray-900">
            I want to trade
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Asset</label>
              <div className="relative">
                <select
                  name="baseAsset"
                  value={formData.baseAsset}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M7 7l3 3 3-3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Chain</label>
              <div className="relative">
                <select
                  name="baseChain"
                  value={formData.baseChain}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="bitcoin">Bitcoin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M7 7l3 3 3-3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Amount</label>
            <div className="relative">
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={(e) => {
                  // Allow only numbers and decimals
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    setFormData((prev) => ({ ...prev, amount: value }));
                  }
                }}
                placeholder="0.00"
                required
                className="w-full bg-white py-3 px-4 pr-12 rounded-lg border border-gray-200 text-gray-900 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-gray-500 font-medium">{formData.baseAsset}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Asset Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-medium text-gray-900">
            In exchange for
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Asset</label>
              <div className="relative">
                <select
                  name="quoteAsset"
                  value={formData.quoteAsset}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M7 7l3 3 3-3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Chain</label>
              <div className="relative">
                <select
                  name="quoteChain"
                  value={formData.quoteChain}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="bitcoin">Bitcoin</option>
                  <option value="ethereum">Ethereum</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M7 7l3 3 3-3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Direction</label>
            <div className="relative">
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="sell">Sell</option>
                <option value="buy">Buy</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <svg
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M7 7l3 3 3-3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-medium py-4 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transition-all duration-200 transform hover:scale-[1.01] flex items-center justify-center"
        >
          <svg className="mr-2 h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Request Quote
        </button>
      </div>
    </form>
  );
}
