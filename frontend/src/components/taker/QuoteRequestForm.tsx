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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="any"
              min="0"
              required
              className="w-full bg-white py-3 px-4 rounded-lg border border-gray-200 text-gray-900 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
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
          className="w-full bg-[#4F46E5] text-white text-lg font-medium py-4 px-6 rounded-xl hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-colors duration-200"
        >
          Request Quote
        </button>
      </div>
    </form>
  );
}
