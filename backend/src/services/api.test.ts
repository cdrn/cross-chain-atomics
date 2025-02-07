import request from "supertest";
import { app } from "../index";
import { prismaMock } from "../test/setup";
import { Decimal } from "@prisma/client/runtime/library";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { ConsolidatedPrice, VolatilityMetric } from "@prisma/client";

// Mock services
jest.mock("./scheduler");
jest.mock("./pricing");

describe("API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /prices/:baseAsset/:quoteAsset", () => {
    it("should return latest price for a valid trading pair", async () => {
      const mockPrice: ConsolidatedPrice = {
        timestamp: new Date(),
        baseAsset: "BTC",
        quoteAsset: "ETH",
        vwap: new Decimal("35.12345"),
        totalVolumeBase: new Decimal("100.5"),
        totalVolumeQuote: new Decimal("3530.12"),
        numExchanges: 2,
      };

      prismaMock.consolidatedPrice.findFirst.mockResolvedValue(mockPrice);

      const response = await request(app).get("/prices/BTC/ETH");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        baseAsset: "BTC",
        quoteAsset: "ETH",
        price: "35.12345",
        timestamp: mockPrice.timestamp.toISOString(),
        volume: {
          base: "100.5",
          quote: "3530.12",
        },
        numExchanges: 2,
      });
    });

    it("should return 404 for non-existent trading pair", async () => {
      prismaMock.consolidatedPrice.findFirst.mockResolvedValue(null);

      const response = await request(app).get("/prices/INVALID/PAIR");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Price not found for trading pair",
      });
    });
  });

  describe("GET /prices/:baseAsset/:quoteAsset/history", () => {
    it("should return price history for valid parameters", async () => {
      const mockPrices: ConsolidatedPrice[] = [
        {
          timestamp: new Date("2024-02-05T12:00:00Z"),
          baseAsset: "BTC",
          quoteAsset: "ETH",
          vwap: new Decimal("35.1"),
          totalVolumeBase: new Decimal("100"),
          totalVolumeQuote: new Decimal("3510"),
          numExchanges: 2,
        },
        {
          timestamp: new Date("2024-02-05T12:01:00Z"),
          baseAsset: "BTC",
          quoteAsset: "ETH",
          vwap: new Decimal("35.2"),
          totalVolumeBase: new Decimal("120"),
          totalVolumeQuote: new Decimal("4224"),
          numExchanges: 2,
        },
      ];

      prismaMock.consolidatedPrice.findMany.mockResolvedValue(mockPrices);

      const response = await request(app).get(
        "/prices/BTC/ETH/history?hours=1"
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual({
        timestamp: mockPrices[0].timestamp.toISOString(),
        price: "35.1",
        volume: {
          base: "100",
          quote: "3510",
        },
      });
    });

    it("should reject invalid hours parameter", async () => {
      const response = await request(app).get(
        "/prices/BTC/ETH/history?hours=-1"
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid hours parameter",
      });
    });
  });

  describe("GET /volatility/:baseAsset/:quoteAsset", () => {
    it("should return latest volatility metrics for a valid trading pair", async () => {
      const mockVol: VolatilityMetric = {
        timestamp: new Date(),
        baseAsset: "BTC",
        quoteAsset: "ETH",
        volatility1h: new Decimal("0.45"),
        volatility24h: new Decimal("0.38"),
        volatility7d: new Decimal("0.42"),
        sampleCount1h: 60,
        sampleCount24h: 1440,
        sampleCount7d: 10080,
        lastUpdated: new Date(),
      };

      prismaMock.volatilityMetric.findFirst.mockResolvedValue(mockVol);

      const response = await request(app).get("/volatility/BTC/ETH");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        baseAsset: "BTC",
        quoteAsset: "ETH",
        timestamp: mockVol.timestamp.toISOString(),
        metrics: {
          "1h": {
            volatility: "0.45",
            sampleCount: 60,
          },
          "24h": {
            volatility: "0.38",
            sampleCount: 1440,
          },
          "7d": {
            volatility: "0.42",
            sampleCount: 10080,
          },
        },
        lastUpdated: mockVol.lastUpdated.toISOString(),
      });
    });

    it("should return 404 for non-existent volatility metrics", async () => {
      prismaMock.volatilityMetric.findFirst.mockResolvedValue(null);

      const response = await request(app).get("/volatility/INVALID/PAIR");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Volatility metrics not found for trading pair",
      });
    });
  });

  describe("GET /volatility/:baseAsset/:quoteAsset/history", () => {
    it("should return volatility history for valid parameters", async () => {
      const mockMetrics: VolatilityMetric[] = [
        {
          timestamp: new Date("2024-02-05T12:00:00Z"),
          baseAsset: "BTC",
          quoteAsset: "ETH",
          volatility1h: new Decimal("0.45"),
          volatility24h: new Decimal("0.38"),
          volatility7d: new Decimal("0.42"),
          sampleCount1h: 60,
          sampleCount24h: 1440,
          sampleCount7d: 10080,
          lastUpdated: new Date("2024-02-05T12:00:00Z"),
        },
        {
          timestamp: new Date("2024-02-05T12:01:00Z"),
          baseAsset: "BTC",
          quoteAsset: "ETH",
          volatility1h: new Decimal("0.46"),
          volatility24h: new Decimal("0.39"),
          volatility7d: new Decimal("0.42"),
          sampleCount1h: 60,
          sampleCount24h: 1440,
          sampleCount7d: 10080,
          lastUpdated: new Date("2024-02-05T12:01:00Z"),
        },
      ];

      prismaMock.volatilityMetric.findMany.mockResolvedValue(mockMetrics);

      const response = await request(app).get(
        "/volatility/BTC/ETH/history?hours=1"
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual({
        timestamp: mockMetrics[0].timestamp.toISOString(),
        metrics: {
          "1h": {
            volatility: "0.45",
            sampleCount: 60,
          },
          "24h": {
            volatility: "0.38",
            sampleCount: 1440,
          },
          "7d": {
            volatility: "0.42",
            sampleCount: 10080,
          },
        },
      });
    });

    it("should reject invalid hours parameter", async () => {
      const response = await request(app).get(
        "/volatility/BTC/ETH/history?hours=0"
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid hours parameter",
      });
    });
  });
});
