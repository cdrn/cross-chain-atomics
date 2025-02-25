export interface RFQRequest {
  id: string;
  requesterAddress: string;
  baseAsset: string;
  quoteAsset: string;
  baseChain: string;
  quoteChain: string;
  amount: number;
  direction: "buy" | "sell";
  status: "pending" | "quoted" | "filled" | "expired" | "cancelled";
  timeToLive: number;
  createdAt: string;
  updatedAt: string;
}

export interface RFQQuote {
  id: string;
  requestId: string;
  solverId: string;
  baseAmount: number;
  quoteAmount: number;
  premium: number;
  expiryTime: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface RFQOrder {
  id: string;
  requestId: string;
  quoteId: string;
  takerAddress: string;
  makerAddress: string;
  baseAsset: string;
  quoteAsset: string;
  baseChain: string;
  quoteChain: string;
  baseAmount: number;
  quoteAmount: number;
  direction: "buy" | "sell";
  status: "pending" | "completed" | "failed";
  baseTxHash?: string;
  quoteTxHash?: string;
  createdAt: string;
  updatedAt: string;
}
