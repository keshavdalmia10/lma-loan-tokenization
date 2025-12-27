# Implementation Guide: LMA Loan Tokenization MVP

## Overview

This MVP implements a complete flow from physical loan documents to tokenized, tradeable digital assets that settle in seconds.

---

## System Components

### 1. Frontend (Next.js 14 + TypeScript)
**File**: `src/app/page.tsx`

- **Dashboard View**: Portfolio KPIs, recent trades, impact metrics
- **Upload View**: Drag-drop loan documents, shows progress
- **Responsive Design**: Mobile-friendly with Tailwind CSS

**Key Components**:
- `DocumentUpload.tsx`: File upload with mock AI parsing
- `PortfolioDashboard.tsx`: Real-time KPI dashboard
- `LoanCard.tsx`: Individual loan display with details
- `TransferSimulator.tsx`: Interactive transfer validation demo

### 2. NEL Protocol Service
**File**: `src/lib/services/nel-protocol.ts`

Simulates Nammu21's API endpoints:

```typescript
// Parse loan documents (AI)
parseDocument(file: File) → {
  terms: LoanTerms,
  covenants: Covenant[],
  lenders: LenderPosition[],
  esg?: ESGData,
  confidence: number
}

// Create Digital Credit Instrument
createDigitalCreditInstrument() → DigitalCreditInstrument

// Query NEL Protocol
queryNelProtocol(query: string, variables?: {}) → unknown

// Calculate document hash
calculateDocumentHash(content: ArrayBuffer) → string
```

**Data Model**:
- `LoanTerms`: Facility amount, interest, maturity, type, collateral
- `Covenant`: Financial/affirmative/negative with thresholds
- `LenderPosition`: Syndicate members with %commitments
- `NF2Formula`: Encoded business logic for smart contracts
- `TokenizationData`: On-chain token metadata

### 3. Blockchain Service
**File**: `src/lib/services/blockchain.ts`

Simulates ERC-3643 token operations and transfer validation:

```typescript
// Mint security tokens
mintLoanToken(nelId, terms, documentHash, totalUnits)
  → TokenizationData

// Validate transfer compliance
validateTransfer(tokenAddr, from, to, units)
  → TransferValidation {
    canTransfer: boolean,
    reasonCode: string,
    checks: ComplianceCheck[]
  }

// Execute transfer (T+0 settlement)
executeTransfer(tokenAddr, from, to, units, pricePerUnit)
  → Trade {
    id, seller, buyer, units, totalValue, 
    status: 'settled', settlementTime: 2.5
  }
```

**Compliance Checks** (ERC-1594):
1. Sender KYC approved? ✓
2. Receiver KYC approved? ✓
3. Receiver accredited investor? ✓
4. Sender lockup expired? ✓
5. Sufficient balance? ✓
6. Valid jurisdiction? ✓

### 4. Smart Contracts
**File**: `contracts/LoanToken.sol`

ERC-3643 security token implementation:

```solidity
contract LoanToken {
  // ERC-1410: Partitioned balances
  balanceOfByPartition(bytes32 partition, address holder) → uint256
  transferByPartition(bytes32 partition, address to, uint256 value) → bytes32
  
  // ERC-1594: Transfer validation
  canTransfer(address to, uint256 value) → (bytes1 code, bytes32 reason)
  canTransferByPartition(bytes32 partition, address to, uint256 value)
  
  // ERC-1643: Document management
  setDocument(bytes32 name, string uri, bytes32 hash)
  getDocument(bytes32 name) → (string uri, bytes32 hash, uint256 modified)
  
  // ERC-1644: Controller operations
  controllerTransfer(address from, address to, uint256 value, ...)
  
  // Compliance
  setKYCStatus(address account, bool approved)
  setAccreditedStatus(address account, bool accredited)
  setLockup(address account, uint256 endTime)
}
```

**Key Features**:
- Partitioned balances (PRIMARY/SECONDARY) for investor tiers
- Embedded KYC/accreditation checks
- Lockup period enforcement
- Document hash linking to NEL Protocol
- NF2 formula execution via smart contracts

### 5. Global Store
**File**: `src/lib/store/loans.ts`

In-memory state management for hackathon demo:

```typescript
addLoan(loan: DigitalCreditInstrument)
getLoan(nelId: string) → DigitalCreditInstrument
getAllLoans() → DigitalCreditInstrument[]
updateLoan(nelId: string, updates: Partial<DigitalCreditInstrument>)

addTrade(trade: Trade)
getTrades() → Trade[]

getPortfolioSummary() → {
  totalLoans, totalValue, tokenizedValue,
  tokenizationRate, avgSettlementTime, recentTrades
}
```

**Demo Data**: Pre-loaded Acme Industrial loan with sample trades

---

## Data Flow: End-to-End

### Step 1: Document Upload
```
User uploads PDF
  ↓
parseDocument() extracts terms, covenants, lenders
  ↓
calculateDocumentHash() creates on-chain reference
  ↓
createDigitalCreditInstrument() packages as Digital Credit Instrument
  ↓
addLoan() stores in global state
  ↓
Dashboard updates with new loan
```

### Step 2: Tokenization
```
User clicks "Tokenize"
  ↓
mintLoanToken() creates ERC-3643 contract
  ↓
Generates token address + symbol (LT-BORROWER)
  ↓
Initializes 100 units @ (facilityAmount / 100) per unit
  ↓
updateLoan() sets tokenization status to 'trading'
  ↓
User can now transfer units
```

### Step 3: Transfer & Settlement
```
User specifies: 10 units @ $2.525M to Buyer
  ↓
validateTransfer() checks all 6 compliance rules
  ↓
All pass → canTransfer = true
  ↓
executeTransfer() updates balances
  ↓
Creates Trade record with 2.5s settlement time
  ↓
addTrade() logs to history
  ↓
Dashboard real-time updates
```

---

## API Endpoints (Future)

For production, these would be API routes:

```typescript
// POST /api/documents/parse
// Upload loan doc → Extract terms via AI

// POST /api/loans
// Create Digital Credit Instrument from parsed data

// POST /api/loans/:nelId/tokenize
// Mint ERC-3643 token for loan

// POST /api/tokens/:tokenAddr/transfer
// Validate & execute transfer

// GET /api/loans
// List all loans with pagination

// GET /api/trades
// Get trade history with filters

// GET /api/portfolio/summary
// Portfolio KPIs and metrics
```

---

## Production Roadmap

### Phase 1: Core (Current MVP)
- ✅ AI document parsing
- ✅ NEL Protocol digitization
- ✅ ERC-3643 tokenization
- ✅ T+0 settlement simulation
- ✅ Compliance validation

### Phase 2: Backend Integration
- [ ] OpenAI GPT-4 API for document parsing
- [ ] PostgreSQL for persistent storage
- [ ] Nammu21 GraphQL API for NEL data
- [ ] Polygon mainnet deployment
- [ ] wagmi + viem for wallet integration

### Phase 3: Enterprise Features
- [ ] Multi-signature workflows
- [ ] KYC/AML integration (Refinitiv)
- [ ] Covenant monitoring dashboard
- [ ] Cross-border settlement
- [ ] ESG verification oracle
- [ ] Syndicate portal

### Phase 4: Ecosystem
- [ ] LMA Automate integration
- [ ] Secondary marketplace
- [ ] DeFi composability
- [ ] Regulatory reporting
- [ ] Analytics engine

---

## Testing Scenarios

### Test 1: Happy Path
```
1. Upload "AcmeCorp_Loan_2024.pdf"
   → Parses to $250M, 4.75%, 5-year
2. Click "Tokenize"
   → 100 units created @ $2.5M each
3. Transfer 10 units GS → BlackRock
   → All compliance checks pass
4. Settlement completes in 2.5 seconds
   → Portfolio updates
```

### Test 2: Compliance Rejection
```
1. Select "Pending Investor" as buyer
2. Try to transfer 5 units
3. Validation fails: "KYC not approved"
4. Transfer rejected ❌
```

### Test 3: Lockup Period
```
1. Set seller with lockup expiring tomorrow
2. Try to transfer units today
3. Validation fails: "Lockup period active"
4. Transfer blocked ❌
```

### Test 4: Multiple Loans
```
1. Upload 3 different loan documents
2. Tokenize all of them
3. Dashboard shows:
   - Total Loans: 3
   - Portfolio Value: Sum of all facilities
   - Tokenization Rate: 100%
   - 2 sample trades visible
```

---

## Mock Data Reference

### Sample Borrowers
- Acme Industrial Holdings Ltd. ($250M)
- Global Manufacturing Corp. ($180M)
- European Tech Solutions GmbH ($320M)

### Sample Lenders
- JP Morgan Chase (25%)
- Bank of America (20%)
- Barclays (20%)
- Deutsche Bank (15%)
- Credit Suisse (20%)

### Sample Participants
- Goldman Sachs Asset Management (Approved, Accredited)
- BlackRock Fixed Income (Approved, Accredited)
- Deutsche Bank Trading (Approved, Accredited)
- Pending Investor LLC (Pending, Not Accredited)

---

## Configuration

### Environment Variables (Future)
```
NEXT_PUBLIC_ALCHEMY_API_KEY=...
NEXT_PUBLIC_WAGMI_PROJECT_ID=...
OPENAI_API_KEY=...
NAMMU21_API_KEY=...
DATABASE_URL=...
```

### Network Config
- **Development**: Hardhat local (chainId: 31337)
- **Testnet**: Polygon Mumbai (chainId: 80002)
- **Mainnet**: Polygon (chainId: 137)

---

## Deployment

### Development
```bash
npm run dev  # Runs on localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --legacy-peer-deps
RUN npm run build
EXPOSE 3000
CMD npm start
```

---

## Troubleshooting

**Issue**: Build fails with TypeScript errors
**Solution**: Ensure all UI components have proper type definitions

**Issue**: Document parsing times out
**Solution**: Increase timeout in nel-protocol.ts, or implement chunked processing

**Issue**: Transfer validation always fails
**Solution**: Check mock participant KYC/accreditation status in blockchain.ts

**Issue**: Port 3000 already in use
**Solution**: 
```bash
PORT=3001 npm run dev
# or
lsof -i :3000 && kill -9 <PID>
```

---

## Performance Metrics

**Current Performance**:
- Document parsing: ~2 seconds (mocked)
- Tokenization: ~1.5 seconds (mocked)
- Transfer validation: ~0.5 seconds
- Settlement: 2.5 seconds (vs 27 days traditional)
- Portfolio dashboard load: <1 second

**Scalability** (with production infrastructure):
- Handle 10,000+ loans
- Process 1,000+ trades/day
- Support 100+ syndicate members per facility
- Real-time settlement with <500ms latency

---

## Support

For questions on:
- **LMA Standards**: See LMA.Automate docs
- **NEL Protocol**: Register at nammu21.com
- **ERC-3643**: GitHub SecurityTokenStandard/EIP-Spec
- **Next.js**: nextjs.org documentation

---

**Last Updated**: December 26, 2025  
**Hackathon**: LMA EDGE 2025
