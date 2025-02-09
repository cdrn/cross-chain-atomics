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
      { baseAsset: "ETH", quoteAsset: "BTC" },
      { baseAsset: "ETH", quoteAsset: "USDT" },
      { baseAsset: "BTC", quoteAsset: "USDT" },
    ];
  }

  async fetchAndStorePrices(): Promise<void> {
    const timestamp = new Date();
    console.log(`\nFetching prices at ${timestamp.toISOString()}`);

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
      const exchange = this.exchanges[index];
      if (result.status === "fulfilled") {
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
            console.log(
              `[${exchange.getName()}] ${pair.baseAsset}-${pair.quoteAsset}: ${
                tick.price
              } (vol: ${tick.volume24h})`
            );
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
    console.log(`\nStoring ${priceData.length} price points...`);
    await prisma.exchangePrice.createMany({
      data: priceData,
    });

    // Calculate and store consolidated prices
    console.log("\nCalculating consolidated prices...");
    await this.calculateConsolidatedPrices(timestamp);

    // After storing consolidated prices, update volatility metrics
    await this.updateVolatilityMetrics(timestamp);
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

      console.log(
        `[VWAP] ${pair.baseAsset}-${pair.quoteAsset}: ${vwap} (from ${prices.length} exchanges, vol: ${totalVolumeBase})`
      );
    }
  }

  private async calculateVolatility(
    baseAsset: string,
    quoteAsset: string,
    lookbackHours: number
  ): Promise<number> {
    const now = new Date();
    const lookbackTime = new Date(
      now.getTime() - lookbackHours * 60 * 60 * 1000
    );

    // Get historical consolidated prices
    const historicalPrices = await prisma.consolidatedPrice.findMany({
      where: {
        baseAsset,
        quoteAsset,
        timestamp: {
          gte: lookbackTime,
          lte: now,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    if (historicalPrices.length < 2) {
      throw new Error(
        `Insufficient price data for ${baseAsset}-${quoteAsset} volatility calculation`
      );
    }

    // Calculate log returns
    const returns: number[] = [];
    for (let i = 1; i < historicalPrices.length; i++) {
      const currentPrice = historicalPrices[i].vwap;
      const previousPrice = historicalPrices[i - 1].vwap;
      returns.push(
        Math.log(currentPrice.toNumber() / previousPrice.toNumber())
      );
    }

    // Calculate standard deviation of returns
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
      (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    // Annualize volatility (assuming prices are collected every minute)
    const minutesPerYear = 365 * 24 * 60;
    const annualizedVol =
      stdDev * Math.sqrt(minutesPerYear / (lookbackHours * 60));

    return annualizedVol;
  }

  private async updateVolatilityMetrics(timestamp: Date): Promise<void> {
    console.log("\nCalculating volatility metrics...");

    for (const pair of this.supportedPairs) {
      try {
        // Calculate volatilities for different time windows
        const volatility1h = await this.calculateVolatility(
          pair.baseAsset,
          pair.quoteAsset,
          1
        );
        const volatility24h = await this.calculateVolatility(
          pair.baseAsset,
          pair.quoteAsset,
          24
        );
        const volatility7d = await this.calculateVolatility(
          pair.baseAsset,
          pair.quoteAsset,
          24 * 7
        );

        await prisma.volatilityMetric.create({
          data: {
            timestamp,
            baseAsset: pair.baseAsset,
            quoteAsset: pair.quoteAsset,
            volatility1h,
            volatility24h,
            volatility7d,
            sampleCount1h: 60, // Assuming 1 sample per minute
            sampleCount24h: 24 * 60,
            sampleCount7d: 7 * 24 * 60,
            lastUpdated: new Date(),
          },
        });

        console.log(
          `[VOL] ${pair.baseAsset}-${pair.quoteAsset}: ` +
            `1h=${(volatility1h * 100).toFixed(2)}% ` +
            `24h=${(volatility24h * 100).toFixed(2)}% ` +
            `7d=${(volatility7d * 100).toFixed(2)}%`
        );
      } catch (error) {
        console.error(
          `Error calculating volatility for ${pair.baseAsset}-${pair.quoteAsset}:`,
          error
        );
      }
    }
  }
}
