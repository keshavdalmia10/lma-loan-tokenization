// Global state management for loans
// Using a simple store pattern for the hackathon MVP

import { v4 as uuidv4 } from 'uuid';
import type { DigitalCreditInstrument, Trade, PortfolioSummary } from '../types/loan';

// In-memory store
let loans: Map<string, DigitalCreditInstrument> = new Map();
let trades: Trade[] = [];

// Initialize with demo data
export function initializeDemoData() {
  if (loans.size > 0) return; // Already initialized
  
  // Add a sample tokenized loan
  const demoLoan: DigitalCreditInstrument = {
    nelId: 'NEL-2024-DEMO001',
    version: '1.0',
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-20'),
    terms: {
      borrowerName: 'Acme Industrial Holdings Ltd.',
      facilityAmount: 250_000_000,
      interestRateBps: 475,
      interestType: 'floating',
      spread: 325,
      referenceRate: 'SOFR',
      maturityDate: new Date('2029-11-15'),
      currency: 'USD',
      facilityType: 'term_loan',
      securityType: 'secured',
      seniorityRank: 'senior'
    },
    covenants: [
      {
        id: uuidv4(),
        type: 'financial',
        name: 'Maximum Leverage Ratio',
        description: 'Total Debt / EBITDA shall not exceed 4.5x',
        threshold: 4.5,
        testingFrequency: 'quarterly',
        currentValue: 3.2,
        status: 'compliant'
      },
      {
        id: uuidv4(),
        type: 'financial',
        name: 'Minimum Interest Coverage',
        description: 'EBITDA / Interest Expense shall not be less than 2.0x',
        threshold: 2.0,
        testingFrequency: 'quarterly',
        currentValue: 2.8,
        status: 'compliant'
      }
    ],
    lenders: [
      {
        lenderId: uuidv4(),
        lenderName: 'JP Morgan Chase',
        commitment: 62_500_000,
        fundedAmount: 62_500_000,
        unfundedAmount: 0,
        percentage: 25,
        isLeadArranger: true
      },
      {
        lenderId: uuidv4(),
        lenderName: 'Bank of America',
        commitment: 50_000_000,
        fundedAmount: 50_000_000,
        unfundedAmount: 0,
        percentage: 20,
        isLeadArranger: false
      }
    ],
    documents: [
      {
        id: uuidv4(),
        filename: 'acme_credit_agreement_2024.pdf',
        uploadedAt: new Date('2024-11-15'),
        status: 'parsed',
        hash: '0x7d8f9a2b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a'
      }
    ],
    nf2Formulas: [
      {
        id: uuidv4(),
        name: 'Interest Payment',
        type: 'obligation',
        description: 'Quarterly interest payment calculation',
        formula: 'PRINCIPAL * (SOFR + SPREAD) * (DAYS / 360)',
        parameters: { spread: 325, dayCount: 'ACT/360' },
        isOnChain: true
      }
    ],
    tokenization: {
      tokenAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f1aB1c',
      tokenSymbol: 'LT-ACME',
      totalUnits: 100,
      unitValue: 2_500_000,
      partition: 'PRIMARY',
      status: 'trading',
      mintedAt: new Date('2024-11-20'),
      blockchain: 'Polygon',
      chainId: 137
    }
  };
  
  loans.set(demoLoan.nelId, demoLoan);
  
  // Add sample trade history
  trades = [
    {
      id: uuidv4(),
      loanId: demoLoan.nelId,
      tokenAddress: demoLoan.tokenization!.tokenAddress!,
      seller: {
        id: uuidv4(),
        name: 'Goldman Sachs Asset Management',
        type: 'fund',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        kycStatus: 'approved',
        accreditedInvestor: true,
        jurisdiction: 'US'
      },
      buyer: {
        id: uuidv4(),
        name: 'BlackRock Fixed Income',
        type: 'fund',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        kycStatus: 'approved',
        accreditedInvestor: true,
        jurisdiction: 'US'
      },
      units: 10,
      pricePerUnit: 2_525_000, // Slight premium
      totalValue: 25_250_000,
      status: 'settled',
      validation: {
        canTransfer: true,
        reasonCode: '0x51',
        reasonDescription: 'Transfer approved',
        checks: [
          { name: 'Sender KYC', passed: true, details: 'Verified' },
          { name: 'Receiver KYC', passed: true, details: 'Verified' },
          { name: 'Accreditation', passed: true, details: 'Confirmed' },
          { name: 'Lockup', passed: true, details: 'Expired' }
        ]
      },
      createdAt: new Date('2024-12-18T10:30:00'),
      settledAt: new Date('2024-12-18T10:30:03'),
      txHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7',
      settlementTime: 3.2
    }
  ];
}

// Store operations
export function addLoan(loan: DigitalCreditInstrument): void {
  loans.set(loan.nelId, loan);
}

export function getLoan(nelId: string): DigitalCreditInstrument | undefined {
  return loans.get(nelId);
}

export function getAllLoans(): DigitalCreditInstrument[] {
  return Array.from(loans.values());
}

export function updateLoan(nelId: string, updates: Partial<DigitalCreditInstrument>): void {
  const existing = loans.get(nelId);
  if (existing) {
    loans.set(nelId, { ...existing, ...updates, updatedAt: new Date() });
  }
}

export function addTrade(trade: Trade): void {
  trades.push(trade);
}

export function getTrades(): Trade[] {
  return trades;
}

export function getPortfolioSummary(): PortfolioSummary {
  const allLoans = getAllLoans();
  const tokenizedLoans = allLoans.filter(l => l.tokenization?.status === 'trading' || l.tokenization?.status === 'minted');
  
  const totalValue = allLoans.reduce((sum, l) => sum + l.terms.facilityAmount, 0);
  const tokenizedValue = tokenizedLoans.reduce((sum, l) => sum + l.terms.facilityAmount, 0);
  
  // Calculate average settlement times
  const tokenizedTrades = trades.filter(t => t.settlementTime !== undefined);
  const avgSettlementTimeTokenized = tokenizedTrades.length > 0
    ? tokenizedTrades.reduce((sum, t) => sum + (t.settlementTime ?? 0), 0) / tokenizedTrades.length
    : 0;
  
  return {
    totalLoans: allLoans.length,
    totalValue,
    tokenizedValue,
    tokenizationRate: totalValue > 0 ? (tokenizedValue / totalValue) * 100 : 0,
    avgSettlementTime: 27, // Traditional: 27 days average
    avgSettlementTimeTokenized, // Tokenized: seconds
    recentTrades: trades.slice(-5).reverse()
  };
}

// Initialize on module load
initializeDemoData();
