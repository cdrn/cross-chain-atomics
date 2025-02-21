import { useState } from "react";

interface QuoteRequestFormProps {
  onSubmit: (request: {
    baseAsset: string;
    quoteAsset: string;
    baseChain: string;
    quoteChain: string;
    amount: number;
  }) => void;
}

export function QuoteRequestForm({ onSubmit }: QuoteRequestFormProps) {
  const [formData, setFormData] = useState({
    baseAsset: "",
    quoteAsset: "",
    baseChain: "",
    quoteChain: "",
    amount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper function for select styling
  const selectClassName =
    "appearance-none block w-full px-4 py-3 rounded-lg bg-white border border-gray-300 shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent " +
    "text-base font-medium text-gray-900 cursor-pointer hover:border-gray-400 " +
    "transition-colors duration-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      {/* Base Asset Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">I want to trade</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Base Asset Selection */}
          <div className="relative">
            <label
              htmlFor="baseAsset"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Asset
            </label>
            <div className="relative">
              <select
                id="baseAsset"
                name="baseAsset"
                value={formData.baseAsset}
                onChange={handleChange}
                required
                className={selectClassName}
              >
                <option value="" disabled>
                  Select asset
                </option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Base Chain Selection */}
          <div className="relative">
            <label
              htmlFor="baseChain"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              On Chain
            </label>
            <div className="relative">
              <select
                id="baseChain"
                name="baseChain"
                value={formData.baseChain}
                onChange={handleChange}
                required
                className={selectClassName}
              >
                <option value="" disabled>
                  Select chain
                </option>
                <option value="bitcoin">Bitcoin Network</option>
                <option value="ethereum">Ethereum Network</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="relative">
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                id="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                step="any"
                min="0"
                placeholder="0.00"
                className="appearance-none block w-full px-4 py-3 rounded-lg bg-white border border-gray-300 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  text-base font-medium text-gray-900 placeholder-gray-400
                  transition-colors duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quote Asset Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">In exchange for</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Quote Asset Selection */}
          <div className="relative">
            <label
              htmlFor="quoteAsset"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Asset
            </label>
            <div className="relative">
              <select
                id="quoteAsset"
                name="quoteAsset"
                value={formData.quoteAsset}
                onChange={handleChange}
                required
                className={selectClassName}
              >
                <option value="" disabled>
                  Select asset
                </option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Quote Chain Selection */}
          <div className="relative">
            <label
              htmlFor="quoteChain"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              On Chain
            </label>
            <div className="relative">
              <select
                id="quoteChain"
                name="quoteChain"
                value={formData.quoteChain}
                onChange={handleChange}
                required
                className={selectClassName}
              >
                <option value="" disabled>
                  Select chain
                </option>
                <option value="bitcoin">Bitcoin Network</option>
                <option value="ethereum">Ethereum Network</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8">
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm
            text-base font-medium text-white bg-blue-600 hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Request Quote
        </button>
      </div>
    </form>
  );
}
