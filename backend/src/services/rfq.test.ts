import request from "supertest";
import { app } from "../index";
import { prismaMock } from "../test/setup";
import { Decimal } from "@prisma/client/runtime/library";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { PrismaClient, Prisma } from "@prisma/client";

describe("RFQ API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /rfq/request", () => {
    const mockRequest = {
      baseAsset: "ETH",
      quoteAsset: "BTC",
      baseChain: "ethereum",
      quoteChain: "bitcoin",
      amount: "1.5",
      direction: "sell",
      timeToLive: 3600,
      requesterAddress: "0x1234567890123456789012345678901234567890",
    };

    it("should create a new RFQ request successfully", async () => {
      const mockResponse = {
        id: "123",
        ...mockRequest,
        amount: new Decimal(mockRequest.amount),
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.rFQRequest.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/rfq/request")
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...mockRequest,
        id: "123",
        status: "pending",
      });
    });

    it("should handle validation errors", async () => {
      const invalidRequest = {
        ...mockRequest,
        direction: "invalid",
      };

      prismaMock.rFQRequest.create.mockRejectedValue(
        new Error("Invalid direction")
      );

      const response = await request(app)
        .post("/rfq/request")
        .send(invalidRequest);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /rfq/quote", () => {
    const mockQuote = {
      requestId: "123",
      solverId: "solver1",
      baseAmount: "1.5",
      quoteAmount: "0.05",
      premium: "0.001",
      expiryTime: Math.floor(Date.now() / 1000) + 3600,
    };

    it("should submit a quote successfully", async () => {
      const mockSolver = {
        id: "solver1",
        active: true,
        name: "Test Solver",
        address: "0x1234",
        supportedPairs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRFQRequest = {
        id: "123",
        status: "pending",
        baseAsset: "ETH",
        quoteAsset: "BTC",
      };

      const mockResponse = {
        id: "quote1",
        ...mockQuote,
        baseAmount: new Decimal(mockQuote.baseAmount),
        quoteAmount: new Decimal(mockQuote.quoteAmount),
        premium: new Decimal(mockQuote.premium),
        status: "pending",
        signature: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.solver.findUnique.mockResolvedValue(mockSolver);
      prismaMock.rFQRequest.findUnique.mockResolvedValue(mockRFQRequest as any);
      prismaMock.rFQQuote.create.mockResolvedValue(mockResponse);
      prismaMock.rFQRequest.update.mockResolvedValue({} as any);

      const response = await request(app).post("/rfq/quote").send(mockQuote);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "quote1",
        status: "pending",
      });
    });

    it("should handle inactive solver", async () => {
      const mockSolver = {
        id: "solver1",
        active: false,
      };

      prismaMock.solver.findUnique.mockResolvedValue(mockSolver as any);

      const response = await request(app).post("/rfq/quote").send(mockQuote);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or inactive solver");
    });
  });

  describe("POST /rfq/quote/:quoteId/accept", () => {
    const quoteId = "quote1";
    const requesterAddress = "0x1234567890123456789012345678901234567890";

    it("should accept a quote successfully", async () => {
      const mockQuote = {
        id: quoteId,
        status: "pending",
        requestId: "123",
        solverId: "solver1",
        baseAmount: new Decimal("1.5"),
        quoteAmount: new Decimal("0.05"),
        premium: new Decimal("0.001"),
        request: {
          requesterAddress,
          baseAsset: "ETH",
          quoteAsset: "BTC",
          baseChain: "ethereum",
          quoteChain: "bitcoin",
        },
        solver: {
          address: "0x9876",
        },
      };

      const mockOrder = {
        id: "order1",
        status: "pending",
        timelock: Math.floor(Date.now() / 1000) + 3600,
      };

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.rFQQuote.findUnique.mockResolvedValue(mockQuote as any);
        prismaMock.rFQOrder.create.mockResolvedValue(mockOrder as any);
        return callback(prismaMock);
      });

      const response = await request(app)
        .post(`/rfq/quote/${quoteId}/accept`)
        .send({ requesterAddress });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "order1",
        status: "pending",
      });
    });

    it("should handle unauthorized requester", async () => {
      const mockQuote = {
        id: quoteId,
        status: "pending",
        request: {
          requesterAddress: "0x9999", // Different address
        },
      };

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.rFQQuote.findUnique.mockResolvedValue(mockQuote as any);
        return callback(prismaMock);
      });

      const response = await request(app)
        .post(`/rfq/quote/${quoteId}/accept`)
        .send({ requesterAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Unauthorized");
    });
  });

  describe("GET /rfq/requests/active", () => {
    it("should return active requests", async () => {
      const mockRequests = [
        {
          id: "123",
          baseAsset: "ETH",
          quoteAsset: "BTC",
          status: "pending",
          direction: "sell",
          amount: new Decimal("1.5"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.rFQRequest.findMany.mockResolvedValue(mockRequests as any);

      const response = await request(app).get("/rfq/requests/active");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: "123",
        status: "pending",
      });
    });
  });

  describe("GET /rfq/request/:requestId/best-quote", () => {
    const requestId = "123";

    it("should return the best quote", async () => {
      const mockQuote = {
        id: "quote1",
        requestId,
        status: "pending",
        premium: new Decimal("0.001"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.rFQQuote.findMany.mockResolvedValue([mockQuote as any]);

      const response = await request(app).get(
        `/rfq/request/${requestId}/best-quote`
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "quote1",
        status: "pending",
      });
    });

    it("should return 404 when no quotes exist", async () => {
      prismaMock.rFQQuote.findMany.mockResolvedValue([]);

      const response = await request(app).get(
        `/rfq/request/${requestId}/best-quote`
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No quotes found for request");
    });
  });
});
