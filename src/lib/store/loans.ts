// Database-backed store for loans using Prisma
// Replaces in-memory storage with PostgreSQL persistence

import { prisma } from '../db/prisma';
import type {
  DigitalCreditInstrument,
  Trade,
  PortfolioSummary,
  LoanTerms,
  Covenant,
  LenderPosition,
  ESGData,
  NF2Formula,
  TokenizationData,
  LoanDocument,
  Participant
} from '../types/loan';

// Re-export types for convenience
export type { PortfolioSummary, DigitalCreditInstrument, Trade, Participant };
import type {
  Loan as PrismaLoan,
  Participant as PrismaParticipant,
  Trade as PrismaTrade
} from '@prisma/client';

// Type for Prisma loan with all relations included
type LoanWithRelations = PrismaLoan & {
  documents: Array<{
    id: string;
    filename: string;
    uploadedAt: Date;
    status: string;
    hash: string | null;
  }>;
  covenants: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    threshold: number | null;
    testingFrequency: string;
    currentValue: number | null;
    status: string;
  }>;
  lenders: Array<{
    id: string;
    lenderName: string;
    commitment: bigint;
    fundedAmount: bigint;
    unfundedAmount: bigint;
    percentage: number;
    isLeadArranger: boolean;
  }>;
  esgData: {
    id: string;
    hasESGLinking: boolean;
    sustainabilityCoordinator: string | null;
    marginAdjustment: number | null;
    kpis: Array<{
      id: string;
      metric: string;
      target: number;
      current: number | null;
      unit: string;
      status: string;
    }>;
  } | null;
  nf2Formulas: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    formula: string;
    parameters: unknown;
    isOnChain: boolean;
  }>;
  tokenization: {
    id: string;
    tokenAddress: string | null;
    tokenSymbol: string;
    totalUnits: number;
    unitValue: bigint;
    partition: string;
    status: string;
    mintedAt: Date | null;
    blockchain: string;
    chainId: number;
    identityRegistry: string | null;
    compliance: string | null;
  } | null;
};

// Convert Prisma loan to domain type
function toDomainLoan(dbLoan: LoanWithRelations): DigitalCreditInstrument {
  return {
    nelId: dbLoan.nelId,
    version: dbLoan.version,
    createdAt: dbLoan.createdAt,
    updatedAt: dbLoan.updatedAt,
    terms: {
      borrowerName: dbLoan.borrowerName,
      facilityAmount: Number(dbLoan.facilityAmount) / 100, // cents to dollars
      interestRateBps: dbLoan.interestRateBps,
      interestType: dbLoan.interestType as LoanTerms['interestType'],
      spread: dbLoan.spread ?? undefined,
      referenceRate: dbLoan.referenceRate ?? undefined,
      maturityDate: dbLoan.maturityDate,
      currency: dbLoan.currency,
      facilityType: dbLoan.facilityType.replace('_', '_') as LoanTerms['facilityType'],
      securityType: dbLoan.securityType as LoanTerms['securityType'],
      seniorityRank: dbLoan.seniorityRank as LoanTerms['seniorityRank'],
    },
    documents: dbLoan.documents.map(d => ({
      id: d.id,
      filename: d.filename,
      uploadedAt: d.uploadedAt,
      status: d.status as LoanDocument['status'],
      hash: d.hash ?? undefined,
    })),
    covenants: dbLoan.covenants.map(c => ({
      id: c.id,
      type: c.type as Covenant['type'],
      name: c.name,
      description: c.description,
      threshold: c.threshold ?? undefined,
      testingFrequency: c.testingFrequency as Covenant['testingFrequency'],
      currentValue: c.currentValue ?? undefined,
      status: c.status as Covenant['status'],
    })),
    lenders: dbLoan.lenders.map(l => ({
      lenderId: l.id,
      lenderName: l.lenderName,
      commitment: Number(l.commitment) / 100,
      fundedAmount: Number(l.fundedAmount) / 100,
      unfundedAmount: Number(l.unfundedAmount) / 100,
      percentage: l.percentage,
      isLeadArranger: l.isLeadArranger,
    })),
    esg: dbLoan.esgData ? {
      hasESGLinking: dbLoan.esgData.hasESGLinking,
      sustainabilityCoordinator: dbLoan.esgData.sustainabilityCoordinator ?? undefined,
      marginAdjustment: dbLoan.esgData.marginAdjustment ?? undefined,
      kpis: dbLoan.esgData.kpis.map(k => ({
        id: k.id,
        metric: k.metric,
        target: k.target,
        current: k.current ?? undefined,
        unit: k.unit,
        status: k.status as ESGData['kpis'][0]['status'],
      })),
    } : undefined,
    nf2Formulas: dbLoan.nf2Formulas.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type as NF2Formula['type'],
      description: f.description,
      formula: f.formula,
      parameters: f.parameters as Record<string, unknown>,
      isOnChain: f.isOnChain,
    })),
    tokenization: dbLoan.tokenization ? {
      tokenAddress: dbLoan.tokenization.tokenAddress ?? undefined,
      tokenSymbol: dbLoan.tokenization.tokenSymbol,
      totalUnits: dbLoan.tokenization.totalUnits,
      unitValue: Number(dbLoan.tokenization.unitValue) / 100,
      partition: dbLoan.tokenization.partition as TokenizationData['partition'],
      status: dbLoan.tokenization.status as TokenizationData['status'],
      mintedAt: dbLoan.tokenization.mintedAt ?? undefined,
      blockchain: dbLoan.tokenization.blockchain,
      chainId: dbLoan.tokenization.chainId,
      identityRegistry: dbLoan.tokenization.identityRegistry ?? undefined,
      compliance: dbLoan.tokenization.compliance ?? undefined,
    } : undefined,
  };
}

// Convert Prisma participant to domain type
function toDomainParticipant(p: PrismaParticipant): Participant {
  return {
    id: p.id,
    name: p.name,
    type: p.type as Participant['type'],
    walletAddress: p.walletAddress ?? undefined,
    kycStatus: p.kycStatus as Participant['kycStatus'],
    accreditedInvestor: p.accreditedInvestor,
    jurisdiction: p.jurisdiction,
    lockupEndDate: p.lockupEndDate ?? undefined,
    identityContract: p.identityContract ?? undefined,
  };
}

// Include clause for loading all loan relations
const loanInclude = {
  documents: true,
  covenants: true,
  lenders: true,
  esgData: { include: { kpis: true } },
  nf2Formulas: true,
  tokenization: true,
};

// ============ Store Operations ============

export async function addLoan(loan: DigitalCreditInstrument): Promise<void> {
  await prisma.loan.create({
    data: {
      nelId: loan.nelId,
      version: loan.version,
      borrowerName: loan.terms.borrowerName,
      facilityAmount: BigInt(Math.round(loan.terms.facilityAmount * 100)),
      interestRateBps: loan.terms.interestRateBps,
      interestType: loan.terms.interestType,
      spread: loan.terms.spread,
      referenceRate: loan.terms.referenceRate,
      maturityDate: loan.terms.maturityDate,
      currency: loan.terms.currency,
      facilityType: loan.terms.facilityType,
      securityType: loan.terms.securityType,
      seniorityRank: loan.terms.seniorityRank,
      documents: {
        create: loan.documents.map(d => ({
          filename: d.filename,
          uploadedAt: d.uploadedAt,
          status: d.status,
          hash: d.hash,
        })),
      },
      covenants: {
        create: loan.covenants.map(c => ({
          type: c.type,
          name: c.name,
          description: c.description,
          threshold: c.threshold,
          testingFrequency: c.testingFrequency,
          currentValue: c.currentValue,
          status: c.status,
        })),
      },
      lenders: {
        create: loan.lenders.map(l => ({
          lenderName: l.lenderName,
          commitment: BigInt(Math.round(l.commitment * 100)),
          fundedAmount: BigInt(Math.round(l.fundedAmount * 100)),
          unfundedAmount: BigInt(Math.round(l.unfundedAmount * 100)),
          percentage: l.percentage,
          isLeadArranger: l.isLeadArranger,
        })),
      },
      nf2Formulas: {
        create: loan.nf2Formulas.map(f => ({
          name: f.name,
          type: f.type,
          description: f.description,
          formula: f.formula,
          parameters: f.parameters as object,
          isOnChain: f.isOnChain,
        })),
      },
      ...(loan.esg && {
        esgData: {
          create: {
            hasESGLinking: loan.esg.hasESGLinking,
            sustainabilityCoordinator: loan.esg.sustainabilityCoordinator,
            marginAdjustment: loan.esg.marginAdjustment,
            kpis: {
              create: loan.esg.kpis.map(k => ({
                metric: k.metric,
                target: k.target,
                current: k.current,
                unit: k.unit,
                status: k.status,
              })),
            },
          },
        },
      }),
      ...(loan.tokenization && {
        tokenization: {
          create: {
            tokenAddress: loan.tokenization.tokenAddress,
            tokenSymbol: loan.tokenization.tokenSymbol,
            totalUnits: loan.tokenization.totalUnits,
            unitValue: BigInt(Math.round(loan.tokenization.unitValue * 100)),
            partition: loan.tokenization.partition,
            status: loan.tokenization.status,
            mintedAt: loan.tokenization.mintedAt,
            blockchain: loan.tokenization.blockchain,
            chainId: loan.tokenization.chainId,
            identityRegistry: loan.tokenization.identityRegistry,
            compliance: loan.tokenization.compliance,
          },
        },
      }),
    },
  });
}

export async function getLoan(nelId: string): Promise<DigitalCreditInstrument | undefined> {
  const loan = await prisma.loan.findUnique({
    where: { nelId },
    include: loanInclude,
  });
  return loan ? toDomainLoan(loan as LoanWithRelations) : undefined;
}

export async function getAllLoans(): Promise<DigitalCreditInstrument[]> {
  const loans = await prisma.loan.findMany({
    include: loanInclude,
    orderBy: { createdAt: 'desc' },
  });
  return loans.map(loan => toDomainLoan(loan as LoanWithRelations));
}

export async function updateLoan(nelId: string, updates: Partial<DigitalCreditInstrument>): Promise<void> {
  const existing = await prisma.loan.findUnique({ where: { nelId } });
  if (!existing) return;

  // Update basic loan fields if terms provided
  if (updates.terms) {
    await prisma.loan.update({
      where: { nelId },
      data: {
        borrowerName: updates.terms.borrowerName,
        facilityAmount: updates.terms.facilityAmount
          ? BigInt(Math.round(updates.terms.facilityAmount * 100))
          : undefined,
        interestRateBps: updates.terms.interestRateBps,
        interestType: updates.terms.interestType,
        spread: updates.terms.spread,
        referenceRate: updates.terms.referenceRate,
        maturityDate: updates.terms.maturityDate,
        currency: updates.terms.currency,
        facilityType: updates.terms.facilityType,
        securityType: updates.terms.securityType,
        seniorityRank: updates.terms.seniorityRank,
      },
    });
  }

  // Update tokenization if provided
  if (updates.tokenization) {
    await prisma.tokenization.upsert({
      where: { loanId: existing.id },
      update: {
        tokenAddress: updates.tokenization.tokenAddress,
        tokenSymbol: updates.tokenization.tokenSymbol,
        totalUnits: updates.tokenization.totalUnits,
        unitValue: BigInt(Math.round(updates.tokenization.unitValue * 100)),
        status: updates.tokenization.status,
        mintedAt: updates.tokenization.mintedAt,
        identityRegistry: updates.tokenization.identityRegistry,
        compliance: updates.tokenization.compliance,
      },
      create: {
        loanId: existing.id,
        tokenSymbol: updates.tokenization.tokenSymbol,
        totalUnits: updates.tokenization.totalUnits,
        unitValue: BigInt(Math.round(updates.tokenization.unitValue * 100)),
        partition: updates.tokenization.partition,
        status: updates.tokenization.status,
        mintedAt: updates.tokenization.mintedAt,
        blockchain: updates.tokenization.blockchain,
        chainId: updates.tokenization.chainId,
        identityRegistry: updates.tokenization.identityRegistry,
        compliance: updates.tokenization.compliance,
      },
    });
  }
}

export async function addTrade(trade: Trade): Promise<void> {
  // First ensure seller and buyer exist in participants
  const sellerId = await ensureParticipant(trade.seller);
  const buyerId = await ensureParticipant(trade.buyer);

  // Find the loan ID
  const loan = await prisma.loan.findFirst({
    where: {
      OR: [
        { nelId: trade.loanId },
        { tokenization: { tokenAddress: trade.tokenAddress } },
      ],
    },
  });

  if (!loan) {
    throw new Error(`Loan not found for trade: ${trade.loanId}`);
  }

  await prisma.trade.create({
    data: {
      loanId: loan.id,
      tokenAddress: trade.tokenAddress,
      sellerId,
      buyerId,
      units: trade.units,
      pricePerUnit: BigInt(Math.round(trade.pricePerUnit * 100)),
      totalValue: BigInt(Math.round(trade.totalValue * 100)),
      status: trade.status,
      validation: trade.validation as object,
      createdAt: trade.createdAt,
      settledAt: trade.settledAt,
      txHash: trade.txHash,
      settlementTime: trade.settlementTime,
    },
  });
}

async function ensureParticipant(participant: Participant): Promise<string> {
  // Try to find existing participant by wallet address or name
  let existing = await prisma.participant.findFirst({
    where: {
      OR: [
        { walletAddress: participant.walletAddress },
        { name: participant.name },
      ],
    },
  });

  if (existing) return existing.id;

  // Create new participant
  const created = await prisma.participant.create({
    data: {
      name: participant.name,
      type: participant.type,
      walletAddress: participant.walletAddress,
      kycStatus: participant.kycStatus,
      accreditedInvestor: participant.accreditedInvestor,
      jurisdiction: participant.jurisdiction,
      lockupEndDate: participant.lockupEndDate,
      identityContract: participant.identityContract,
    },
  });

  return created.id;
}

export async function getTrades(): Promise<Trade[]> {
  const trades = await prisma.trade.findMany({
    include: {
      seller: true,
      buyer: true,
      loan: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return trades.map(t => ({
    id: t.id,
    loanId: t.loan.nelId,
    tokenAddress: t.tokenAddress,
    seller: toDomainParticipant(t.seller),
    buyer: toDomainParticipant(t.buyer),
    units: t.units,
    pricePerUnit: Number(t.pricePerUnit) / 100,
    totalValue: Number(t.totalValue) / 100,
    status: t.status as Trade['status'],
    validation: t.validation as unknown as Trade['validation'],
    createdAt: t.createdAt,
    settledAt: t.settledAt ?? undefined,
    txHash: t.txHash ?? undefined,
    settlementTime: t.settlementTime ?? undefined,
  }));
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const [loans, trades] = await Promise.all([
    prisma.loan.findMany({
      include: { tokenization: true },
    }),
    prisma.trade.findMany({
      where: { status: 'settled' },
      orderBy: { settledAt: 'desc' },
      take: 5,
      include: { seller: true, buyer: true, loan: true },
    }),
  ]);

  const totalValue = loans.reduce((sum, l) => sum + Number(l.facilityAmount), 0) / 100;
  const tokenizedLoans = loans.filter(l =>
    l.tokenization?.status === 'trading' || l.tokenization?.status === 'minted'
  );
  const tokenizedValue = tokenizedLoans.reduce((sum, l) => sum + Number(l.facilityAmount), 0) / 100;

  // Calculate average settlement time for tokenized trades
  const settledTrades = await prisma.trade.findMany({
    where: { settlementTime: { not: null } },
  });
  const avgSettlementTimeTokenized = settledTrades.length > 0
    ? settledTrades.reduce((sum, t) => sum + (t.settlementTime || 0), 0) / settledTrades.length
    : 0;

  const recentTrades: Trade[] = trades.map(t => ({
    id: t.id,
    loanId: t.loan.nelId,
    tokenAddress: t.tokenAddress,
    seller: toDomainParticipant(t.seller),
    buyer: toDomainParticipant(t.buyer),
    units: t.units,
    pricePerUnit: Number(t.pricePerUnit) / 100,
    totalValue: Number(t.totalValue) / 100,
    status: t.status as Trade['status'],
    validation: t.validation as unknown as Trade['validation'],
    createdAt: t.createdAt,
    settledAt: t.settledAt ?? undefined,
    txHash: t.txHash ?? undefined,
    settlementTime: t.settlementTime ?? undefined,
  }));

  return {
    totalLoans: loans.length,
    totalValue,
    tokenizedValue,
    tokenizationRate: totalValue > 0 ? (tokenizedValue / totalValue) * 100 : 0,
    avgSettlementTime: 27, // Traditional: 27 days average
    avgSettlementTimeTokenized,
    recentTrades,
  };
}

// ============ Participant Operations ============

export async function getParticipants(): Promise<Participant[]> {
  const participants = await prisma.participant.findMany({
    orderBy: { name: 'asc' },
  });
  return participants.map(toDomainParticipant);
}

export async function getParticipantByWallet(walletAddress: string): Promise<Participant | undefined> {
  const participant = await prisma.participant.findUnique({
    where: { walletAddress },
  });
  return participant ? toDomainParticipant(participant) : undefined;
}

export async function addParticipant(participant: Participant): Promise<string> {
  const created = await prisma.participant.create({
    data: {
      name: participant.name,
      type: participant.type,
      walletAddress: participant.walletAddress,
      kycStatus: participant.kycStatus,
      accreditedInvestor: participant.accreditedInvestor,
      jurisdiction: participant.jurisdiction,
      lockupEndDate: participant.lockupEndDate,
      identityContract: participant.identityContract,
    },
  });
  return created.id;
}

// ============ Initialize Demo Data (now async, call from seed script) ============
// This function is kept for backward compatibility but should be called from prisma/seed.ts
export async function initializeDemoData(): Promise<void> {
  const existingLoans = await prisma.loan.count();
  if (existingLoans > 0) return; // Already initialized

  console.log('[Store] Initializing demo data...');

  // Demo data will be seeded via prisma/seed.ts
  // This function is now a no-op for backward compatibility
}
