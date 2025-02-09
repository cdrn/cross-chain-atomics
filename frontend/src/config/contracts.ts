import { Contract } from "ethers";

// Known deployments on different networks
export const KNOWN_DEPLOYMENTS = {
  // Mainnet
  "1": {
    name: "Ethereum Mainnet",
    address: undefined,
  },
  // Sepolia
  "11155111": {
    name: "Sepolia Testnet",
    address: "0x736256B2e80Ed963ED7000269c6Fe8060c106E28",
  },
  // Hardhat
  "31337": {
    name: "Hardhat Local",
    address: undefined,
  },
} as const;

export const ATOMIC_SWAP_ABI = [
  // Create Swap
  "function createSwap(address payable maker, bytes32 hashlock, uint256 timelock, uint256 premium) external payable returns (bytes32)",

  // Claim Swap
  "function claim(bytes32 swapId, bytes32 secret) external",

  // Refund Swap
  "function refund(bytes32 swapId) external",

  // Get Swap Details
  "function getSwap(bytes32 swapId) external view returns (address taker, address maker, uint256 value, uint256 premium, bytes32 hashlock, uint256 timelock, bool claimed, bool refunded)",

  // Swap mapping
  "function swaps(bytes32) external view returns (address payable taker, address payable maker, uint256 value, uint256 premium, bytes32 hashlock, uint256 timelock, bool claimed, bool refunded)",

  // Events
  "event SwapCreated(bytes32 indexed swapId, address indexed taker, address indexed maker, uint256 value, uint256 premium, bytes32 hashlock, uint256 timelock)",
  "event SwapClaimed(bytes32 indexed swapId, bytes32 secret)",
  "event SwapRefunded(bytes32 indexed swapId)",
];
