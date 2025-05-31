import { ethers, Contract, JsonRpcSigner } from "ethers";
import { ChainTransaction } from "../types";
import { ATOMIC_SWAP_ABI, KNOWN_DEPLOYMENTS } from "../config/contracts";

// TypeScript declarations for window.ethereum are in vite-env.d.ts

export class EthereumService {
  private provider: ethers.BrowserProvider;
  private contract: Contract | null = null;
  private signer: JsonRpcSigner | null = null;
  private contractAddress: string | null = null;

  constructor() {
    // Check if window.ethereum is available
    if (typeof window.ethereum === "undefined") {
      throw new Error("Please install MetaMask!");
    }
    this.provider = new ethers.BrowserProvider(window.ethereum);
  }

  async connect(
    contractAddress?: string
  ): Promise<{ address: string; chainId: number }> {
    try {
      // Request account access
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      this.signer = await this.provider.getSigner();

      // Get the chain ID
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      // If contract address is provided, use it
      if (contractAddress) {
        this.contractAddress = contractAddress;
      } else {
        // Try to get from known deployments
        const chainIdStr = chainId.toString();
        if (chainIdStr in KNOWN_DEPLOYMENTS) {
          this.contractAddress = 
            KNOWN_DEPLOYMENTS[chainIdStr as keyof typeof KNOWN_DEPLOYMENTS]?.address || null;
        } else {
          this.contractAddress = null;
        }
      }

      // Initialize contract if we have an address
      if (this.contractAddress && this.signer) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          ATOMIC_SWAP_ABI,
          this.signer
        );
      }

      const address = await this.signer.getAddress();
      return { address, chainId };
    } catch (error) {
      console.error("Failed to connect to MetaMask", error);
      throw error;
    }
  }

  setContractAddress(address: string) {
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid contract address");
    }
    this.contractAddress = address;
    if (this.signer) {
      this.contract = new ethers.Contract(
        address,
        ATOMIC_SWAP_ABI,
        this.signer
      );
    }
  }

  getContractAddress(): string | null {
    return this.contractAddress;
  }

  async createSwap(
    maker: string,
    hashlock: string,
    timelock: number,
    premium: bigint,
    value: bigint
  ): Promise<ChainTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error("Not connected to Ethereum");
    }

    try {
      const tx = await this.contract.createSwap(
        maker,
        hashlock,
        timelock,
        premium,
        {
          value: value,
        }
      );
      const receipt = await tx.wait();

      return {
        hash: receipt.hash,
        confirmations: receipt.confirmations,
        status: receipt.status === 1 ? "confirmed" : "failed",
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Failed to create swap", error);
      throw error;
    }
  }

  async claimSwap(swapId: string, secret: string): Promise<ChainTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error("Not connected to Ethereum");
    }

    try {
      const tx = await this.contract.claim(swapId, secret);
      const receipt = await tx.wait();

      return {
        hash: receipt.hash,
        confirmations: receipt.confirmations,
        status: receipt.status === 1 ? "confirmed" : "failed",
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Failed to claim swap", error);
      throw error;
    }
  }

  async refundSwap(swapId: string): Promise<ChainTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error("Not connected to Ethereum");
    }

    try {
      const tx = await this.contract.refund(swapId);
      const receipt = await tx.wait();

      return {
        hash: receipt.hash,
        confirmations: receipt.confirmations,
        status: receipt.status === 1 ? "confirmed" : "failed",
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Failed to refund swap", error);
      throw error;
    }
  }

  async getSwapDetails(swapId: string) {
    if (!this.contract) {
      throw new Error("Not connected to Ethereum");
    }

    try {
      const swap = await this.contract.swaps(swapId);
      return swap;
    } catch (error) {
      console.error("Failed to get swap details", error);
      throw error;
    }
  }

  async watchSwapEvents(swapId: string, callback: (event: any) => void) {
    if (!this.contract) {
      throw new Error("Not connected to Ethereum");
    }

    // Watch for relevant events
    this.contract.on("SwapCreated", (...args) => {
      if (args[0] === swapId) callback({ type: "created", ...args });
    });

    this.contract.on("SwapClaimed", (...args) => {
      if (args[0] === swapId) callback({ type: "claimed", ...args });
    });

    this.contract.on("SwapRefunded", (...args) => {
      if (args[0] === swapId) callback({ type: "refunded", ...args });
    });
  }
}
