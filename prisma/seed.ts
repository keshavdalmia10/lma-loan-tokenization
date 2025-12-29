import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (for development)
  console.log('Clearing existing data...');
  await prisma.trade.deleteMany();
  await prisma.tokenBalance.deleteMany();
  await prisma.identityClaim.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.nF2Formula.deleteMany();
  await prisma.eSGKPI.deleteMany();
  await prisma.eSGData.deleteMany();
  await prisma.tokenization.deleteMany();
  await prisma.lenderPosition.deleteMany();
  await prisma.covenant.deleteMany();
  await prisma.document.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.trustedIssuer.deleteMany();

  // Create trusted issuers
  console.log('Creating trusted issuers...');
  const issuers = await Promise.all([
    prisma.trustedIssuer.create({
      data: {
        address: '0xTRUSTED_KYC_PROVIDER_001',
        name: 'Refinitiv KYC Services',
        claimTopics: [1, 4], // KYC, AML
      },
    }),
    prisma.trustedIssuer.create({
      data: {
        address: '0xTRUSTED_ACCRED_PROVIDER_001',
        name: 'Accreditation Authority',
        claimTopics: [2, 5], // Accreditation, Qualified Investor
      },
    }),
    prisma.trustedIssuer.create({
      data: {
        address: '0xTRUSTED_JURIS_PROVIDER_001',
        name: 'Jurisdiction Verifier',
        claimTopics: [3], // Jurisdiction
      },
    }),
  ]);
  console.log(`Created ${issuers.length} trusted issuers`);

  // Create sample participants
  console.log('Creating participants...');
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
        // No identity contract or claims - not verified
      },
    }),
  ]);
  console.log(`Created ${participants.length} participants`);

  // Create sample loan
  console.log('Creating sample loan...');
  const loan = await prisma.loan.create({
    data: {
      nelId: 'NEL-2024-DEMO001',
      borrowerName: 'Acme Industrial Holdings Ltd.',
      facilityAmount: BigInt(25000000000), // $250M in cents
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
          {
            type: 'reporting',
            name: 'Quarterly Financial Statements',
            description: 'Deliver audited financials within 45 days of quarter end',
            testingFrequency: 'quarterly',
            status: 'compliant',
          },
        ],
      },
      lenders: {
        create: [
          {
            lenderName: 'JP Morgan Chase',
            commitment: BigInt(6250000000), // $62.5M in cents
            fundedAmount: BigInt(6250000000),
            unfundedAmount: BigInt(0),
            percentage: 25,
            isLeadArranger: true,
          },
          {
            lenderName: 'Bank of America',
            commitment: BigInt(5000000000), // $50M
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
            commitment: BigInt(3750000000), // $37.5M
            fundedAmount: BigInt(3750000000),
            unfundedAmount: BigInt(0),
            percentage: 15,
            isLeadArranger: false,
          },
          {
            lenderName: 'Credit Suisse',
            commitment: BigInt(5000000000),
            fundedAmount: BigInt(5000000000),
            unfundedAmount: BigInt(0),
            percentage: 20,
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
          unitValue: BigInt(250000000), // $2.5M in cents
          partition: 'PRIMARY',
          status: 'trading',
          mintedAt: new Date('2024-11-20'),
          blockchain: 'Hardhat',
          chainId: 31337,
          identityRegistry: '0xIDREG_742d35Cc',
          compliance: '0xCOMPL_742d35Cc',
        },
      },
    },
    include: {
      tokenization: true,
    },
  });
  console.log(`Created loan: ${loan.nelId}`);

  // Create sample trade
  console.log('Creating sample trade...');
  const [seller, buyer] = participants;
  const trade = await prisma.trade.create({
    data: {
      loanId: loan.id,
      tokenAddress: loan.tokenization!.tokenAddress!,
      sellerId: seller.id,
      buyerId: buyer.id,
      units: 10,
      pricePerUnit: BigInt(252500000), // $2.525M in cents (slight premium)
      totalValue: BigInt(2525000000), // $25.25M
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
          { name: 'Compliance: Country Eligibility', passed: true, details: 'Approved country code: 840' },
        ],
      },
      createdAt: new Date('2024-12-18T10:30:00'),
      settledAt: new Date('2024-12-18T10:30:03'),
      txHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7',
      settlementTime: 3.2,
    },
  });
  console.log(`Created trade: ${trade.id}`);

  // Create token balances
  console.log('Creating token balances...');
  await Promise.all([
    prisma.tokenBalance.create({
      data: {
        participantId: participants[0].id, // Goldman
        tokenAddress: loan.tokenization!.tokenAddress!,
        balance: 40, // After selling 10
        frozenAmount: 0,
      },
    }),
    prisma.tokenBalance.create({
      data: {
        participantId: participants[1].id, // BlackRock
        tokenAddress: loan.tokenization!.tokenAddress!,
        balance: 40, // After buying 10
        frozenAmount: 0,
      },
    }),
    prisma.tokenBalance.create({
      data: {
        participantId: participants[2].id, // Deutsche
        tokenAddress: loan.tokenization!.tokenAddress!,
        balance: 20,
        frozenAmount: 0,
      },
    }),
  ]);
  console.log('Created token balances');

  console.log('\nDatabase seeding complete!');
  console.log('Summary:');
  console.log(`  - ${issuers.length} Trusted Issuers`);
  console.log(`  - ${participants.length} Participants`);
  console.log(`  - 1 Loan (${loan.nelId})`);
  console.log(`  - 1 Trade`);
  console.log(`  - 3 Token Balances`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
