export interface ExchangeConfig {
  baseUrl: string;
  wsUrl: string;
  name: string;
}

export interface PriceTick {
  price: number;
  volume24h: number;
  timestamp: Date;
}

export interface AssetPair {
  baseAsset: string;
  quoteAsset: string;
}

export interface ExchangeAdapter {
  getName(): string;
  formatSymbol(pair: AssetPair): string;
  parseSymbol(symbol: string): AssetPair;
  fetchPrice(pair: AssetPair): Promise<PriceTick>;
  fetchBatchPrices(pairs: AssetPair[]): Promise<Map<string, PriceTick>>;
}
