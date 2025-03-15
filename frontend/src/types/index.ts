import { BigNumberish } from "ethers";

export type ChainType = "bitcoin" | "ethereum";

export interface SwapOrder {
  id: string;
  maker: string;
  taker?: string;
  makerChain: ChainType;
  takerChain: ChainType;
  makerAsset: string;
  takerAsset: string;
  makerAmount: BigNumberish;
  takerAmount: BigNumberish;
  expiryTime: number;
  premium: BigNumberish;
  status: "open" | "filled" | "expired" | "cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface SwapQuote {
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

export interface ChainTransaction {
  hash: string;
  confirmations: number;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
}

export interface SwapState {
  ethLockConfirmed: boolean;
  btcLockConfirmed: boolean;
  ethClaimConfirmed: boolean;
  btcClaimConfirmed: boolean;
  currentStep:
    | "init"
    | "ethLock"
    | "btcLock"
    | "ethClaim"
    | "btcClaim"
    | "completed"
    | "failed";
  error?: string;
}
