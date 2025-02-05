import { AssetPair, ExchangeAdapter, PriceTick } from "./types";
import { RequestManager, APIError } from "../../utils/request";

interface BinanceTickerResponse {
  symbol: string;
  lastPrice: string;
  volume: string;
}

export class BinanceAdapter implements ExchangeAdapter {
  private readonly baseUrl: string;
  private readonly requestManager: RequestManager;

  constructor(
    baseUrl = "https://api.binance.com/api/v3",
    retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    }
  ) {
    this.baseUrl = baseUrl;
    this.requestManager = new RequestManager(retryConfig);
  }

  getName(): string {
    return "binance";
  }

  formatSymbol(pair: AssetPair): string {
    return `${pair.baseAsset}${pair.quoteAsset}`.toUpperCase();
  }

  parseSymbol(symbol: string): AssetPair {
    // Binance common quote assets
    const quoteAssets = ["USDT", "BTC", "ETH", "BNB", "BUSD"];

    // Find the first matching quote asset
    const quoteAsset = quoteAssets.find((quote) => symbol.endsWith(quote));
    if (!quoteAsset) {
      throw new Error(`Unable to parse symbol: ${symbol}`);
    }

    const baseAsset = symbol.slice(0, -quoteAsset.length);
    return {
      baseAsset,
      quoteAsset,
    };
  }

  async fetchPrice(pair: AssetPair): Promise<PriceTick> {
    const symbol = this.formatSymbol(pair);

    try {
      const response = await this.requestManager.request<BinanceTickerResponse>(
        {
          url: `${this.baseUrl}/ticker/24hr`,
          params: { symbol },
        }
      );

      return {
        price: parseFloat(response.data.lastPrice),
        volume24h: parseFloat(response.data.volume),
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific Binance error codes
        if (error.statusCode === 400) {
          throw new Error(`Invalid symbol: ${symbol}`);
        }
        if (error.statusCode === 429) {
          throw new Error("Rate limit exceeded");
        }
      }
      throw error;
    }
  }

  async fetchBatchPrices(pairs: AssetPair[]): Promise<Map<string, PriceTick>> {
    try {
      // For Binance, we'll fetch prices individually since their batch endpoint is unreliable
      const responses = await Promise.all(
        pairs.map((pair) => this.fetchPrice(pair))
      );

      const result = new Map<string, PriceTick>();
      pairs.forEach((pair, index) => {
        const symbol = this.formatSymbol(pair);
        result.set(symbol, responses[index]);
      });

      if (result.size === 0) {
        throw new Error("No valid price data received from Binance");
      }

      return result;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific Binance error codes
        if (error.statusCode === 429) {
          throw new Error("Rate limit exceeded");
        }
      }
      throw error;
    }
  }
}
