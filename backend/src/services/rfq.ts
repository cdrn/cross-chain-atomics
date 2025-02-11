import { prisma } from "../db/client";
import { PricingService } from "./pricing";
import { RFQRequest, RFQQuote, RFQOrder, Solver } from "../types/rfq";
import { ethers } from "ethers";
import { Decimal } from "@prisma/client/runtime/library";

export class RFQService {
  private readonly pricingService: PricingService;

  constructor() {
    this.pricingService = new PricingService();
  }

  /**
   * Create a (taker) request for a quote. Makers compete on pricing to provide the best possible
   * price for these requests.
   * @param request
   * @returns
   */
  async createRequest(
    request: Omit<RFQRequest, "id" | "status" | "createdAt" | "updatedAt">
  ): Promise<RFQRequest> {
    const result = await prisma.rFQRequest.create({
      data: {
        ...request,
        status: "pending",
      },
    });

    return {
      ...result,
      direction: result.direction as "buy" | "sell",
      status: result.status as RFQRequest["status"],
    };
  }

  /**
   * Submit a quote in response to an RFQ request. Validates that the solver exists and is active,
   * and that the request is still pending. Creates a new quote and updates the request status.
   * @param quote The quote details to submit, excluding auto-generated fields
   * @returns The created quote with complete information
   * @throws Error if solver is invalid/inactive or if request is invalid/expired
   */
  async submitQuote(
    quote: Omit<RFQQuote, "id" | "status" | "createdAt" | "updatedAt">
  ): Promise<RFQQuote> {
    // Verify solver exists and is active
    const solver = await prisma.solver.findUnique({
      where: { id: quote.solverId },
    });

    if (!solver || !solver.active) {
      throw new Error("Invalid or inactive solver");
    }

    // Verify request exists and is still pending
    const request = await prisma.rFQRequest.findUnique({
      where: { id: quote.requestId },
    });

    if (!request || request.status !== "pending") {
      throw new Error("Invalid or expired request");
    }

    // Create the quote
    const newQuote = await prisma.rFQQuote.create({
      data: {
        ...quote,
        status: "pending",
      },
    });

    // Update request status
    await prisma.rFQRequest.update({
      where: { id: quote.requestId },
      data: { status: "quoted" },
    });

    return {
      ...newQuote,
      signature: newQuote.signature || undefined,
      status: newQuote.status as RFQQuote["status"],
    };
  }

  /**
   * Accepts a quote from a solver and creates an order. This method validates the quote status
   * and requester authorization, then creates an order with a 1-hour timelock. Updates the
   * statuses of both the quote and original request to reflect the acceptance.
   * @param quoteId The ID of the quote to accept
   * @param requesterAddress The address of the requester accepting the quote
   * @returns The created order with complete information
   * @throws Error if quote is invalid/expired or if requester is unauthorized
   */
  async acceptQuote(
    quoteId: string,
    requesterAddress: string
  ): Promise<RFQOrder> {
    // Start a transaction since we need to update multiple records
    return prisma.$transaction(async (tx) => {
      // Get the quote and related data
      const quote = await tx.rFQQuote.findUnique({
        where: { id: quoteId },
        include: {
          request: true,
          solver: true,
        },
      });

      if (!quote || quote.status !== "pending") {
        throw new Error("Invalid or expired quote");
      }

      // Check if quote has expired
      if (quote.expiryTime < Math.floor(Date.now() / 1000)) {
        await tx.rFQQuote.update({
          where: { id: quoteId },
          data: { status: "expired" },
        });
        throw new Error("Invalid or expired quote");
      }

      if (quote.request.requesterAddress !== requesterAddress) {
        throw new Error("Unauthorized");
      }

      // Create the order
      const order = await tx.rFQOrder.create({
        data: {
          requestId: quote.requestId,
          quoteId: quote.id,
          solverId: quote.solverId,
          requesterAddress: quote.request.requesterAddress,
          solverAddress: quote.solver.address,
          baseAsset: quote.request.baseAsset,
          quoteAsset: quote.request.quoteAsset,
          baseChain: quote.request.baseChain,
          quoteChain: quote.request.quoteChain,
          baseAmount: quote.baseAmount,
          quoteAmount: quote.quoteAmount,
          premium: quote.premium,
          timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour timelock
          status: "pending",
        },
      });

      // Update quote status
      await tx.rFQQuote.update({
        where: { id: quoteId },
        data: { status: "accepted" },
      });

      // Update request status
      await tx.rFQRequest.update({
        where: { id: quote.requestId },
        data: { status: "filled" },
      });

      return {
        ...order,
        status: order.status as RFQOrder["status"],
        baseTxHash: order.baseTxHash || undefined,
        quoteTxHash: order.quoteTxHash || undefined,
      };
    });
  }

  async registerSolver(
    solver: Omit<Solver, "id" | "createdAt" | "updatedAt">
  ): Promise<Solver> {
    // Verify the solver's address is valid
    if (!ethers.isAddress(solver.address)) {
      throw new Error("Invalid solver address");
    }

    const result = await prisma.solver.create({
      data: solver,
    });

    return {
      ...result,
      supportedPairs: result.supportedPairs as Solver["supportedPairs"],
    };
  }

  async getBestQuote(requestId: string): Promise<RFQQuote | null> {
    const quotes = await prisma.rFQQuote.findMany({
      where: {
        requestId,
        status: "pending",
      },
      orderBy: {
        premium: "asc", // Get lowest premium first
      },
      take: 1,
    });

    if (!quotes[0]) return null;

    return {
      ...quotes[0],
      signature: quotes[0].signature || undefined,
      status: quotes[0].status as RFQQuote["status"],
    };
  }

  async getActiveRequests(): Promise<RFQRequest[]> {
    const requests = await prisma.rFQRequest.findMany({
      where: {
        status: "pending",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests.map((request) => ({
      ...request,
      direction: request.direction as "buy" | "sell",
      status: request.status as RFQRequest["status"],
    }));
  }

  async updateOrderStatus(
    orderId: string,
    status: RFQOrder["status"],
    txHash?: string
  ): Promise<RFQOrder> {
    const order = await prisma.rFQOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const updateData: any = { status };

    if (txHash) {
      if (status === "baseAssetLocked") {
        updateData.baseTxHash = txHash;
      } else if (status === "quoteAssetLocked") {
        updateData.quoteTxHash = txHash;
      }
    }

    const result = await prisma.rFQOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    return {
      ...result,
      status: result.status as RFQOrder["status"],
      baseTxHash: result.baseTxHash || undefined,
      quoteTxHash: result.quoteTxHash || undefined,
    };
  }
}
