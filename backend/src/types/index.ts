import { type BigNumberish } from "ethers";

export type ChainType = "bitcoin" | "ethereum";

export interface AtomicSwapOrder {
  id: string;
  maker: string;
  taker?: string;
  makerChain: ChainType;
  takerChain: ChainType;
  makerAmount: BigNumberish;
  takerAmount: BigNumberish;
  expiryTime: number;
  premium: BigNumberish;
  status: "open" | "filled" | "expired" | "cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface PricingParameters {
  spotPrice: number;
  volatility: number;
  timeToExpiry: number;
  riskFreeRate: number;
  strikePrice: number;
}

export interface QuoteRequest {
  makerChain: ChainType;
  takerChain: ChainType;
  makerAmount: BigNumberish;
  timeToExpiry: number;
}

export interface Quote {
  orderId: string;
  takerAmount: BigNumberish;
  premium: BigNumberish;
  expiryTime: number;
  signature?: string;
}

export interface SwapExecution {
  orderId: string;
  makerAddress: string;
  takerAddress: string;
  makerTxHash: string;
  takerTxHash?: string;
  status: "pending" | "completed" | "failed";
  timestamp: number;
}
