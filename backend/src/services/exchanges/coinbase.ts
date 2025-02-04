import { AssetPair, ExchangeAdapter, PriceTick } from "./types";
import { RequestManager, APIError } from "../../utils/request";

interface CoinbaseTickerResponse {
  price: string;
  time: string;
}

interface CoinbaseStatsResponse {
  volume: string;
}

export class CoinbaseAdapter implements ExchangeAdapter {
  private readonly baseUrl: string;
  private readonly requestManager: RequestManager;

  constructor(
    baseUrl = "https://api.pro.coinbase.com",
    retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      shouldRetry: (error: any) => {
        // Coinbase has specific rate limit handling
        if (!error.response) return true;
        const status = error.response.status;
        if (status === 429) {
          // Get retry-after header
          const retryAfter = error.response.headers["retry-after"];
          if (retryAfter) {
            setTimeout(() => {}, parseInt(retryAfter) * 1000);
          }
          return true;
        }
        return status >= 500 && status < 600;
      },
    }
  ) {
    this.baseUrl = baseUrl;
    this.requestManager = new RequestManager(retryConfig);
  }

  getName(): string {
    return "coinbase";
  }

  formatSymbol(pair: AssetPair): string {
    return `${pair.baseAsset}-${pair.quoteAsset}`.toUpperCase();
  }

  parseSymbol(symbol: string): AssetPair {
    const [baseAsset, quoteAsset] = symbol.split("-");
    if (!baseAsset || !quoteAsset) {
      throw new Error(`Unable to parse symbol: ${symbol}`);
    }
    return { baseAsset, quoteAsset };
  }

  async fetchPrice(pair: AssetPair): Promise<PriceTick> {
    const symbol = this.formatSymbol(pair);

    try {
      // Fetch ticker data
      const [statsRes, tickerRes] = await Promise.all([
        this.requestManager.request<CoinbaseStatsResponse>({
          url: `${this.baseUrl}/products/${symbol}/stats`,
        }),
        this.requestManager.request<CoinbaseTickerResponse>({
          url: `${this.baseUrl}/products/${symbol}/ticker`,
        }),
      ]);

      return {
        price: parseFloat(tickerRes.data.price),
        volume24h: parseFloat(statsRes.data.volume),
        timestamp: new Date(tickerRes.data.time),
      };
    } catch (error) {
      if (error instanceof APIError) {
        if (error.statusCode === 404) {
          throw new Error(`Trading pair not found: ${symbol}`);
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
      // Unfortunately, Coinbase doesn't have a true batch endpoint
      // We'll need to fetch each pair individually, but with retries and rate limiting
      const requests = pairs.map(async (pair) => {
        const symbol = this.formatSymbol(pair);
        try {
          const [statsRes, tickerRes] = await Promise.all([
            this.requestManager.request<CoinbaseStatsResponse>({
              url: `${this.baseUrl}/products/${symbol}/stats`,
            }),
            this.requestManager.request<CoinbaseTickerResponse>({
              url: `${this.baseUrl}/products/${symbol}/ticker`,
            }),
          ]);

          return {
            symbol,
            tick: {
              price: parseFloat(tickerRes.data.price),
              volume24h: parseFloat(statsRes.data.volume),
              timestamp: new Date(tickerRes.data.time),
            },
          };
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} from Coinbase:`, error);
          return null;
        }
      });

      const results = await Promise.all(requests);
      const priceMap = new Map<string, PriceTick>();

      results.forEach((result) => {
        if (result) {
          priceMap.set(result.symbol, result.tick);
        }
      });

      if (priceMap.size === 0) {
        throw new Error("No valid price data received from Coinbase");
      }

      return priceMap;
    } catch (error) {
      if (error instanceof APIError) {
        if (error.statusCode === 429) {
          throw new Error("Rate limit exceeded");
        }
      }
      throw error;
    }
  }
}
