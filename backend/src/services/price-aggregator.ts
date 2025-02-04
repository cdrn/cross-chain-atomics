import { prisma } from "../db/client";
import { BinanceAdapter } from "./exchanges/binance";
import { CoinbaseAdapter } from "./exchanges/coinbase";
import { AssetPair, ExchangeAdapter, PriceTick } from "./exchanges/types";
import { Decimal } from "@prisma/client/runtime/library";

export class PriceAggregatorService {
  private readonly exchanges: ExchangeAdapter[];
  private readonly supportedPairs: AssetPair[];

  constructor() {
    this.exchanges = [new BinanceAdapter(), new CoinbaseAdapter()];

    // Define supported trading pairs
    this.supportedPairs = [
      { baseAsset: "BTC", quoteAsset: "ETH" },
      { baseAsset: "ETH", quoteAsset: "USDT" },
      { baseAsset: "BTC", quoteAsset: "USDT" },
    ];
  }

  async fetchAndStorePrices(): Promise<void> {
    const timestamp = new Date();
    const results = await Promise.allSettled(
      this.exchanges.map((exchange) =>
        exchange.fetchBatchPrices(this.supportedPairs)
      )
    );

    const priceData: Array<{
      timestamp: Date;
      exchange: string;
      baseAsset: string;
      quoteAsset: string;
      price: Decimal;
      volumeBase: Decimal;
      volumeQuote: Decimal;
    }> = [];

    // Process results from each exchange
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const exchange = this.exchanges[index];
        result.value.forEach((tick, symbol) => {
          try {
            const pair = exchange.parseSymbol(symbol);
            priceData.push({
              timestamp,
              exchange: exchange.getName(),
              baseAsset: pair.baseAsset,
              quoteAsset: pair.quoteAsset,
              price: new Decimal(tick.price),
              volumeBase: new Decimal(tick.volume24h),
              volumeQuote: new Decimal(tick.price * tick.volume24h),
            });
          } catch (error) {
            console.error(`Error processing symbol ${symbol}:`, error);
          }
        });
      } else {
        console.error(
          `Exchange ${this.exchanges[index].getName()} failed:`,
          result.reason
        );
      }
    });

    if (priceData.length === 0) {
      throw new Error("No price data collected from any exchange");
    }

    // Store raw price data
    await prisma.exchangePrice.createMany({
      data: priceData,
    });

    // Calculate and store consolidated prices
    await this.calculateConsolidatedPrices(timestamp);
  }

  private async calculateConsolidatedPrices(timestamp: Date): Promise<void> {
    // Group prices by trading pair and calculate VWAP
    for (const pair of this.supportedPairs) {
      const prices = await prisma.exchangePrice.findMany({
        where: {
          timestamp,
          baseAsset: pair.baseAsset,
          quoteAsset: pair.quoteAsset,
        },
      });

      if (prices.length === 0) continue;

      let totalVolumeBase = new Decimal(0);
      let totalWeightedPrice = new Decimal(0);
      let totalVolumeQuote = new Decimal(0);

      prices.forEach((price) => {
        totalVolumeBase = totalVolumeBase.add(price.volumeBase);
        totalWeightedPrice = totalWeightedPrice.add(
          price.price.mul(price.volumeBase)
        );
        totalVolumeQuote = totalVolumeQuote.add(price.volumeQuote);
      });

      const vwap = totalWeightedPrice.div(totalVolumeBase);

      await prisma.consolidatedPrice.create({
        data: {
          timestamp,
          baseAsset: pair.baseAsset,
          quoteAsset: pair.quoteAsset,
          vwap,
          totalVolumeBase,
          totalVolumeQuote,
          numExchanges: prices.length,
        },
      });
    }
  }
}
