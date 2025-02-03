import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "dotenv";
import { PricingService } from "./services/pricing";
import { QuoteRequest } from "./types";
import { parseEther } from "ethers";

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize services
const pricingService = new PricingService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
