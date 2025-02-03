# Cross-Chain Atomics

A platform for executing cross-chain atomic swaps between Bitcoin and Ethereum.

## Project Structure

- `backend/` - Server handling Bitcoin operations, pricing, and orderbook
- `frontend/` - Web interface for interacting with atomic swaps
- `contracts/` - Ethereum smart contracts for atomic swap functionality

## Development Setup

1. Install dependencies:
```bash
# Install backend dependencies
cd backend && npm install
cd ..

# Install frontend dependencies
cd frontend && npm install
cd ..
```

2. Start development:
```bash
# Start backend
npm run dev

# In another terminal, start frontend
npm run dev:frontend
```

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## Requirements

- Node.js >= 18.0.0
- Ethereum development environment (e.g., Hardhat)
- Bitcoin Core (for mainnet/testnet) or btcd (for development)
