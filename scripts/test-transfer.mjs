/**
 * Test script for simulating a token transfer using the mock blockchain service
 */

import { v4 as uuidv4 } from 'uuid';

// Mock ERC-3643 Claim Topics
const CLAIM_TOPICS = {
  KYC: 1,
  ACCREDITATION: 2,
  JURISDICTION: 3,
};

// Mock participants with ERC-3643 identity
const participants = {
  seller: {
    id: uuidv4(),
    name: 'Goldman Sachs Asset Management',
    type: 'fund',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    kycStatus: 'approved',
    accreditedInvestor: true,
    jurisdiction: 'US',
    claims: [
      { topic: CLAIM_TOPICS.KYC, isValid: true },
      { topic: CLAIM_TOPICS.ACCREDITATION, isValid: true },
    ],
  },
  buyer: {
    id: uuidv4(),
    name: 'BlackRock Fixed Income',
    type: 'fund',
    walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
    kycStatus: 'approved',
    accreditedInvestor: true,
    jurisdiction: 'US',
    claims: [
      { topic: CLAIM_TOPICS.KYC, isValid: true },
      { topic: CLAIM_TOPICS.ACCREDITATION, isValid: true },
    ],
  },
};

// Simulated token
const token = {
  address: '0xTOKEN_' + uuidv4().slice(0, 8).toUpperCase(),
  symbol: 'LT-ACME',
  totalUnits: 100,
  unitValue: 2500000, // $2.5M per unit
};

// Simulate compliance checks
function validateTransfer(seller, buyer, units) {
  console.log('\n🔍 Running ERC-3643 Compliance Checks...\n');

  const checks = [];

  // Check 1: Sender KYC
  const sellerKYC = seller.claims.find(c => c.topic === CLAIM_TOPICS.KYC);
  checks.push({
    name: 'Sender KYC Verification',
    passed: sellerKYC?.isValid ?? false,
    details: sellerKYC?.isValid ? 'KYC claim verified by trusted issuer' : 'Missing KYC claim',
  });

  // Check 2: Receiver KYC
  const buyerKYC = buyer.claims.find(c => c.topic === CLAIM_TOPICS.KYC);
  checks.push({
    name: 'Receiver KYC Verification',
    passed: buyerKYC?.isValid ?? false,
    details: buyerKYC?.isValid ? 'KYC claim verified by trusted issuer' : 'Missing KYC claim',
  });

  // Check 3: Sender Accreditation
  const sellerAccred = seller.claims.find(c => c.topic === CLAIM_TOPICS.ACCREDITATION);
  checks.push({
    name: 'Sender Accreditation',
    passed: sellerAccred?.isValid ?? false,
    details: sellerAccred?.isValid ? 'Accredited investor verified' : 'Not accredited',
  });

  // Check 4: Receiver Accreditation
  const buyerAccred = buyer.claims.find(c => c.topic === CLAIM_TOPICS.ACCREDITATION);
  checks.push({
    name: 'Receiver Accreditation',
    passed: buyerAccred?.isValid ?? false,
    details: buyerAccred?.isValid ? 'Accredited investor verified' : 'Not accredited',
  });

  // Check 5: Balance check (simulated)
  const hasBalance = units <= 50; // Assume seller has 50 units
  checks.push({
    name: 'Balance Verification',
    passed: hasBalance,
    details: hasBalance ? `Sufficient balance: 50 units available` : 'Insufficient balance',
  });

  // Print results
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`  ${icon} ${check.name}: ${check.details}`);
  });

  const allPassed = checks.every(c => c.passed);
  return { canTransfer: allPassed, checks };
}

// Simulate transfer execution
function executeTransfer(seller, buyer, units, pricePerUnit) {
  const startTime = Date.now();

  console.log('\n📤 Executing Transfer...');
  console.log(`   From: ${seller.name}`);
  console.log(`   To: ${buyer.name}`);
  console.log(`   Units: ${units}`);
  console.log(`   Price per Unit: $${pricePerUnit.toLocaleString()}`);
  console.log(`   Total Value: $${(units * pricePerUnit).toLocaleString()}`);

  // Simulate blockchain delay (would be real in production)
  const settlementTime = 2.5; // seconds

  const trade = {
    id: uuidv4(),
    tokenAddress: token.address,
    seller: seller,
    buyer: buyer,
    units: units,
    pricePerUnit: pricePerUnit,
    totalValue: units * pricePerUnit,
    status: 'settled',
    createdAt: new Date(),
    settledAt: new Date(Date.now() + settlementTime * 1000),
    txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    settlementTime: settlementTime,
  };

  return trade;
}

// Main test
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       LMA LOAN TOKENIZATION - TRANSFER SIMULATION');
  console.log('═══════════════════════════════════════════════════════════');

  console.log('\n📋 Token Details:');
  console.log(`   Address: ${token.address}`);
  console.log(`   Symbol: ${token.symbol}`);
  console.log(`   Total Units: ${token.totalUnits}`);
  console.log(`   Unit Value: $${token.unitValue.toLocaleString()}`);

  console.log('\n👤 Seller:', participants.seller.name);
  console.log('👤 Buyer:', participants.buyer.name);

  const units = 10;
  const pricePerUnit = 2500000;

  // Validate transfer
  const validation = validateTransfer(participants.seller, participants.buyer, units);

  if (validation.canTransfer) {
    console.log('\n✅ All compliance checks passed!');

    // Execute transfer
    const trade = executeTransfer(participants.seller, participants.buyer, units, pricePerUnit);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    TRADE SETTLED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n   Trade ID: ${trade.id}`);
    console.log(`   Status: ${trade.status.toUpperCase()}`);
    console.log(`   Settlement Time: ${trade.settlementTime} seconds`);
    console.log(`   Transaction Hash: ${trade.txHash.slice(0, 20)}...`);
    console.log(`   Total Value: $${trade.totalValue.toLocaleString()}`);
    console.log('\n   🎉 T+0 Settlement Complete!');
    console.log('   (Traditional settlement: 27+ days)');

  } else {
    console.log('\n❌ Transfer blocked by compliance checks');
    const failedChecks = validation.checks.filter(c => !c.passed);
    console.log('   Failed checks:', failedChecks.map(c => c.name).join(', '));
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
