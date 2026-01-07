import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST /api/seed - Seed database with demo data
// Add a simple auth check to prevent abuse
export async function POST(request: Request) {
  try {
    // Check for seed key to prevent accidental/unauthorized seeding
    const { searchParams } = new URL(request.url);
    const seedKey = searchParams.get('key');

    if (seedKey !== 'lma-edge-2025') {
      return NextResponse.json({ error: 'Invalid seed key' }, { status: 401 });
    }

    // Check if data already exists
    const existingLoan = await prisma.loan.findFirst();
    if (existingLoan) {
      return NextResponse.json({
        message: 'Database already seeded',
        existing: true
      });
    }

    console.log('Seeding production database...');

    // Create trusted issuers
    const issuers = await Promise.all([
      prisma.trustedIssuer.create({
        data: {
          address: '0xTRUSTED_KYC_PROVIDER_001',
          name: 'Refinitiv KYC Services',
          claimTopics: [1, 4],
        },
      }),
      prisma.trustedIssuer.create({
        data: {
          address: '0xTRUSTED_ACCRED_PROVIDER_001',
          name: 'Accreditation Authority',
          claimTopics: [2, 5],
        },
      }),
      prisma.trustedIssuer.create({
        data: {
          address: '0xTRUSTED_JURIS_PROVIDER_001',
          name: 'Jurisdiction Verifier',
          claimTopics: [3],
        },
      }),
    ]);

    // Create sample participants
    const participants = await Promise.all([
      prisma.participant.create({
        data: {
          name: 'Goldman Sachs Asset Management',
          type: 'fund',
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          kycStatus: 'approved',
          accreditedInvestor: true,
          jurisdiction: 'US',
          identityContract: '0xID_GS_001',
          claims: {
            create: [
              { topic: 1, issuer: '0xTRUSTED_KYC_PROVIDER_001', isValid: true },
              { topic: 2, issuer: '0xTRUSTED_ACCRED_PROVIDER_001', isValid: true },
              { topic: 3, issuer: '0xTRUSTED_JURIS_PROVIDER_001', isValid: true },
            ],
          },
        },
      }),
      prisma.participant.create({
        data: {
          name: 'BlackRock Fixed Income',
          type: 'fund',
          walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
          kycStatus: 'approved',
          accreditedInvestor: true,
          jurisdiction: 'US',
          identityContract: '0xID_BR_001',
          claims: {
            create: [
              { topic: 1, issuer: '0xTRUSTED_KYC_PROVIDER_001', isValid: true },
              { topic: 2, issuer: '0xTRUSTED_ACCRED_PROVIDER_001', isValid: true },
              { topic: 3, issuer: '0xTRUSTED_JURIS_PROVIDER_001', isValid: true },
            ],
          },
        },
      }),
      prisma.participant.create({
        data: {
          name: 'Deutsche Bank Trading',
          type: 'bank',
          walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
          kycStatus: 'approved',
          accreditedInvestor: true,
          jurisdiction: 'DE',
          identityContract: '0xID_DB_001',
          claims: {
            create: [
              { topic: 1, issuer: '0xTRUSTED_KYC_PROVIDER_001', isValid: true },
              { topic: 2, issuer: '0xTRUSTED_ACCRED_PROVIDER_001', isValid: true },
              { topic: 3, issuer: '0xTRUSTED_JURIS_PROVIDER_001', isValid: true },
            ],
          },
        },
      }),
      prisma.participant.create({
        data: {
          name: 'Pending Investor LLC',
          type: 'fund',
          walletAddress: '0x5555666677778888999900001111222233334444',
          kycStatus: 'pending',
          accreditedInvestor: false,
          jurisdiction: 'US',
        },
      }),
    ]);

    // Create sample loan
    const loan = await prisma.loan.create({
      data: {
        nelId: 'NEL-2024-DEMO001',
        borrowerName: 'Acme Industrial Holdings Ltd.',
        facilityAmount: BigInt(25000000000),
        interestRateBps: 475,
        interestType: 'floating',
        spread: 325,
        referenceRate: 'SOFR',
        maturityDate: new Date('2029-11-15'),
        currency: 'USD',
        facilityType: 'term_loan',
        securityType: 'secured',
        seniorityRank: 'senior',
        documents: {
          create: {
            filename: 'acme_credit_agreement_2024.pdf',
            status: 'parsed',
            hash: '0x7d8f9a2b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
          },
        },
        covenants: {
          create: [
            {
              type: 'financial',
              name: 'Maximum Leverage Ratio',
              description: 'Total Debt / EBITDA shall not exceed 4.5x',
              threshold: 4.5,
              testingFrequency: 'quarterly',
              currentValue: 3.2,
              status: 'compliant',
            },
            {
              type: 'financial',
              name: 'Minimum Interest Coverage',
              description: 'EBITDA / Interest Expense shall not be less than 2.0x',
              threshold: 2.0,
              testingFrequency: 'quarterly',
              currentValue: 2.8,
              status: 'compliant',
            },
            {
              type: 'financial',
              name: 'Minimum Liquidity',
              description: 'Cash + Available Revolver shall not be less than $50M',
              threshold: 50000000,
              testingFrequency: 'monthly',
              currentValue: 75000000,
              status: 'compliant',
            },
          ],
        },
        lenders: {
          create: [
            {
              lenderName: 'JP Morgan Chase',
              commitment: BigInt(6250000000),
              fundedAmount: BigInt(6250000000),
              unfundedAmount: BigInt(0),
              percentage: 25,
              isLeadArranger: true,
            },
            {
              lenderName: 'Bank of America',
              commitment: BigInt(5000000000),
              fundedAmount: BigInt(5000000000),
              unfundedAmount: BigInt(0),
              percentage: 20,
              isLeadArranger: false,
            },
            {
              lenderName: 'Barclays',
              commitment: BigInt(5000000000),
              fundedAmount: BigInt(5000000000),
              unfundedAmount: BigInt(0),
              percentage: 20,
              isLeadArranger: false,
            },
            {
              lenderName: 'Deutsche Bank',
              commitment: BigInt(3750000000),
              fundedAmount: BigInt(3750000000),
              unfundedAmount: BigInt(0),
              percentage: 15,
              isLeadArranger: false,
            },
          ],
        },
        nf2Formulas: {
          create: [
            {
              name: 'Interest Payment',
              type: 'obligation',
              description: 'Quarterly interest payment calculation',
              formula: 'PRINCIPAL * (SOFR + SPREAD) * (DAYS / 360)',
              parameters: { spread: 325, dayCount: 'ACT/360' },
              isOnChain: true,
            },
            {
              name: 'Transfer Eligibility',
              type: 'condition',
              description: 'Validates transfer eligibility based on compliance',
              formula: 'KYC_APPROVED && ACCREDITED_INVESTOR && LOCKUP_EXPIRED',
              parameters: { minHoldingPeriod: 2592000, requiredJurisdictions: ['US', 'UK', 'EU', 'SG', 'HK'] },
              isOnChain: true,
            },
          ],
        },
        tokenization: {
          create: {
            tokenAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f1aB1c',
            tokenSymbol: 'LT-ACME',
            totalUnits: 100,
            unitValue: BigInt(250000000),
            partition: 'PRIMARY',
            status: 'trading',
            mintedAt: new Date('2024-11-20'),
            blockchain: 'Base Sepolia',
            chainId: 84532,
            identityRegistry: '0xIDREG_742d35Cc',
            compliance: '0xCOMPL_742d35Cc',
          },
        },
      },
      include: {
        tokenization: true,
      },
    });

    // Create sample trade
    const [seller, buyer] = participants;
    const trade = await prisma.trade.create({
      data: {
        loanId: loan.id,
        tokenAddress: loan.tokenization!.tokenAddress!,
        sellerId: seller.id,
        buyerId: buyer.id,
        units: 10,
        pricePerUnit: BigInt(252500000),
        totalValue: BigInt(2525000000),
        status: 'settled',
        validation: {
          canTransfer: true,
          reasonCode: '0x51',
          reasonDescription: 'Transfer approved',
          checks: [
            { name: 'Sender Identity Verification (ERC-3643)', passed: true, details: 'Verified in Identity Registry' },
            { name: 'Receiver Identity Verification (ERC-3643)', passed: true, details: 'Verified in Identity Registry' },
            { name: 'Address Freeze Status (ERC-3643)', passed: true, details: 'No frozen addresses' },
            { name: 'Compliance: Lockup Period', passed: true, details: 'No active lockup' },
            { name: 'Available Balance Check', passed: true, details: 'Available: 50 units' },
          ],
        },
        createdAt: new Date('2024-12-18T10:30:00'),
        settledAt: new Date('2024-12-18T10:30:03'),
        txHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7',
        settlementTime: 3.2,
      },
    });

    // Create token balances
    await Promise.all([
      prisma.tokenBalance.create({
        data: {
          participantId: participants[0].id,
          tokenAddress: loan.tokenization!.tokenAddress!,
          balance: 40,
          frozenAmount: 0,
        },
      }),
      prisma.tokenBalance.create({
        data: {
          participantId: participants[1].id,
          tokenAddress: loan.tokenization!.tokenAddress!,
          balance: 40,
          frozenAmount: 0,
        },
      }),
      prisma.tokenBalance.create({
        data: {
          participantId: participants[2].id,
          tokenAddress: loan.tokenization!.tokenAddress!,
          balance: 20,
          frozenAmount: 0,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        trustedIssuers: issuers.length,
        participants: participants.length,
        loans: 1,
        trades: 1,
        tokenBalances: 3,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
