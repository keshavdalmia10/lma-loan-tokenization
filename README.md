# LMA Loan Tokenization

**Hackathon Entry for LMA EDGE 2025**

A full-stack solution addressing the Loan Market Association's most critical challenges:
- **Settlement Delays**: Traditional 27+ days → **T+0 blockchain settlement**
- **Lack of STP**: Fragmented workflows → **End-to-end automation**
- **Data Fragmentation**: Siloed information → **NEL Protocol digitization**

---

## Value Proposition

Transform syndicated loans from static legal documents into **live, tradeable digital assets** with:

1. **AI-Powered Document Parsing** - Claude AI extracts loan terms with high accuracy in seconds
2. **NEL Protocol Digitization** - Creates standardized Digital Credit Instruments with NF2 formulas
3. **ERC-3643 Tokenization** - Mints security tokens with embedded compliance logic
4. **T+0 Settlement** - Blockchain transfers in 2-3 seconds (vs. 27 days traditional)
5. **Invisible Crypto UX** - Web2-style sign-in with Privy, gasless transactions via ERC-4337

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- Privy account (for authentication) - https://privy.io
- Pimlico account (for gas sponsorship) - https://pimlico.io (optional)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and API keys

# Push database schema
npm run db:push

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

Open http://localhost:3000

### With Local Blockchain (Full Demo)

```bash
# Terminal 1: Start local Hardhat node
npm run chain:start

# Terminal 2: Deploy contracts and seed blockchain
npm run chain:deploy
npm run chain:seed

# Copy contract addresses from output to .env:
# NEXT_PUBLIC_FACTORY_ADDRESS=0x...
# NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY=0x...
# NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY=0x...

# Start the app
npm run dev
```

---

## Project Structure

```
├── contracts/              # Solidity smart contracts
│   ├── LoanToken.sol       # ERC-3643 security token
│   ├── LoanTokenFactory.sol# Factory for deploying tokens
│   ├── LoanTokenFactoryLight.sol # Lightweight factory variant
│   └── erc3643/            # ERC-3643 compliance infrastructure
│       ├── ClaimTopicsRegistry.sol
│       ├── Compliance.sol
│       ├── IdentityRegistry.sol
│       └── TrustedIssuersRegistry.sol
├── prisma/
│   ├── schema.prisma       # Database schema (Loan, Trade, Participant, etc.)
│   ├── seed.ts             # Database seeding script
│   └── migrations/         # Database migrations
├── scripts/
│   ├── deploy.js           # Contract deployment script
│   ├── deploy-light.js     # Lightweight deployment
│   └── seed.js             # Blockchain seeding script
├── src/
│   ├── app/
│   │   ├── api/            # REST API routes
│   │   │   ├── loans/      # Loan CRUD operations
│   │   │   ├── parse-document/ # AI document parsing
│   │   │   ├── participants/# Participant management
│   │   │   └── trades/     # Trade history
│   │   └── page.tsx        # Main UI with tabs
│   ├── components/
│   │   ├── AuthButton.tsx      # Web2-style sign-in (Privy)
│   │   ├── AuthGate.tsx        # Auth wrapper component
│   │   ├── DocumentUpload.tsx  # AI-powered document upload
│   │   ├── LoanCard.tsx        # Loan display component
│   │   ├── PortfolioDashboard.tsx # Portfolio KPIs
│   │   ├── TransferSimulator.tsx  # Transfer demo with compliance
│   │   └── providers.tsx       # React Query + Privy providers
│   ├── hooks/
│   │   ├── useBlockchain.ts       # Blockchain operations hook
│   │   ├── useBlockchainService.ts # Mock/live service hook
│   │   └── useSmartAccount.ts     # ERC-4337 smart account hook
│   └── lib/
│       ├── contracts/abi.ts   # Contract ABIs
│       ├── db/prisma.ts       # Prisma client
│       ├── privy/config.ts    # Privy auth configuration
│       ├── services/
│       │   ├── blockchain.ts        # Mock blockchain service
│       │   ├── blockchain-real.ts   # Real blockchain integration
│       │   ├── blockchain-factory.ts # Service factory
│       │   ├── claude-parser.ts     # Claude AI document parsing
│       │   ├── smart-account.ts     # ERC-4337 Safe smart accounts
│       │   ├── nel-graphql.ts       # NEL Protocol GraphQL client
│       │   └── nel-protocol.ts      # NEL Protocol service
│       ├── store/loans.ts     # Database operations
│       ├── types/loan.ts      # TypeScript types
│       └── wagmi/config.ts    # wagmi chain configuration
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 16 + React 19 + Tailwind CSS                       │
│  AuthButton (Privy) ─── Smart Accounts (ERC-4337)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Authentication Layer                         │
│  Privy (Email/Google/Apple) → Embedded MPC Wallet           │
│  → Safe Smart Account (ERC-4337) → Pimlico Gas Sponsorship  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      API Layer                               │
│  /api/loans    /api/participants    /api/trades             │
│  /api/parse-document (Claude AI)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Data Layer                                 │
│  PostgreSQL + Prisma ORM                                    │
│  Loan, Participant, Trade, Tokenization models              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Blockchain Layer                               │
│  ERC-3643 LoanToken + IdentityRegistry + Compliance         │
│  Hardhat (local) / Base Sepolia / Base (production)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Services                               │
│  NEL Protocol (Nammu21) GraphQL API                         │
│  Claude AI for document parsing                             │
│  Pimlico bundler/paymaster (ERC-4337)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

- **Invisible Crypto UX** - Web2-style sign-in (email, Google, Apple) via Privy
- **Gasless Transactions** - ERC-4337 smart accounts with Pimlico gas sponsorship
- Upload loan PDFs/Word docs for AI-powered extraction
- Claude AI extracts terms, covenants, lenders, ESG data
- Create Digital Credit Instruments (NEL Protocol)
- Mint ERC-3643 security tokens with on-chain compliance
- Simulate token transfers with 6-point compliance validation
- T+0 settlement (2-3 seconds vs 27 days traditional)
- Real-time portfolio dashboard with KPIs
- Trade history with settlement times

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset and reseed database |
| `npm run chain:start` | Start local Hardhat node |
| `npm run chain:deploy` | Deploy contracts to local network |
| `npm run chain:seed` | Seed blockchain with sample data |
| `npm run setup:local` | Full local setup (db + chain) |

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/lma_loans"

# AI (for document parsing)
ANTHROPIC_API_KEY=sk-ant-...

# Authentication (Privy)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Account Abstraction (Pimlico - for gasless transactions)
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key

# Chain Configuration
NEXT_PUBLIC_CHAIN=baseSepolia  # or "base" for mainnet
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# NEL Protocol
NEL_GRAPHQL_ENDPOINT=https://api.nammu21.com/graphql
NEL_API_KEY=your_nel_api_key

# Blockchain (after deployment)
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY=0x...
NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY=0x...
```

---

## Demo Data

Pre-loaded loan: **Acme Industrial Holdings** ($250M, 4.75% floating, 5-year)
- Tokenized into 100 units @ $2.5M each
- Sample trade history showing 2.5s settlements
- Verified participants (Goldman Sachs, BlackRock, Deutsche Bank)
- ERC-3643 identity claims (KYC, Accreditation, Jurisdiction)

---

## LMA Problem → Solution

| Problem | Solution | Impact |
|---------|----------|--------|
| Settlement delays (27+ days) | Blockchain T+0 | 99.7% faster |
| No STP (manual workflows) | End-to-end automation | Instant processing |
| Data fragmentation | NEL Protocol standard | Single source of truth |
| Compliance delays | Smart contract rules | Automatic validation |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Authentication | Privy (embedded wallets, social login) |
| Account Abstraction | ERC-4337, Safe Smart Accounts, Pimlico |
| Blockchain | wagmi v3, viem, Hardhat |
| Smart Contracts | Solidity 0.8.20, ERC-3643, OpenZeppelin |
| Database | PostgreSQL, Prisma ORM |
| AI | Claude API (Anthropic) |
| External APIs | NEL Protocol (Nammu21) GraphQL |

---

## Production Deployment

### Supported Networks
- **Localhost** (Hardhat) - Development
- **Base Sepolia** - Testnet (recommended for testing)
- **Base** - Production L2 (recommended)
- **Sepolia** - Ethereum testnet
- **Polygon** - Production L2

### Deployment Checklist
1. Set up PostgreSQL database (e.g., Neon, Supabase, AWS RDS)
2. Configure Privy app at https://console.privy.io
3. Set up Pimlico paymaster at https://dashboard.pimlico.io
4. Deploy contracts to target network
5. Configure environment variables
6. Set up NEL Protocol API access
7. Deploy to Vercel/Railway/AWS

---

## References

- LMA EDGE Hackathon: https://lmaedgehackathon.devpost.com
- Nammu21 NEL Protocol: https://www.nammu21.com
- ERC-3643 Standard: https://erc3643.org
- Privy Documentation: https://docs.privy.io
- Pimlico Documentation: https://docs.pimlico.io

---

**Hackathon MVP - January 2026**

*Digitize. Tokenize. Settle. Repeat.*
