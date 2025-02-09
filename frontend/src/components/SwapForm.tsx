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
              You Pay (ETH)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled || loading}
              />
              <span className="text-sm font-medium text-gray-600">ETH</span>
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
              You Receive (BTC)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
                placeholder="0.0"
                step="0.00001"
                min="0"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled || loading}
              />
              <span className="text-sm font-medium text-gray-600">BTC</span>
            </div>
          </div>

          {/* Maker Address */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maker Address (ETH)
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
          className={`w-full py-3 px-4 rounded-lg font-medium ${
            disabled || loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          disabled={disabled || loading}
        >
          Start Swap
        </button>
      </form>
    </div>
  );
}
