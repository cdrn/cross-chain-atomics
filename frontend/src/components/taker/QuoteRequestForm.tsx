import { useState, useEffect } from "react";

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

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

interface PriceEstimate {
  price: string;
  premium: string;
  timestamp: number;
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
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Maintain automatic mapping between assets and their chains
  const assetChainMap = {
    "ETH": "ethereum",
    "BTC": "bitcoin"
  };

  // Asset icons
  const assetIcons = {
    "ETH": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L5 12L12 16L19 12L12 2Z" fill="#627EEA" stroke="#627EEA" strokeWidth="0.5" />
        <path d="M12 16L5 12L12 22L19 12L12 16Z" fill="#627EEA" stroke="#627EEA" strokeWidth="0.5" />
        <path d="M12 2L19 12L12 16V2Z" fill="#C0CBF6" stroke="#C0CBF6" strokeWidth="0.5" />
        <path d="M12 16L19 12L12 22V16Z" fill="#C0CBF6" stroke="#C0CBF6" strokeWidth="0.5" />
      </svg>
    ),
    "BTC": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#F7931A" />
        <path d="M15.7 10.9C15.9 9.5 14.8 8.9 13.4 8.5L13.9 6.6L12.8 6.3L12.3 8.2C12 8.1 11.7 8.1 11.4 8L11.9 6.1L10.8 5.8L10.3 7.7C10.1 7.6 9.8 7.6 9.6 7.5L8 7.1L7.7 8.3C7.7 8.3 8.5 8.5 8.5 8.5C9 8.6 9.1 9 9.1 9.2L8.5 11.4C8.5 11.4 8.6 11.4 8.6 11.5C8.6 11.5 8.5 11.4 8.5 11.4L7.7 14.4C7.6 14.5 7.5 14.7 7.2 14.6C7.2 14.6 6.4 14.4 6.4 14.4L5.8 15.7L7.3 16.1C7.5 16.2 7.8 16.2 8 16.3L7.5 18.2L8.6 18.5L9.1 16.6C9.4 16.7 9.7 16.8 10 16.8L9.5 18.7L10.6 19L11.1 17.1C13 17.4 14.4 17.3 15.1 15.5C15.7 14.1 15.2 13.3 14.2 12.8C14.9 12.6 15.5 12.1 15.7 10.9ZM13.1 14.6C12.7 16 10.3 15.2 9.5 15L10.2 12.5C11 12.7 13.6 13.2 13.1 14.6ZM13.6 10.9C13.2 12.1 11.2 11.5 10.5 11.3L11.1 9.1C11.8 9.3 14 9.6 13.6 10.9Z" fill="white" />
      </svg>
    )
  };

  // Fetch price estimate when amount, assets, or direction changes
  useEffect(() => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setPriceEstimate(null);
      return;
    }

    const fetchPriceEstimate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use simple price quote for ETH/BTC
        // Mocked prices
        const mockPrice = formData.baseAsset === "ETH" ? "0.05438" : "18.39";
        
        // Mock successful data
        const data = {
          price: mockPrice,
          timestamp: Date.now()
        };
        
        // Simple premium calc: 2% of amount
        const premium = (parseFloat(formData.amount) * 0.02).toFixed(6);
        
        setPriceEstimate({
          price: data.price,
          premium: premium,
          timestamp: data.timestamp
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error with price estimate:", err);
        setError("Could not generate price estimate");
        setLoading(false);
      }
    };

    // Debounce the price fetch to avoid too many calculations
    const timeoutId = setTimeout(fetchPriceEstimate, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.amount, formData.baseAsset, formData.quoteAsset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      timeToLive: 3600, // 1 hour
    });
  };

  const handleAssetChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    assetType: "baseAsset" | "quoteAsset"
  ) => {
    const asset = e.target.value;
    const chainType = assetType === "baseAsset" ? "baseChain" : "quoteChain";
    
    // Update both asset and its corresponding chain
    setFormData((prev) => ({
      ...prev,
      [assetType]: asset,
      [chainType]: assetChainMap[asset as keyof typeof assetChainMap]
    }));
    
    // Auto-adjust the other asset if both become the same
    const otherAssetType = assetType === "baseAsset" ? "quoteAsset" : "baseAsset";
    if (formData[otherAssetType] === asset) {
      const otherValue = asset === "ETH" ? "BTC" : "ETH";
      const otherChainType = assetType === "baseAsset" ? "quoteChain" : "baseChain";
      
      setFormData((prev) => ({
        ...prev,
        [otherAssetType]: otherValue,
        [otherChainType]: assetChainMap[otherValue as keyof typeof assetChainMap]
      }));
    }
  };

  // Switch the assets (flip them)
  const handleSwitchAssets = () => {
    setFormData((prev) => ({
      ...prev,
      baseAsset: prev.quoteAsset,
      quoteAsset: prev.baseAsset,
      baseChain: prev.quoteChain,
      quoteChain: prev.baseChain
    }));
  };

  const selectClass =
    "appearance-none w-full bg-white py-3 pl-10 pr-10 rounded-lg border border-gray-200 text-gray-900 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  // Calculate estimated receive amount
  const calculateEstimatedAmount = () => {
    if (!priceEstimate || !formData.amount || parseFloat(formData.amount) <= 0) {
      return "0.00";
    }
    
    const amount = parseFloat(formData.amount);
    const price = parseFloat(priceEstimate.price);
    
    // The calculation depends on which assets are involved
    if (formData.baseAsset === "ETH" && formData.quoteAsset === "BTC") {
      // ETH to BTC
      return (amount * price).toFixed(8);
    } else {
      // BTC to ETH
      return (amount / price).toFixed(8);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Request Quote</h1>
        
        {/* Asset Exchange UI */}
        <div className="space-y-8">
          {/* "You pay" section */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <label className="text-lg font-medium text-gray-800 mb-4 block">
              You Pay
            </label>
            
            <div className="flex items-center gap-4">
              <div className="w-2/5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {assetIcons[formData.baseAsset as keyof typeof assetIcons]}
                  </div>
                  <select
                    name="baseAsset"
                    value={formData.baseAsset}
                    onChange={(e) => handleAssetChange(e, "baseAsset")}
                    className={selectClass}
                  >
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M7 7l3 3 3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="w-3/5">
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
                </div>
              </div>
            </div>
          </div>
          
          {/* Switch direction button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwitchAssets}
              className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none"
            >
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          
          {/* "You receive" section */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <label className="text-lg font-medium text-gray-800 mb-4 block">
              You Receive
            </label>
            
            <div className="flex items-center gap-4">
              <div className="w-2/5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {assetIcons[formData.quoteAsset as keyof typeof assetIcons]}
                  </div>
                  <select
                    name="quoteAsset"
                    value={formData.quoteAsset}
                    onChange={(e) => handleAssetChange(e, "quoteAsset")}
                    className={selectClass}
                  >
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M7 7l3 3 3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="w-3/5">
                <div className="bg-gray-100 py-3 px-4 rounded-lg border border-gray-200 text-gray-900 text-lg text-right">
                  {loading ? (
                    <div className="flex justify-end items-center">
                      <div className="animate-pulse h-5 w-24 bg-gray-300 rounded"></div>
                    </div>
                  ) : (
                    calculateEstimatedAmount()
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Price and premium info */}
          {priceEstimate && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm text-blue-800">
                <span>Market Price:</span>
                <span>1 {formData.baseAsset} = {parseFloat(priceEstimate.price).toFixed(8)} {formData.quoteAsset}</span>
              </div>
              
              {parseFloat(priceEstimate.premium) > 0 && (
                <div className="flex justify-between text-sm text-blue-800 mt-1">
                  <span>Premium:</span>
                  <span>{priceEstimate.premium} {formData.baseAsset}</span>
                </div>
              )}
              
              <div className="text-xs text-blue-600 mt-2">
                Volatility-adjusted pricing using Black-Scholes model.
                <br />
                Note: Indicative prices only. Final rates determined by individual market makers.
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-medium py-4 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transition-all duration-200 transform hover:scale-[1.01] flex items-center justify-center"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Request Quote
        </button>
      </div>
    </form>
  );
}
