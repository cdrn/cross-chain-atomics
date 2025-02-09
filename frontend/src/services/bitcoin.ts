import axios from "axios";
import { ChainTransaction } from "../types";

const API_BASE_URL = "http://localhost:3001"; // TODO: Make this configurable

export class BitcoinService {
  private readonly api = axios.create({
    baseURL: API_BASE_URL,
  });

  async verifyTransaction(txHash: string): Promise<ChainTransaction> {
    try {
      const response = await this.api.get(`/bitcoin/transaction/${txHash}`);
      return {
        hash: txHash,
        confirmations: response.data.confirmations,
        status: response.data.confirmations >= 1 ? "confirmed" : "pending",
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      console.error("Failed to verify Bitcoin transaction", error);
      throw error;
    }
  }

  async watchAddress(
    address: string,
    callback: (tx: ChainTransaction) => void
  ) {
    // In a real implementation, this would set up a WebSocket connection
    // or use a polling mechanism to watch for new transactions
    const checkInterval = setInterval(async () => {
      try {
        const response = await this.api.get(
          `/bitcoin/address/${address}/transactions`
        );
        const transactions = response.data;

        transactions.forEach((tx: any) => {
          callback({
            hash: tx.txid,
            confirmations: tx.confirmations,
            status: tx.confirmations >= 1 ? "confirmed" : "pending",
            timestamp: tx.timestamp,
          });
        });
      } catch (error) {
        console.error("Failed to check Bitcoin address", error);
      }
    }, 30000); // Check every 30 seconds

    // Return cleanup function
    return () => clearInterval(checkInterval);
  }

  async getAddressBalance(
    address: string
  ): Promise<{ confirmed: number; unconfirmed: number }> {
    try {
      const response = await this.api.get(
        `/bitcoin/address/${address}/balance`
      );
      return {
        confirmed: response.data.confirmed,
        unconfirmed: response.data.unconfirmed,
      };
    } catch (error) {
      console.error("Failed to get Bitcoin address balance", error);
      throw error;
    }
  }

  async broadcastTransaction(rawTx: string): Promise<string> {
    try {
      const response = await this.api.post("/bitcoin/transaction/broadcast", {
        rawTx,
      });
      return response.data.txid;
    } catch (error) {
      console.error("Failed to broadcast Bitcoin transaction", error);
      throw error;
    }
  }
}
