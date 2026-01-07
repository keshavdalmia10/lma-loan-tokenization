# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LMA Loan Tokenization is a hackathon MVP for LMA EDGE 2025 that transforms syndicated loans into tradeable digital assets. It combines AI document parsing, NEL Protocol digitization, and ERC-3643 security token standards to enable T+0 blockchain settlement (vs. traditional 27+ day settlement).

**Key Innovation**: "Invisible Crypto" UX - users sign in with Google/Email/Apple, never see wallets, gas fees, or signing prompts. Blockchain is fully abstracted.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # Run ESLint

# Database
npm run db:push          # Push Prisma schema to database
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio GUI

# Smart Contracts (requires Node v20 via nvm)
source ~/.nvm/nvm.sh && nvm use 20
npx hardhat compile                                    # Compile Solidity contracts
npx hardhat run scripts/deploy-light.js --network baseSepolia  # Deploy to Base Sepolia
npx hardhat run scripts/mint-test-token.js --network baseSepolia  # Mint test token

# Local Blockchain
npm run chain:start      # Start local Hardhat node
npm run chain:deploy     # Deploy contracts locally
npm run chain:seed       # Seed blockchain with test data
```

## Architecture

### Data Flow
```
User Login (Privy) → Smart Account (Safe) → Blockchain Service → Smart Contracts
     ↓                      ↓                      ↓
  MPC Wallet          Pimlico Bundler        ERC-3643 Token
  (no seed phrase)    (gas sponsored)        (compliance built-in)
```

### Blockchain Mode Toggle

Controlled by `NEXT_PUBLIC_BLOCKCHAIN_MODE` environment variable:
- `mock`: In-memory simulation (instant, no gas, no real transactions) - default
- `real`: ERC-4337 smart accounts with Pimlico on Base Sepolia

### Key Services

| Service | Purpose |
|---------|---------|
| `src/lib/services/blockchain-factory.ts` | Factory switching between mock/real blockchain |
| `src/lib/services/blockchain-real.ts` | Real ERC-4337 transactions via smart accounts |
| `src/lib/services/blockchain.ts` | Mock blockchain for demos |
| `src/lib/services/smart-account.ts` | Safe smart account creation with Pimlico |
| `src/lib/services/nel-protocol.ts` | Document parsing + NEL Protocol digitization |
| `src/lib/services/claude-parser.ts` | Claude AI document extraction |

### React Hooks

| Hook | Purpose |
|------|---------|
| `useSmartAccount` | Manages Privy embedded wallet → Safe smart account |
| `useBlockchainService` | Returns mock or real service based on mode |
| `useBlockchain` | Legacy hook for direct blockchain operations |

### Invisible Crypto Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Privy (Auth)                                               │
│  - Social login (Google, Email, Apple)                      │
│  - MPC embedded wallet (no seed phrase)                     │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Safe Smart Account (ERC-4337)                              │
│  - Owned by Privy MPC wallet                                │
│  - All transactions are UserOperations                      │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Pimlico (Bundler + Paymaster)                              │
│  - Bundles UserOperations                                   │
│  - Sponsors all gas fees (users pay nothing)                │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Base Sepolia (Target Chain)                                │
│  - ERC-3643 LoanToken contracts                             │
│  - Identity Registry + Compliance modules                   │
└─────────────────────────────────────────────────────────────┘
```

### Smart Contracts (Solidity 0.8.20)

- **`contracts/LoanToken.sol`**: ERC-3643 token with partitioned balances, freeze/pause, compliance
- **`contracts/LoanTokenFactoryLight.sol`**: Lightweight factory for tracking deployed tokens
- **`contracts/erc3643/`**: IdentityRegistry, Compliance, TrustedIssuersRegistry, ClaimTopicsRegistry

### ERC-3643 Compliance Model

Transfers require:
1. Sender/receiver verified in `IdentityRegistry` with valid claims (KYC, Accreditation)
2. Claims signed by trusted issuers from `TrustedIssuersRegistry`
3. Compliance module rules pass (country restrictions, lockup periods)
4. Address not frozen, tokens not locked

### Type System

All domain types in `src/lib/types/loan.ts`:
- `DigitalCreditInstrument`: NEL Protocol representation with terms, covenants, lenders
- `TokenizationData`: Blockchain token metadata including ERC-3643 registry addresses
- `TransferValidation`: EIP-1066 compatible transfer check results
- `CLAIM_TOPICS`: Standard claim identifiers (KYC=1, ACCREDITATION=2, etc.)

## Deployed Contracts (Base Sepolia)

```
LoanTokenFactoryLight:    0x0A111950eBfC20dB3Da9107cB596974dA4D86b1c
ClaimTopicsRegistry:      0x00c42F59E705e64c81afd03CD04d62Ebd07F5282
TrustedIssuersRegistry:   0x5B5248B33c36192f2AdbCd5e4C81E7edC72A760d
```

## Environment Variables

Key variables in `.env.local`:
```bash
# Blockchain Mode
NEXT_PUBLIC_BLOCKCHAIN_MODE=mock  # 'mock' or 'real'

# Privy (Auth + Embedded Wallets)
NEXT_PUBLIC_PRIVY_APP_ID=

# Pimlico (ERC-4337 Bundler + Paymaster)
NEXT_PUBLIC_PIMLICO_API_KEY=

# Base Sepolia Contracts
NEXT_PUBLIC_FACTORY_ADDRESS_BASE_SEPOLIA=
NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY_BASE_SEPOLIA=
NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY_BASE_SEPOLIA=

# AI + External APIs
ANTHROPIC_API_KEY=
NEL_GRAPHQL_ENDPOINT=
```

## Frontend Components

- **`AuthButton.tsx`**: Privy login (replaces WalletButton for invisible crypto)
- **`AuthGate.tsx`**: Wraps protected content requiring authentication
- **`TransferSimulator.tsx`**: Token transfer with compliance validation
- **`DocumentUpload.tsx`**: Loan document upload with AI parsing
- **`PortfolioDashboard.tsx`**: Portfolio KPIs and loan cards
