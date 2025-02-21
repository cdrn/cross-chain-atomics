export interface RFQRequest {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  baseChain: string;
  quoteChain: string;
  amount: number;
  requesterAddress: string;
  status: "pending" | "quoted" | "expired" | "filled" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface RFQQuote {
  id: string;
  requestId: string;
  makerAddress: string;
  baseAmount: number;
  quoteAmount: number;
  premium: number;
  expiryTime: number;
  signature?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  updatedAt: string;
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
  baseAmount: number;
  quoteAmount: number;
  premium: number;
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
  createdAt: string;
  updatedAt: string;
}
