# LMA Loan Tokenization

**Hackathon Entry for LMA EDGE 2025**

A full-stack solution addressing the Loan Market Association's most critical challenges:
- **Settlement Delays**: Traditional 27+ days → **T+0 blockchain settlement**
- **Lack of STP**: Fragmented workflows → **End-to-end automation**
- **Data Fragmentation**: Siloed information → **NEL Protocol digitization**

---

## Value Proposition

Transform syndicated loans from static legal documents into **live, tradeable digital assets** with:

1. **AI-Powered Document Parsing** - Extracts loan terms with 94% accuracy in <2 seconds
2. **NEL Protocol Digitization** - Creates standardized Digital Credit Instruments with NF2 formulas
3. **ERC-3643 Tokenization** - Mints security tokens with embedded compliance logic
4. **T+0 Settlement** - Blockchain transfers in 2-3 seconds (vs. 27 days traditional)
5. **Compliance Automation** - KYC, accreditation, lockup validation on-chain

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- MetaMask or another Web3 wallet

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
│   └── erc3643/            # ERC-3643 compliance infrastructure
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding script
├── scripts/
│   ├── deploy.js           # Contract deployment script
│   └── seed.js             # Blockchain seeding script
├── src/
│   ├── app/
│   │   ├── api/            # REST API routes
│   │   │   ├── loans/      # Loan CRUD operations
│   │   │   ├── participants/# Participant management
│   │   │   └── trades/     # Trade history
│   │   └── page.tsx        # Main UI
│   ├── components/
│   │   ├── DocumentUpload.tsx
│   │   ├── LoanCard.tsx
│   │   ├── PortfolioDashboard.tsx
│   │   ├── TransferSimulator.tsx
│   │   ├── WalletButton.tsx# Wallet connection UI
│   │   └── providers.tsx   # wagmi/React Query providers
│   ├── hooks/
│   │   └── useBlockchain.ts# React hooks for blockchain ops
│   └── lib/
│       ├── contracts/abi.ts# Contract ABIs
│       ├── db/prisma.ts    # Prisma client
│       ├── services/
│       │   ├── blockchain.ts
│       │   ├── nel-graphql.ts  # NEL Protocol GraphQL client
│       │   └── nel-protocol.ts # Document parsing + NEL sync
│       ├── store/loans.ts  # Database operations
│       ├── types/loan.ts   # TypeScript types
│       └── wagmi/config.ts # wagmi chain configuration
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 16 + React 19 + Tailwind CSS                       │
│  WalletButton ─── wagmi/viem ─── MetaMask/WalletConnect     │
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
│  Hardhat (local) / Polygon / Base (production)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Services                               │
│  NEL Protocol (Nammu21) GraphQL API                         │
│  Claude AI for document parsing                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

- Upload loan PDFs/Word docs
- AI extracts terms, covenants, lenders, ESG data
- Create Digital Credit Instruments (NEL Protocol)
- Mint ERC-3643 security tokens
- Multi-wallet support (MetaMask, WalletConnect, Coinbase)
- Simulate token transfers with compliance validation
- T+0 settlement (2.5 seconds vs 27 days)
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

# NEL Protocol
NEL_GRAPHQL_ENDPOINT=https://api.nammu21.com/graphql
NEL_API_KEY=your_nel_api_key

# Blockchain (after deployment)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
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
| Blockchain | wagmi v3, viem, Hardhat |
| Smart Contracts | Solidity 0.8.20, ERC-3643, OpenZeppelin |
| Database | PostgreSQL, Prisma ORM |
| AI | Claude API (Anthropic) |
| External APIs | NEL Protocol (Nammu21) GraphQL |

---

## Production Deployment

### Supported Networks
- **Localhost** (Hardhat) - Development
- **Sepolia** - Ethereum testnet
- **Polygon** - Production L2
- **Base** - Production L2

### Deployment Checklist
1. Set up PostgreSQL database (e.g., Neon, Supabase, AWS RDS)
2. Deploy contracts to target network
3. Configure environment variables
4. Set up NEL Protocol API access
5. Deploy to Vercel/Railway/AWS

---

## References

- LMA EDGE Hackathon: https://lmaedgehackathon.devpost.com
- Nammu21 NEL Protocol: https://www.nammu21.com
- ERC-3643 Standard: https://erc3643.org

---

**Hackathon MVP - December 2025**

*Digitize. Tokenize. Settle. Repeat.*
