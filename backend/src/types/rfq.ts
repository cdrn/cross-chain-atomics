import { Decimal } from "@prisma/client/runtime/library";
import { ChainType } from "./index";

export interface Solver {
  id: string;
  name: string;
  address: string;
  supportedPairs: Array<{
    baseAsset: string;
    quoteAsset: string;
    chain: string;
  }>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RFQRequest {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  baseChain: string;
  quoteChain: string;
  amount: Decimal;
  direction: "buy" | "sell";
  timeToLive: number; // How long the quote should be valid for (in seconds)
  requesterAddress: string;
  status: "pending" | "quoted" | "expired" | "filled" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface RFQQuote {
  id: string;
  requestId: string;
  solverId: string;
  baseAmount: Decimal;
  quoteAmount: Decimal;
  premium: Decimal;
  expiryTime: number;
  signature?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

export interface RFQOrder {
  id: string;
  requestId: string;
  quoteId: string;
  solverId: string;
  requesterAddress: string;
  solverAddress: string;
  baseAsset: string;
  quoteAsset: string;
  baseChain: string;
  quoteChain: string;
  baseAmount: Decimal;
  quoteAmount: Decimal;
  premium: Decimal;
  timelock: number;
  status:
    | "pending"
    | "baseAssetLocked"
    | "quoteAssetLocked"
    | "completed"
    | "failed"
    | "refunded";
  baseTxHash?: string;
  quoteTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}
