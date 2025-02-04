import { AssetPair, ExchangeAdapter, PriceTick } from "./types";
import { RequestManager, APIError } from "../../utils/request";

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
      // Fetch ticker data
      const [tickerRes, volumeRes] = await Promise.all([
        this.requestManager.request({
          url: `${this.baseUrl}/ticker/price`,
          params: { symbol },
        }),
        this.requestManager.request({
          url: `${this.baseUrl}/ticker/24hr`,
          params: { symbol },
        }),
      ]);

      return {
        price: parseFloat(tickerRes.data.price),
        volume24h: parseFloat(volumeRes.data.volume),
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
      // Get all symbols
      const symbols = pairs.map((pair) => this.formatSymbol(pair));

      // Fetch all tickers in one request
      const [tickersRes, volumesRes] = await Promise.all([
        this.requestManager.request({
          url: `${this.baseUrl}/ticker/price`,
        }),
        this.requestManager.request({
          url: `${this.baseUrl}/ticker/24hr`,
        }),
      ]);

      const priceMap = new Map<string, number>();
      const volumeMap = new Map<string, number>();

      // Index the responses
      tickersRes.data.forEach((ticker: { symbol: string; price: string }) => {
        if (symbols.includes(ticker.symbol)) {
          priceMap.set(ticker.symbol, parseFloat(ticker.price));
        }
      });

      volumesRes.data.forEach((ticker: { symbol: string; volume: string }) => {
        if (symbols.includes(ticker.symbol)) {
          volumeMap.set(ticker.symbol, parseFloat(ticker.volume));
        }
      });

      // Combine the data
      const result = new Map<string, PriceTick>();
      const timestamp = new Date();

      pairs.forEach((pair) => {
        const symbol = this.formatSymbol(pair);
        const price = priceMap.get(symbol);
        const volume = volumeMap.get(symbol);

        if (price !== undefined && volume !== undefined) {
          result.set(symbol, {
            price,
            volume24h: volume,
            timestamp,
          });
        } else {
          console.warn(`Missing data for symbol: ${symbol}`);
        }
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
