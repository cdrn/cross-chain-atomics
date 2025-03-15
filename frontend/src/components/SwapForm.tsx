import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Get API base URL from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface SwapFormProps {
  onSubmit: (values: {
    ethAmount: string;
    btcAmount: string;
    makerAddress: string;
  }) => void;
  disabled?: boolean;
}

interface PriceData {
  price: string;
  timestamp: number;
  volume: {
    base: string;
    quote: string;
  };
}

interface VolatilityData {
  metrics: {
    "1h": { volatility: string; sampleCount: number };
    "24h": { volatility: string; sampleCount: number };
    "7d": { volatility: string; sampleCount: number };
  };
  timestamp: number;
  lastUpdated: number;
}

export function SwapForm({ onSubmit, disabled }: SwapFormProps) {
  const [ethAmount, setEthAmount] = useState("");
  const [btcAmount, setBtcAmount] = useState("");
  const [makerAddress, setMakerAddress] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData>();
  const [volatilityData, setVolatilityData] = useState<VolatilityData>();

  // Fetch price and volatility data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(undefined); // Clear previous errors

        // Fetch price data first
        const priceRes = await fetch(`${API_BASE_URL}/prices/ETH/BTC`);
        if (!priceRes.ok) {
          throw new Error("Failed to fetch market price data");
        }
        const price = await priceRes.json();
        setPriceData(price);

        // Fetch volatility data
        const volRes = await fetch(`${API_BASE_URL}/volatility/ETH/BTC`);
        if (volRes.status === 404) {
          // Handle missing volatility data gracefully
          setVolatilityData({
            metrics: {
              "1h": { volatility: "0.01", sampleCount: 0 },
              "24h": { volatility: "0.01", sampleCount: 0 },
              "7d": { volatility: "0.01", sampleCount: 0 },
            },
            timestamp: Date.now(),
            lastUpdated: Date.now(),
          });
          console.warn("Volatility data not available, using default values");
        } else if (!volRes.ok) {
          throw new Error("Failed to fetch volatility data");
        } else {
          const volatility = await volRes.json();
          setVolatilityData(volatility);
        }
      } catch (err) {
        console.error("Data fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update BTC amount when ETH amount changes
  useEffect(() => {
    if (ethAmount && priceData) {
      const ethValue = parseFloat(ethAmount);
      const rate = parseFloat(priceData.price);
      if (!isNaN(ethValue) && !isNaN(rate)) {
        // Price is ETH/BTC, so multiply directly
        setBtcAmount((ethValue * rate).toFixed(8));
      }
    }
  }, [ethAmount, priceData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethAmount || !btcAmount || !makerAddress) {
      setError("Please fill in all fields");
      return;
    }
    if (!ethers.isAddress(makerAddress)) {
      setError("Invalid maker address");
      return;
    }
    onSubmit({ ethAmount, btcAmount, makerAddress });
  };

  // Calculate premium using 24h volatility
  const calculatePremium = (): bigint => {
    if (!ethAmount || !volatilityData?.metrics["24h"].volatility) return 0n;

    const amount = ethers.parseEther(ethAmount);
    const volatility = parseFloat(volatilityData.metrics["24h"].volatility);

    // Basic premium calculation: amount * volatility
    // TODO: Use proper Black-Scholes from backend
    return (amount * BigInt(Math.floor(volatility * 100))) / 100n;
  };

  const premium = calculatePremium();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {loading && (
          <div className="text-sm text-blue-600">Loading market data...</div>
        )}

        <div className="space-y-4">
          {/* You Pay */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              You Pay
            </label>
            <div className="relative">
              <input
                type="text"
                value={ethAmount}
                onChange={(e) => {
                  // Allow only numbers and decimals
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    setEthAmount(value);
                  }
                }}
                placeholder="0.0"
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium text-right"
                disabled={disabled || loading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 font-medium">ETH</span>
              </div>
            </div>
          </div>

          {/* Market Rate Info */}
          {priceData && (
            <div className="text-sm text-gray-600 px-4">
              1 ETH = {parseFloat(priceData.price).toFixed(8)} BTC
              <br />
              <span className="text-xs">
                Last updated:{" "}
                {new Date(priceData.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Swap Direction Indicator */}
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-full p-2">↓</div>
          </div>

          {/* You Receive */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              You Receive
            </label>
            <div className="relative">
              <input
                type="text"
                value={btcAmount}
                onChange={(e) => {
                  // Allow only numbers and decimals
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    setBtcAmount(value);
                  }
                }}
                placeholder="0.0"
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium text-right"
                disabled={disabled || loading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 font-medium">BTC</span>
              </div>
            </div>
          </div>

          {/* Maker Address */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maker Address
            </label>
            <input
              type="text"
              value={makerAddress}
              onChange={(e) => setMakerAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Premium Info */}
        {ethAmount && volatilityData && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Premium</h3>
            <p className="text-sm text-blue-800">
              {ethers.formatEther(premium)} ETH
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {volatilityData.metrics["24h"].sampleCount === 0 ? (
                "Based on default volatility (historical data not yet available)"
              ) : (
                <>
                  Based on 24h volatility:{" "}
                  {volatilityData.metrics["24h"].volatility}%
                  <br />
                  Last updated:{" "}
                  {new Date(volatilityData.lastUpdated).toLocaleTimeString()}
                </>
              )}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
            disabled || loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-200 transform hover:scale-[1.01]"
          }`}
          disabled={disabled || loading}
        >
          {!disabled && !loading && (
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          )}
          Start Swap
        </button>
      </form>
    </div>
  );
}
