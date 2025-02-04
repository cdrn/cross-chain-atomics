export interface ExchangePriceData {
  timestamp: Date;
  exchange: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  volumeBase: number;
  volumeQuote: number;
}

export interface ConsolidatedPrice {
  timestamp: Date;
  baseAsset: string;
  quoteAsset: string;
  vwap: number;
  totalVolumeBase: number;
  totalVolumeQuote: number;
  numExchanges: number;
}

// Binance API types
export interface BinanceTickerResponse {
  symbol: string;
  price: string;
  volume: string;
  quoteVolume: string;
}

// Coinbase API types
export interface CoinbaseTickerResponse {
  trade_id: number;
  price: string;
  size: string;
  volume: string;
  time: string;
  bid: string;
  ask: string;
  volume_30day: string;
}
