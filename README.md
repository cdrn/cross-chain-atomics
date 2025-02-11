# Cross-Chain Atomics

[![Test](https://github.com/cdrn/cross-chain-atomics/actions/workflows/test.yml/badge.svg)](https://github.com/cdrn/cross-chain-atomics/actions/workflows/test.yml)
[![Lint](https://github.com/cdrn/cross-chain-atomics/actions/workflows/lint.yml/badge.svg)](https://github.com/cdrn/cross-chain-atomics/actions/workflows/lint.yml)

A platform for executing cross-chain atomic swaps between Bitcoin and Ethereum. This is an attempt to create feasible cross chain atomic swaps by pricing in volatility up to the duration of the commited timelock. Here's a quick overview of how it should work.

```
Taker (has ETH)                    Maker (has BTC)
|                                     |
|-- Request quote ------------------>.|
|                                     |
|<-- Quote (amount, premium, t) ------|
|                                     |
|-- Accept quote ------------------->.|
|                                     |
|                                     |-- Generate secret (s) ------->|
|                                     |-- Calculate hash (h=H(s)) --->|
|                                     |
|                                     |-- Lock BTC with (h,t1) ----->|
|                                     |
|<---- Notify BTC locked -------------|
|                                     |
|-- Lock ETH with (h,t2) ------------>|
|                                     |
|<---- Verify ETH locked -------------|
|                                     |
|<---- Maker claims ETH with s -------|
|                                     |
|-- Observe s on ETH chain ---------->|
|                                     |
|-- Claim BTC with revealed s ------->|
```

The `Maker`'s price in the first pass should be determined by the scholes-equation over the period of the timelock. In this way, we're attempting to "price in" the volatility of the asset pair for the period of the time lock. This should economically incentivise the maker to follow through with the swap.

`Takers` are disincetivised from wasting `Makers`' time through the provisioning of an upfront fee to generate a quote and create an order.

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
