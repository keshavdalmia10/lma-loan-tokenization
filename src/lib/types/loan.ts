// Loan data types matching NEL Protocol schema
// Updated for ERC-3643 compliance with claim-based verification

export interface LoanDocument {
  id: string;
  filename: string;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'parsed' | 'error';
  hash?: string;
}

export interface LoanTerms {
  borrowerName: string;
  facilityAmount: number; // USD
  interestRateBps: number; // Basis points (500 = 5%)
  interestType: 'fixed' | 'floating';
  spread?: number; // BPS over reference rate
  referenceRate?: string; // SOFR, EURIBOR, etc.
  maturityDate: Date;
  currency: string;
  facilityType: 'term_loan' | 'revolver' | 'delayed_draw' | 'bridge';
  securityType: 'secured' | 'unsecured';
  seniorityRank: 'senior' | 'subordinated' | 'mezzanine';
}

export interface Covenant {
  id: string;
  type: 'financial' | 'affirmative' | 'negative' | 'reporting';
  name: string;
  description: string;
  threshold?: number;
  testingFrequency: 'monthly' | 'quarterly' | 'annually';
  currentValue?: number;
  status: 'compliant' | 'warning' | 'breach' | 'pending';
}

export interface LenderPosition {
  lenderId: string;
  lenderName: string;
  commitment: number; // USD
  fundedAmount: number;
  unfundedAmount: number;
  percentage: number; // Share of total facility
  isLeadArranger: boolean;
}

export interface ESGData {
  hasESGLinking: boolean;
  sustainabilityCoordinator?: string;
  kpis: ESGKpi[];
  marginAdjustment?: number; // BPS
}

export interface ESGKpi {
  id: string;
  metric: string;
  target: number;
  current?: number;
  unit: string;
  status: 'on_track' | 'at_risk' | 'missed' | 'pending';
}

// NEL Protocol Digital Credit Instrument
export interface DigitalCreditInstrument {
  nelId: string; // Unique NEL Protocol identifier
  version: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Core loan data
  terms: LoanTerms;
  covenants: Covenant[];
  lenders: LenderPosition[];
  esg?: ESGData;
  
  // Source documents
  documents: LoanDocument[];
  
  // NF2 Feature Formulas (encoded business logic)
  nf2Formulas: NF2Formula[];
  
  // Tokenization status
  tokenization?: TokenizationData;
}

export interface NF2Formula {
  id: string;
  name: string;
  type: 'right' | 'obligation' | 'condition' | 'trigger';
  description: string;
  formula: string; // Encoded logic
  parameters: Record<string, unknown>;
  isOnChain: boolean;
}

export interface TokenizationData {
  tokenAddress?: string;
  tokenSymbol: string;
  totalUnits: number;
  unitValue: number; // USD per unit
  partition: 'PRIMARY' | 'SECONDARY';
  status: 'pending' | 'minted' | 'trading' | 'redeemed';
  mintedAt?: Date;
  blockchain: string;
  chainId: number;
  // ERC-3643 infrastructure addresses
  identityRegistry?: string;
  compliance?: string;
}

// ============ ERC-3643 Types ============

/**
 * ERC-3643 Claim Topics
 * Standard claim identifiers for security token compliance
 */
export const CLAIM_TOPICS = {
  KYC: 1,
  ACCREDITATION: 2,
  JURISDICTION: 3,
  AML: 4,
  QUALIFIED_INVESTOR: 5
} as const;

export type ClaimTopic = typeof CLAIM_TOPICS[keyof typeof CLAIM_TOPICS];

/**
 * Identity Claim - ERC-3643 claim structure
 * Represents a verified attestation from a trusted issuer
 */
export interface IdentityClaim {
  topic: ClaimTopic;
  issuer: string; // Trusted issuer address
  isValid: boolean;
  signature?: string;
  data?: string;
  uri?: string;
  expiresAt?: Date;
}

/**
 * On-Chain Identity (ONCHAINID compatible)
 * Represents an investor's verified on-chain identity
 */
export interface OnChainIdentity {
  contractAddress: string;
  walletAddress: string;
  claims: IdentityClaim[];
  country: number; // ISO 3166-1 numeric
  isVerified: boolean;
}

/**
 * Trusted Issuer
 * Entity authorized to issue claims for specific topics
 */
export interface TrustedIssuer {
  address: string;
  name: string;
  claimTopics: ClaimTopic[];
}

/**
 * Compliance Rule - ERC-3643 modular compliance
 * Configurable rules for the Compliance contract
 */
export interface ComplianceRule {
  id: string;
  name: string;
  type: 'country_restriction' | 'max_holders' | 'transfer_limit' | 'lockup' | 'max_balance';
  enabled: boolean;
  parameters: Record<string, unknown>;
}

// Transfer validation result (ERC-3643 compatible)
export interface TransferValidation {
  canTransfer: boolean;
  reasonCode: string;
  reasonDescription: string;
  checks: ComplianceCheck[];
}

export interface ComplianceCheck {
  name: string;
  passed: boolean;
  details: string;
}

export type TradeWorkflowRole = 'trader' | 'checker' | 'agent';

export type TradeWorkflowActor = {
  role: TradeWorkflowRole;
  wallet: string;
};

export type TradeStatus =
  | 'pending'
  | 'validating'
  | 'proposed'
  | 'approved'
  | 'executed'
  | 'settled'
  | 'rejected'
  | 'expired';

export type TradeWorkflowEvent = {
  from: TradeStatus | 'none';
  to: TradeStatus;
  at: string; // ISO timestamp
  actor: TradeWorkflowActor;
  reason?: string;
};

export type TradeWorkflow = {
  version: 1;
  history: TradeWorkflowEvent[];
  proposedBy?: TradeWorkflowActor;
  approvedBy?: TradeWorkflowActor;
  rejectedBy?: TradeWorkflowActor;
  executedBy?: TradeWorkflowActor;
};

// Participant/Investor types - Updated for ERC-3643
export interface Participant {
  id: string;
  name: string;
  type: 'bank' | 'fund' | 'insurance' | 'pension' | 'corporate' | 'sovereign';
  walletAddress?: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  accreditedInvestor: boolean;
  jurisdiction: string;
  lockupEndDate?: Date;
  // ERC-3643 identity data
  identityContract?: string;
  claims?: IdentityClaim[];
}

// Trade/Transfer types
export interface Trade {
  id: string;
  loanId: string;
  tokenAddress: string;
  seller: Participant;
  buyer: Participant;
  units: number;
  pricePerUnit: number;
  totalValue: number;
  status: TradeStatus;
  validation?: TransferValidation;
  workflow?: TradeWorkflow;
  createdAt: Date;
  settledAt?: Date;
  txHash?: string;
  settlementTime?: number; // seconds (for T+0 demo)
}

// Dashboard aggregates
export interface PortfolioSummary {
  totalLoans: number;
  totalValue: number;
  tokenizedValue: number;
  tokenizationRate: number;
  avgSettlementTime: number; // days
  avgSettlementTimeTokenized: number; // seconds
  recentTrades: Trade[];
}
