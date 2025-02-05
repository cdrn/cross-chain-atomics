import cron from "node-cron";
import { PriceAggregatorService } from "./price-aggregator";
import { prisma } from "../db/client";

export class SchedulerService {
  private readonly priceAggregator: PriceAggregatorService;
  private priceUpdateJob?: cron.ScheduledTask;
  private readonly logger: Console;

  constructor(logger: Console = console) {
    this.priceAggregator = new PriceAggregatorService();
    this.logger = logger;
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
      this.logger.info("Database connection successful");
    } catch (error) {
      this.logger.error("Database connection failed:", error);
      throw error;
    }
  }

  private startPriceUpdateJob(): void {
    // Run every minute
    this.priceUpdateJob = cron.schedule("* * * * *", async () => {
      try {
        const startTime = Date.now();
        this.logger.info("\n=== Starting price update job ===");

        await this.priceAggregator.fetchAndStorePrices();

        const duration = Date.now() - startTime;
        this.logger.info(
          `=== Price update job completed in ${duration}ms ===\n`
        );
      } catch (error) {
        this.logger.error("Price update job failed:", error);
      }
    });

    this.logger.info("Price update job scheduled (running every minute)");
  }

  // Method to manually trigger a price update
  async updatePricesNow(): Promise<void> {
    try {
      const startTime = Date.now();
      this.logger.info("\n=== Starting manual price update ===");

      await this.priceAggregator.fetchAndStorePrices();

      const duration = Date.now() - startTime;
      this.logger.info(
        `=== Manual price update completed in ${duration}ms ===\n`
      );
    } catch (error) {
      this.logger.error("Manual price update failed:", error);
      throw error;
    }
  }
}
