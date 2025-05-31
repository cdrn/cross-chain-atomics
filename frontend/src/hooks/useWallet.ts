import { useState, useCallback } from "react";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask to use this application");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const selectedAddress = accounts[0];

      setAddress(selectedAddress);
      setIsConnected(true);

      // Listen for account changes
      window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
        if (newAccounts.length === 0) {
          setAddress(null);
          setIsConnected(false);
        } else {
          setAddress(newAccounts[0]);
          setIsConnected(true);
        }
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
  }, []);

  return {
    address,
    isConnected,
    connect,
    disconnect,
  };
}

// TypeScript declarations for window.ethereum are in vite-env.d.ts
