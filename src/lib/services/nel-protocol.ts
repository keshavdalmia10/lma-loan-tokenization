// Mock NEL Protocol service simulating Nammu21's API
// In production, this would connect to the actual NEL Protocol GraphQL API

import { v4 as uuidv4 } from 'uuid';
import type { 
  DigitalCreditInstrument, 
  LoanTerms, 
  Covenant, 
  LenderPosition,
  NF2Formula,
  ESGData
} from '../types/loan';

// Simulated document parsing using AI (would use OpenAI/Claude in production)
export async function parseDocument(file: File): Promise<{
  terms: LoanTerms;
  covenants: Covenant[];
  lenders: LenderPosition[];
  esg?: ESGData;
  confidence: number;
}> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock parsed data (in production, this would call AI/LLM API)
  const borrowerNames = [
    'Acme Industrial Holdings Ltd.',
    'Global Manufacturing Corp.',
    'European Tech Solutions GmbH',
    'Atlantic Energy Partners LLC',
    'Nordic Infrastructure Group AS'
  ];
  
  const facilityTypes: LoanTerms['facilityType'][] = ['term_loan', 'revolver', 'delayed_draw'];
  
  const terms: LoanTerms = {
    borrowerName: borrowerNames[Math.floor(Math.random() * borrowerNames.length)],
    facilityAmount: Math.floor(Math.random() * 400 + 100) * 1_000_000, // $100M - $500M
    interestRateBps: Math.floor(Math.random() * 300 + 200), // 2% - 5%
    interestType: Math.random() > 0.3 ? 'floating' : 'fixed',
    spread: Math.floor(Math.random() * 200 + 150), // 150-350 bps
    referenceRate: 'SOFR',
    maturityDate: new Date(Date.now() + (Math.floor(Math.random() * 4 + 2) * 365 * 24 * 60 * 60 * 1000)), // 2-6 years
    currency: 'USD',
    facilityType: facilityTypes[Math.floor(Math.random() * facilityTypes.length)],
    securityType: Math.random() > 0.3 ? 'secured' : 'unsecured',
    seniorityRank: 'senior'
  };

  const covenants: Covenant[] = [
    {
      id: uuidv4(),
      type: 'financial',
      name: 'Maximum Leverage Ratio',
      description: 'Total Debt / EBITDA shall not exceed threshold',
      threshold: 4.5,
      testingFrequency: 'quarterly',
      currentValue: 3.2,
      status: 'compliant'
    },
    {
      id: uuidv4(),
      type: 'financial',
      name: 'Minimum Interest Coverage',
      description: 'EBITDA / Interest Expense shall not be less than threshold',
      threshold: 2.0,
      testingFrequency: 'quarterly',
      currentValue: 2.8,
      status: 'compliant'
    },
    {
      id: uuidv4(),
      type: 'financial',
      name: 'Minimum Liquidity',
      description: 'Cash + Available Revolver shall not be less than threshold',
      threshold: 50_000_000,
      testingFrequency: 'monthly',
      currentValue: 75_000_000,
      status: 'compliant'
    },
    {
      id: uuidv4(),
      type: 'reporting',
      name: 'Quarterly Financial Statements',
      description: 'Deliver audited financials within 45 days of quarter end',
      testingFrequency: 'quarterly',
      status: 'compliant'
    }
  ];

  const lenders: LenderPosition[] = [
    {
      lenderId: uuidv4(),
      lenderName: 'JP Morgan Chase',
      commitment: terms.facilityAmount * 0.25,
      fundedAmount: terms.facilityAmount * 0.25,
      unfundedAmount: 0,
      percentage: 25,
      isLeadArranger: true
    },
    {
      lenderId: uuidv4(),
      lenderName: 'Bank of America',
      commitment: terms.facilityAmount * 0.20,
      fundedAmount: terms.facilityAmount * 0.20,
      unfundedAmount: 0,
      percentage: 20,
      isLeadArranger: false
    },
    {
      lenderId: uuidv4(),
      lenderName: 'Barclays',
      commitment: terms.facilityAmount * 0.20,
      fundedAmount: terms.facilityAmount * 0.20,
      unfundedAmount: 0,
      percentage: 20,
      isLeadArranger: false
    },
    {
      lenderId: uuidv4(),
      lenderName: 'Deutsche Bank',
      commitment: terms.facilityAmount * 0.15,
      fundedAmount: terms.facilityAmount * 0.15,
      unfundedAmount: 0,
      percentage: 15,
      isLeadArranger: false
    },
    {
      lenderId: uuidv4(),
      lenderName: 'Credit Suisse',
      commitment: terms.facilityAmount * 0.20,
      fundedAmount: terms.facilityAmount * 0.20,
      unfundedAmount: 0,
      percentage: 20,
      isLeadArranger: false
    }
  ];

  // Add ESG data for some loans
  const esg: ESGData | undefined = Math.random() > 0.5 ? {
    hasESGLinking: true,
    sustainabilityCoordinator: 'BNP Paribas',
    kpis: [
      {
        id: uuidv4(),
        metric: 'Carbon Emissions Reduction',
        target: 15,
        current: 12,
        unit: '% YoY',
        status: 'on_track'
      },
      {
        id: uuidv4(),
        metric: 'Renewable Energy Usage',
        target: 50,
        current: 42,
        unit: '%',
        status: 'on_track'
      }
    ],
    marginAdjustment: -5 // 5 bps reduction for meeting targets
  } : undefined;

  return {
    terms,
    covenants,
    lenders,
    esg,
    confidence: 0.94 // 94% extraction accuracy
  };
}

// Create Digital Credit Instrument from parsed data
export function createDigitalCreditInstrument(
  terms: LoanTerms,
  covenants: Covenant[],
  lenders: LenderPosition[],
  documentId: string,
  documentHash: string,
  esg?: ESGData
): DigitalCreditInstrument {
  const nelId = `NEL-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
  
  // Generate NF2 formulas from covenants and terms
  const nf2Formulas: NF2Formula[] = [
    {
      id: uuidv4(),
      name: 'Interest Payment',
      type: 'obligation',
      description: 'Periodic interest payment calculation',
      formula: `PRINCIPAL * (RATE_BPS / 10000) * (DAYS / 360)`,
      parameters: {
        principal: terms.facilityAmount,
        rateBps: terms.interestRateBps,
        dayCountConvention: 'ACT/360'
      },
      isOnChain: true
    },
    {
      id: uuidv4(),
      name: 'Transfer Eligibility',
      type: 'condition',
      description: 'Validates transfer eligibility based on compliance',
      formula: `KYC_APPROVED && ACCREDITED_INVESTOR && LOCKUP_EXPIRED`,
      parameters: {
        minHoldingPeriod: 30 * 24 * 60 * 60, // 30 days in seconds
        requiredJurisdictions: ['US', 'UK', 'EU', 'SG', 'HK']
      },
      isOnChain: true
    },
    ...covenants.filter(c => c.type === 'financial').map(c => ({
      id: uuidv4(),
      name: `Covenant: ${c.name}`,
      type: 'condition' as const,
      description: c.description,
      formula: c.threshold ? `CURRENT_VALUE ${c.name.includes('Maximum') ? '<=' : '>='} THRESHOLD` : 'DELIVERED_ON_TIME',
      parameters: {
        threshold: c.threshold,
        testingFrequency: c.testingFrequency
      },
      isOnChain: false
    }))
  ];

  return {
    nelId,
    version: '1.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    terms,
    covenants,
    lenders,
    esg,
    documents: [{
      id: documentId,
      filename: 'loan_agreement.pdf',
      uploadedAt: new Date(),
      status: 'parsed',
      hash: documentHash
    }],
    nf2Formulas,
    tokenization: undefined
  };
}

// Mock GraphQL query to NEL Protocol
export async function queryNelProtocol(query: string, variables?: Record<string, unknown>): Promise<unknown> {
  console.log('NEL Protocol Query:', query, variables);
  
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data based on query type
  return { success: true, data: {} };
}

// Calculate document hash (would use proper hashing in production)
export function calculateDocumentHash(content: ArrayBuffer): string {
  // Simple hash simulation - in production use crypto.subtle.digest('SHA-256', content)
  const view = new Uint8Array(content);
  let hash = 0;
  for (let i = 0; i < view.length; i++) {
    hash = ((hash << 5) - hash + view[i]) | 0;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}
