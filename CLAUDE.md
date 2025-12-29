# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LMA Loan Tokenization is a hackathon MVP for LMA EDGE 2025 that transforms syndicated loans into tradeable digital assets. It combines AI document parsing, NEL Protocol digitization, and ERC-3643 security token standards to enable T+0 blockchain settlement (vs. traditional 27+ day settlement).

## Commands

```bash
npm run dev      # Start Next.js development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npx hardhat compile  # Compile Solidity contracts
```

## Architecture

### Data Flow
```
UI (Next.js) → NEL Protocol Service → Blockchain Service → Smart Contracts
```

1. **Document Upload**: User uploads loan PDF/Word docs
2. **AI Parsing**: Claude API extracts loan terms via `/api/parse-document` route
3. **NEL Digitization**: Creates `DigitalCreditInstrument` with NF2 formulas
4. **Tokenization**: Mints ERC-3643 security tokens with compliance logic
5. **Trading**: Validates transfers via on-chain identity registry and compliance modules

### Key Services

- **`src/lib/services/nel-protocol.ts`**: Document parsing (real Claude API with mock fallback), creates `DigitalCreditInstrument` objects with NF2 formulas for rights/obligations/conditions
- **`src/lib/services/blockchain.ts`**: Mock ERC-3643 transfer validation with claim-based identity verification, manages token balances and trade history
- **`src/lib/services/claude-parser.ts`**: Claude AI integration for document extraction

### Smart Contracts (Solidity 0.8.20)

- **`contracts/LoanToken.sol`**: Main ERC-3643 token with partitioned balances, freeze/pause, controller operations, and claim-based compliance
- **`contracts/erc3643/`**: Supporting contracts (IdentityRegistry, Compliance, TrustedIssuersRegistry, ClaimTopicsRegistry)

### ERC-3643 Compliance Model

Transfers require:
1. Sender/receiver verified in `IdentityRegistry` with valid claims (KYC, Accreditation)
2. Claims signed by trusted issuers from `TrustedIssuersRegistry`
3. Compliance module rules pass (country restrictions, lockup periods, max balance)
4. Address not frozen, tokens not locked

### Type System

All domain types in `src/lib/types/loan.ts`:
- `DigitalCreditInstrument`: NEL Protocol representation with terms, covenants, lenders, ESG data
- `TokenizationData`: Blockchain token metadata including ERC-3643 registry addresses
- `TransferValidation`: EIP-1066 compatible transfer check results
- `CLAIM_TOPICS`: Standard claim identifiers (KYC=1, ACCREDITATION=2, etc.)

### State Management

- **`src/lib/store/loans.ts`**: In-memory loan store (would be PostgreSQL in production)
- Blockchain service maintains mock token balances, trade history, and identity registry

## Frontend Structure

- **`src/app/page.tsx`**: Main page with Dashboard/Upload tabs
- **`src/components/DocumentUpload.tsx`**: Loan document upload with AI parsing
- **`src/components/PortfolioDashboard.tsx`**: Portfolio KPIs and loan cards
- **`src/components/TransferSimulator.tsx`**: Token transfer with compliance validation
- **`src/components/LoanCard.tsx`**: Individual loan display with tokenization actions
