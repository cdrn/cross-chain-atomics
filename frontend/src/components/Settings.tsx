import { useState, useEffect } from "react";
import { KNOWN_DEPLOYMENTS } from "../config/contracts";
import { ethers } from "ethers";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: string) => void;
  currentChainId?: number;
}

export function Settings({
  isOpen,
  onClose,
  onSave,
  currentChainId,
}: SettingsProps) {
  const [contractAddress, setContractAddress] = useState("");
  const [error, setError] = useState<string>();

  // Update contract address when chainId changes or modal opens
  useEffect(() => {
    if (currentChainId) {
      const chainIdString =
        currentChainId.toString() as keyof typeof KNOWN_DEPLOYMENTS;
      const deployment = KNOWN_DEPLOYMENTS[chainIdString];
      if (deployment?.address) {
        setContractAddress(deployment.address);
        setError(undefined);
      }
    }
  }, [currentChainId, isOpen]);

  const handleContractAddress = (address: string) => {
    setContractAddress(address);
    if (address && !ethers.isAddress(address)) {
      setError("Invalid contract address");
    } else {
      setError(undefined);
    }
  };

  const handleSave = () => {
    if (!error && contractAddress) {
      onSave(contractAddress);
      onClose();
    }
  };

  if (!isOpen) return null;

  const knownDeployment = currentChainId
    ? KNOWN_DEPLOYMENTS[
        currentChainId.toString() as keyof typeof KNOWN_DEPLOYMENTS
      ]
    : null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Address
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => handleContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {knownDeployment && (
              <p className="mt-1 text-sm text-gray-500">
                Connected to {knownDeployment.name}
              </p>
            )}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!!error}
              className={`px-4 py-2 rounded-md text-white ${
                error ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
