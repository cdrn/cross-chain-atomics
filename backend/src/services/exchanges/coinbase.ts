import { AssetPair, ExchangeAdapter, PriceTick } from "./types";
import { RequestManager, APIError } from "../../utils/request";

interface CoinbaseTickerResponse {
  price: string;
  volume: string;
  time: string;
}

export class CoinbaseAdapter implements ExchangeAdapter {
  private readonly baseUrl: string;
  private readonly requestManager: RequestManager;
  // Map of pairs that need to be reversed (BTC-ETH -> ETH-BTC)
  private readonly reversedPairs: Set<string> = new Set([
    "BTC-ETH", // Use ETH-BTC instead
  ]);

  constructor(
    baseUrl = "https://api.exchange.coinbase.com",
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
    const normalSymbol = `${pair.baseAsset}-${pair.quoteAsset}`.toUpperCase();
    if (this.reversedPairs.has(normalSymbol)) {
      // Reverse the pair for Coinbase's format
      return `${pair.quoteAsset}-${pair.baseAsset}`.toUpperCase();
    }
    return normalSymbol;
  }

  parseSymbol(symbol: string): AssetPair {
    const [baseAsset, quoteAsset] = symbol.split("-");
    if (!baseAsset || !quoteAsset) {
      throw new Error(`Unable to parse symbol: ${symbol}`);
    }
    const normalSymbol = `${baseAsset}-${quoteAsset}`;
    if (this.reversedPairs.has(normalSymbol)) {
      // Reverse the pair back to our standard format
      return { baseAsset: quoteAsset, quoteAsset: baseAsset };
    }
    return { baseAsset, quoteAsset };
  }

  async fetchPrice(pair: AssetPair): Promise<PriceTick> {
    const symbol = this.formatSymbol(pair);
    const isReversed = this.reversedPairs.has(
      `${pair.baseAsset}-${pair.quoteAsset}`.toUpperCase()
    );

    try {
      const response =
        await this.requestManager.request<CoinbaseTickerResponse>({
          url: `${this.baseUrl}/products/${symbol}/ticker`,
        });

      const price = parseFloat(response.data.price);
      const volume = parseFloat(response.data.volume);

      if (isReversed) {
        // For reversed pairs:
        // - Price needs to be inverted (e.g., if ETH-BTC = 0.02843, then BTC-ETH = 1/0.02843)
        // - Volume needs to be in terms of the original base asset
        return {
          price: 1 / price,
          volume24h: volume * price, // Convert volume to original base asset
          timestamp: new Date(response.data.time),
        };
      }

      return {
        price,
        volume24h: volume,
        timestamp: new Date(response.data.time),
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
      // Fetch prices for each pair in parallel
      const responses = await Promise.all(
        pairs.map((pair) => this.fetchPrice(pair))
      );

      const priceMap = new Map<string, PriceTick>();
      pairs.forEach((pair, index) => {
        const symbol = `${pair.baseAsset}-${pair.quoteAsset}`.toUpperCase();
        priceMap.set(symbol, responses[index]);
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
