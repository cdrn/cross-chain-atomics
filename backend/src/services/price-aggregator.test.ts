import { PriceAggregatorService } from "./price-aggregator";
import { prismaMock } from "../test/setup";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { ExchangePrice, ConsolidatedPrice, Prisma } from "@prisma/client";
import { BinanceAdapter } from "./exchanges/binance";
import { CoinbaseAdapter } from "./exchanges/coinbase";
import { PriceTick, AssetPair, ExchangeAdapter } from "./exchanges/types";
import { Decimal } from "@prisma/client/runtime/library";

jest.mock("./exchanges/binance");
jest.mock("./exchanges/coinbase");

interface MockCreateManyCall {
  data: Array<{
    baseAsset: string;
    quoteAsset: string;
    price: number;
    volume24h: number;
    exchange: string;
    timestamp: Date;
  }>;
}

interface MockCreateCall {
  data: {
    baseAsset: string;
    quoteAsset: string;
    vwap: number;
    numExchanges: number;
    timestamp: Date;
  };
}

describe("PriceAggregatorService", () => {
  let service: PriceAggregatorService;
  let mockBinanceAdapter: jest.Mocked<BinanceAdapter>;
  let mockCoinbaseAdapter: jest.Mocked<CoinbaseAdapter>;

  beforeEach(() => {
    const mockAdapter = (name: string, symbolSeparator: string | RegExp) => {
      const adapter = {
        baseUrl:
          name === "binance"
            ? "https://api.binance.com/api/v3"
            : "https://api.coinbase.com/api/v3/brokerage",
        requestManager: {} as any,
        getName: () => name,
        fetchPrice: () =>
          Promise.resolve({
            price: 0,
            volume24h: 0,
            timestamp: new Date(),
          }),
        fetchBatchPrices: () => Promise.resolve(new Map<string, PriceTick>()),
        parseSymbol: (symbol: string) => {
          const [baseAsset, quoteAsset] = symbol.split(symbolSeparator);
          return { baseAsset, quoteAsset };
        },
        formatSymbol: (pair: AssetPair) =>
          name === "binance"
            ? `${pair.baseAsset}${pair.quoteAsset}`
            : `${pair.baseAsset}-${pair.quoteAsset}`,
      };

      return {
        ...adapter,
        getName: jest.fn(adapter.getName),
        fetchPrice: jest.fn(adapter.fetchPrice),
        fetchBatchPrices: jest.fn(adapter.fetchBatchPrices),
        parseSymbol: jest.fn(adapter.parseSymbol),
        formatSymbol: jest.fn(adapter.formatSymbol),
      };
    };

    mockBinanceAdapter = mockAdapter(
      "binance",
      /(?=[A-Z])/
    ) as unknown as jest.Mocked<BinanceAdapter>;
    mockCoinbaseAdapter = mockAdapter(
      "coinbase",
      "-"
    ) as unknown as jest.Mocked<CoinbaseAdapter>;

    jest.mocked(BinanceAdapter).mockImplementation(() => mockBinanceAdapter);
    jest.mocked(CoinbaseAdapter).mockImplementation(() => mockCoinbaseAdapter);

    service = new PriceAggregatorService();
    jest.clearAllMocks();

    // Mock successful responses
    const btcEthPrice: PriceTick = {
      price: 20.5,
      volume24h: 100.0,
      timestamp: new Date(),
    };

    const ethUsdtPrice: PriceTick = {
      price: 2500.0,
      volume24h: 1000.0,
      timestamp: new Date(),
    };

    const btcUsdtPrice: PriceTick = {
      price: 50000.0,
      volume24h: 500.0,
      timestamp: new Date(),
    };

    const binancePrices = new Map<string, PriceTick>([
      ["BTCETH", btcEthPrice],
      ["ETHUSDT", ethUsdtPrice],
      ["BTCUSDT", btcUsdtPrice],
    ]);

    const coinbasePrices = new Map<string, PriceTick>([
      ["BTC-ETH", { ...btcEthPrice, price: 20.6, volume24h: 150.0 }],
      ["ETH-USDT", { ...ethUsdtPrice, price: 2505.0, volume24h: 1200.0 }],
      ["BTC-USDT", { ...btcUsdtPrice, price: 50100.0, volume24h: 600.0 }],
    ]);

    mockBinanceAdapter.fetchBatchPrices.mockResolvedValue(binancePrices);
    mockCoinbaseAdapter.fetchBatchPrices.mockResolvedValue(coinbasePrices);

    // Mock findMany to return test data
    prismaMock.exchangePrice.findMany.mockResolvedValue([
      {
        timestamp: new Date(),
        exchange: "binance",
        baseAsset: "BTC",
        quoteAsset: "ETH",
        price: new Decimal(20.5),
        volumeBase: new Decimal(100.0),
        volumeQuote: new Decimal(2050.0),
      },
      {
        timestamp: new Date(),
        exchange: "coinbase",
        baseAsset: "BTC",
        quoteAsset: "ETH",
        price: new Decimal(20.6),
        volumeBase: new Decimal(150.0),
        volumeQuote: new Decimal(3090.0),
      },
    ]);
  });

  describe("fetchAndStorePrices", () => {
    it("should fetch prices from both exchanges and store consolidated data", async () => {
      await service.fetchAndStorePrices();

      // Verify raw price storage
      expect(prismaMock.exchangePrice.createMany).toHaveBeenCalled();
      const createManyCall = (
        prismaMock.exchangePrice.createMany as unknown as {
          mock: { calls: any[][] };
        }
      ).mock.calls[0][0] as MockCreateManyCall;
      expect(createManyCall.data).toHaveLength(6); // 3 pairs × 2 exchanges

      // Verify consolidated price calculations
      expect(prismaMock.consolidatedPrice.create).toHaveBeenCalledTimes(3);

      // Verify VWAP calculation for BTC-ETH
      const btcEthCall = (
        prismaMock.consolidatedPrice.create as unknown as {
          mock: { calls: any[][] };
        }
      ).mock.calls[0][0] as MockCreateCall;
      expect(btcEthCall.data).toMatchObject({
        baseAsset: "ETH",
        quoteAsset: "BTC",
        numExchanges: 2,
      });
      expect(Number(btcEthCall.data.vwap)).toBeCloseTo(20.56, 2); // Weighted average of 20.5 and 20.6
    });

    it("should handle exchange failures gracefully", async () => {
      // Mock Binance failure
      mockBinanceAdapter.fetchBatchPrices.mockRejectedValue(
        new Error("Binance API error")
      );

      await service.fetchAndStorePrices();

      // Should still store data from Coinbase
      expect(prismaMock.exchangePrice.createMany).toHaveBeenCalled();
      const createManyCall = (
        prismaMock.exchangePrice.createMany as unknown as {
          mock: { calls: any[][] };
        }
      ).mock.calls[0][0] as MockCreateManyCall;
      expect(createManyCall.data.length).toBeGreaterThan(0);
    });

    it("should throw error if no price data is available", async () => {
      // Mock all exchanges failing
      mockBinanceAdapter.fetchBatchPrices.mockRejectedValue(
        new Error("Binance API error")
      );
      mockCoinbaseAdapter.fetchBatchPrices.mockRejectedValue(
        new Error("Coinbase API error")
      );

      await expect(service.fetchAndStorePrices()).rejects.toThrow(
        "No price data collected from any exchange"
      );
    });
  });
});
