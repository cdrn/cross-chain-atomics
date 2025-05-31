import cron from "node-cron";
import { PriceAggregatorService } from "./price-aggregator";
import { prisma } from "../db/client";
import logger from "../utils/logger";

export class SchedulerService {
  private readonly priceAggregator: PriceAggregatorService;
  private priceUpdateJob?: cron.ScheduledTask;

  constructor() {
    this.priceAggregator = new PriceAggregatorService();
  }

  async start(): Promise<void> {
    await this.validateDatabase();
    this.startPriceUpdateJob();
  }

  stop(): void {
    if (this.priceUpdateJob) {
      this.priceUpdateJob.stop();
    }
  }

  private async validateDatabase(): Promise<void> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      logger.info("Database connection successful");
    } catch (error) {
      logger.error("Database connection failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private startPriceUpdateJob(): void {
    // Run every minute
    this.priceUpdateJob = cron.schedule("* * * * *", async () => {
      try {
        const startTime = Date.now();
        logger.info("\n=== Starting price update job ===");

        await this.priceAggregator.fetchAndStorePrices();

        const duration = Date.now() - startTime;
        logger.info(`=== Price update job completed in ${duration}ms ===\n`, { durationMs: duration });
      } catch (error) {
        logger.error("Price update job failed", {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    logger.info("Price update job scheduled", { schedule: "* * * * *" });
  }

  // Method to manually trigger a price update
  async updatePricesNow(): Promise<void> {
    try {
      const startTime = Date.now();
      logger.info("\n=== Starting manual price update ===");

      await this.priceAggregator.fetchAndStorePrices();

      const duration = Date.now() - startTime;
      logger.info(`=== Manual price update completed in ${duration}ms ===\n`, { durationMs: duration });
    } catch (error) {
      logger.error("Manual price update failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
