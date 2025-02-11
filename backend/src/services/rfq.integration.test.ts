import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { RFQService } from "./rfq";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";

const prisma = new PrismaClient();
const rfqService = new RFQService();

describe("RFQ Service Integration Tests", () => {
  describe("Full RFQ Flow", () => {
    it("should handle the complete RFQ lifecycle", async () => {
      // 1. Register a solver
      const solver = await rfqService.registerSolver({
        name: "Test Solver",
        address: "0x1234567890123456789012345678901234567890",
        supportedPairs: [
          {
            baseAsset: "ETH",
            quoteAsset: "BTC",
            chain: "ethereum",
          },
        ],
        active: true,
      });

      expect(solver.id).toBeDefined();
      expect(solver.active).toBe(true);

      // 2. Create an RFQ request
      const request = await rfqService.createRequest({
        baseAsset: "ETH",
        quoteAsset: "BTC",
        baseChain: "ethereum",
        quoteChain: "bitcoin",
        amount: new Decimal("1.5"),
        direction: "sell",
        timeToLive: 3600,
        requesterAddress: "0x9876543210987654321098765432109876543210",
      });

      expect(request.id).toBeDefined();
      expect(request.status).toBe("pending");

      // 3. Submit a quote
      const quote = await rfqService.submitQuote({
        requestId: request.id,
        solverId: solver.id,
        baseAmount: new Decimal("1.5"),
        quoteAmount: new Decimal("0.05"),
        premium: new Decimal("0.001"),
        expiryTime: Math.floor(Date.now() / 1000) + 3600,
      });

      expect(quote.id).toBeDefined();
      expect(quote.status).toBe("pending");

      // 4. Get best quote
      const bestQuote = await rfqService.getBestQuote(request.id);
      expect(bestQuote?.id).toBe(quote.id);

      // 5. Accept the quote
      const order = await rfqService.acceptQuote(
        quote.id,
        request.requesterAddress
      );

      expect(order.id).toBeDefined();
      expect(order.status).toBe("pending");
      expect(order.timelock).toBeGreaterThan(Math.floor(Date.now() / 1000));

      // 6. Update order status through the lifecycle
      const states: Array<
        "baseAssetLocked" | "quoteAssetLocked" | "completed"
      > = ["baseAssetLocked", "quoteAssetLocked", "completed"];

      for (const state of states) {
        const updatedOrder = await rfqService.updateOrderStatus(
          order.id,
          state,
          state === "completed" ? undefined : `0x${state}`
        );
        expect(updatedOrder.status).toBe(state);
      }

      // 7. Verify final state in database
      const finalOrder = await prisma.rFQOrder.findUnique({
        where: { id: order.id },
      });
      expect(finalOrder?.status).toBe("completed");
    });

    it("should handle quote expiry correctly", async () => {
      // 1. Register solver
      const solver = await rfqService.registerSolver({
        name: "Test Solver",
        address: "0x1234567890123456789012345678901234567890",
        supportedPairs: [
          {
            baseAsset: "ETH",
            quoteAsset: "BTC",
            chain: "ethereum",
          },
        ],
        active: true,
      });

      // 2. Create request
      const request = await rfqService.createRequest({
        baseAsset: "ETH",
        quoteAsset: "BTC",
        baseChain: "ethereum",
        quoteChain: "bitcoin",
        amount: new Decimal("1.5"),
        direction: "sell",
        timeToLive: 1, // Very short TTL
        requesterAddress: "0x9876543210987654321098765432109876543210",
      });

      // 3. Submit quote
      const quote = await rfqService.submitQuote({
        requestId: request.id,
        solverId: solver.id,
        baseAmount: new Decimal("1.5"),
        quoteAmount: new Decimal("0.05"),
        premium: new Decimal("0.001"),
        expiryTime: Math.floor(Date.now() / 1000) + 1, // Very short expiry
      });

      // 4. Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 5. Attempt to accept expired quote
      await expect(
        rfqService.acceptQuote(quote.id, request.requesterAddress)
      ).rejects.toThrow("Invalid or expired quote");
    });

    it("should enforce solver authorization", async () => {
      // 1. Register inactive solver
      const solver = await rfqService.registerSolver({
        name: "Inactive Solver",
        address: "0x1234567890123456789012345678901234567890",
        supportedPairs: [
          {
            baseAsset: "ETH",
            quoteAsset: "BTC",
            chain: "ethereum",
          },
        ],
        active: false,
      });

      // 2. Create request
      const request = await rfqService.createRequest({
        baseAsset: "ETH",
        quoteAsset: "BTC",
        baseChain: "ethereum",
        quoteChain: "bitcoin",
        amount: new Decimal("1.5"),
        direction: "sell",
        timeToLive: 3600,
        requesterAddress: "0x9876543210987654321098765432109876543210",
      });

      // 3. Attempt to submit quote with inactive solver
      await expect(
        rfqService.submitQuote({
          requestId: request.id,
          solverId: solver.id,
          baseAmount: new Decimal("1.5"),
          quoteAmount: new Decimal("0.05"),
          premium: new Decimal("0.001"),
          expiryTime: Math.floor(Date.now() / 1000) + 3600,
        })
      ).rejects.toThrow("Invalid or inactive solver");
    });
  });
});
