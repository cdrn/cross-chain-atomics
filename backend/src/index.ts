import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "dotenv";
import { SchedulerService } from "./services/scheduler";
import { PricingService } from "./services/pricing";
import { QuoteRequest } from "./types";
import { parseEther } from "ethers";
import { prisma } from "./db/client";
import { RFQService } from "./services/rfq";
import { RFQQuote } from "./types/rfq";

// Load environment variables
config();

export const app = express();
const port = process.env.PORT || 3001;

// Initialize services
const pricingService = new PricingService();
export const schedulerService = new SchedulerService();
const rfqService = new RFQService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Manual price update endpoint (for testing)
app.post("/update-prices", async (req: Request, res: Response) => {
  try {
    await schedulerService.updatePricesNow();
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Manual price update failed:", error);
    res.status(500).json({ error: "Failed to update prices" });
  }
});

// Quote endpoint
app.post("/quote", (req: Request, res: Response) => {
  try {
    const quoteRequest = req.body as QuoteRequest;

    // For now, use some default parameters for option pricing
    const premium = pricingService.calculatePremium({
      spotPrice: 1.0, // This should come from a price feed
      strikePrice: 1.0,
      timeToExpiry: quoteRequest.timeToExpiry,
      volatility: 0.5, // This should be calculated based on historical data
      riskFreeRate: 0.05,
    });

    const quote = {
      orderId: Math.random().toString(36).substring(7),
      takerAmount: quoteRequest.makerAmount,
      premium: parseEther(premium.toFixed(18)), // Convert to wei
      expiryTime: Math.floor(Date.now() / 1000) + quoteRequest.timeToExpiry,
    };

    res.json(quote);
  } catch (error) {
    console.error("Error generating quote:", error);
    res.status(500).json({ error: "Failed to generate quote" });
  }
});

// Get latest price for a trading pair
app.get(
  "/prices/:baseAsset/:quoteAsset",
  async (req: Request, res: Response) => {
    try {
      const { baseAsset, quoteAsset } = req.params;

      const latestPrice = await prisma.consolidatedPrice.findFirst({
        where: {
          baseAsset: baseAsset.toUpperCase(),
          quoteAsset: quoteAsset.toUpperCase(),
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      if (!latestPrice) {
        return res
          .status(404)
          .json({ error: "Price not found for trading pair" });
      }

      res.json({
        baseAsset: latestPrice.baseAsset,
        quoteAsset: latestPrice.quoteAsset,
        price: latestPrice.vwap.toString(),
        timestamp: latestPrice.timestamp,
        volume: {
          base: latestPrice.totalVolumeBase.toString(),
          quote: latestPrice.totalVolumeQuote.toString(),
        },
        numExchanges: latestPrice.numExchanges,
      });
    } catch (error) {
      console.error("Error fetching price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  }
);

// Get historical prices for a trading pair
app.get(
  "/prices/:baseAsset/:quoteAsset/history",
  async (req: Request, res: Response) => {
    try {
      const { baseAsset, quoteAsset } = req.params;
      const { hours = "24" } = req.query;

      const lookbackHours = parseInt(hours as string);
      if (isNaN(lookbackHours) || lookbackHours <= 0) {
        return res.status(400).json({ error: "Invalid hours parameter" });
      }

      const lookbackTime = new Date(
        Date.now() - lookbackHours * 60 * 60 * 1000
      );

      const prices = await prisma.consolidatedPrice.findMany({
        where: {
          baseAsset: baseAsset.toUpperCase(),
          quoteAsset: quoteAsset.toUpperCase(),
          timestamp: {
            gte: lookbackTime,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      res.json(
        prices.map((p) => ({
          timestamp: p.timestamp,
          price: p.vwap.toString(),
          volume: {
            base: p.totalVolumeBase.toString(),
            quote: p.totalVolumeQuote.toString(),
          },
        }))
      );
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  }
);

// Get latest volatility metrics for a trading pair
app.get(
  "/volatility/:baseAsset/:quoteAsset",
  async (req: Request, res: Response) => {
    try {
      const { baseAsset, quoteAsset } = req.params;

      const latestVol = await prisma.volatilityMetric.findFirst({
        where: {
          baseAsset: baseAsset.toUpperCase(),
          quoteAsset: quoteAsset.toUpperCase(),
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      if (!latestVol) {
        return res
          .status(404)
          .json({ error: "Volatility metrics not found for trading pair" });
      }

      res.json({
        baseAsset: latestVol.baseAsset,
        quoteAsset: latestVol.quoteAsset,
        timestamp: latestVol.timestamp,
        metrics: {
          "1h": {
            volatility: latestVol.volatility1h?.toString(),
            sampleCount: latestVol.sampleCount1h,
          },
          "24h": {
            volatility: latestVol.volatility24h?.toString(),
            sampleCount: latestVol.sampleCount24h,
          },
          "7d": {
            volatility: latestVol.volatility7d?.toString(),
            sampleCount: latestVol.sampleCount7d,
          },
        },
        lastUpdated: latestVol.lastUpdated,
      });
    } catch (error) {
      console.error("Error fetching volatility:", error);
      res.status(500).json({ error: "Failed to fetch volatility metrics" });
    }
  }
);

// Get historical volatility metrics for a trading pair
app.get(
  "/volatility/:baseAsset/:quoteAsset/history",
  async (req: Request, res: Response) => {
    try {
      const { baseAsset, quoteAsset } = req.params;
      const { hours = "24" } = req.query;

      const lookbackHours = parseInt(hours as string);
      if (isNaN(lookbackHours) || lookbackHours <= 0) {
        return res.status(400).json({ error: "Invalid hours parameter" });
      }

      const lookbackTime = new Date(
        Date.now() - lookbackHours * 60 * 60 * 1000
      );

      const metrics = await prisma.volatilityMetric.findMany({
        where: {
          baseAsset: baseAsset.toUpperCase(),
          quoteAsset: quoteAsset.toUpperCase(),
          timestamp: {
            gte: lookbackTime,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      res.json(
        metrics.map((m) => ({
          timestamp: m.timestamp,
          metrics: {
            "1h": {
              volatility: m.volatility1h?.toString(),
              sampleCount: m.sampleCount1h,
            },
            "24h": {
              volatility: m.volatility24h?.toString(),
              sampleCount: m.sampleCount24h,
            },
            "7d": {
              volatility: m.volatility7d?.toString(),
              sampleCount: m.sampleCount7d,
            },
          },
        }))
      );
    } catch (error) {
      console.error("Error fetching volatility history:", error);
      res.status(500).json({ error: "Failed to fetch volatility history" });
    }
  }
);

// RFQ Endpoints

// Create a new RFQ request
app.post("/rfq/request", async (req: Request, res: Response) => {
  try {
    const request = await rfqService.createRequest(req.body);
    res.json(request);
  } catch (error) {
    console.error("Error creating RFQ request:", error);
    res.status(500).json({ error: "Failed to create RFQ request" });
  }
});

// Submit a quote for an RFQ request
app.post("/rfq/quote", async (req: Request, res: Response) => {
  try {
    const quote = await rfqService.submitQuote(req.body);
    res.json(quote);
  } catch (error) {
    console.error("Error submitting quote:", error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all quotes for a request
app.get(
  "/rfq/request/:requestId/quotes",
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const quotes = await prisma.rFQQuote.findMany({
        where: {
          requestId,
          status: "pending",
        },
      });

      // Transform the quotes to match the expected format
      const formattedQuotes = quotes.map((quote) => ({
        ...quote,
        signature: quote.signature || undefined,
        status: quote.status as RFQQuote["status"],
      }));

      res.json(formattedQuotes);
    } catch (error) {
      console.error("Error fetching quotes for request:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  }
);

// Accept a quote
app.post("/rfq/quote/:quoteId/accept", async (req: Request, res: Response) => {
  try {
    const { quoteId } = req.params;
    const { requesterAddress } = req.body;

    if (!requesterAddress) {
      return res.status(400).json({ error: "Requester address is required" });
    }

    const order = await rfqService.acceptQuote(quoteId, requesterAddress);
    res.json(order);
  } catch (error) {
    console.error("Error accepting quote:", error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Register a new solver
app.post("/rfq/solver", async (req: Request, res: Response) => {
  try {
    const solver = await rfqService.registerSolver(req.body);
    res.json(solver);
  } catch (error) {
    console.error("Error registering solver:", error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get active RFQ requests
app.get("/rfq/requests/active", async (req: Request, res: Response) => {
  try {
    const requests = await rfqService.getActiveRequests();
    res.json(requests);
  } catch (error) {
    console.error("Error fetching active requests:", error);
    res.status(500).json({ error: "Failed to fetch active requests" });
  }
});

// Get best quote for a request
app.get(
  "/rfq/request/:requestId/best-quote",
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const quote = await rfqService.getBestQuote(requestId);

      if (!quote) {
        return res.status(404).json({ error: "No quotes found for request" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error fetching best quote:", error);
      res.status(500).json({ error: "Failed to fetch best quote" });
    }
  }
);

// Get a solver by address
app.get("/rfq/solver/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const solver = await prisma.solver.findFirst({
      where: {
        address,
      },
    });

    if (!solver) {
      return res.status(404).json({ error: "Solver not found" });
    }

    res.json(solver);
  } catch (error) {
    console.error("Error fetching solver:", error);
    res.status(500).json({ error: "Failed to fetch solver" });
  }
});

// Start scheduler and server
export async function start() {
  try {
    await schedulerService.start();
    console.log("Scheduler started successfully");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on("SIGTERM", () => {
  console.log("Received SIGTERM signal, shutting down...");
  schedulerService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT signal, shutting down...");
  schedulerService.stop();
  process.exit(0);
});

// Only start the server if this file is run directly
if (require.main === module) {
  start();
}
