// Mock blockchain service for demo purposes
// In production, this would use actual wagmi/viem hooks and contract calls
// Updated for ERC-3643 compliance with claim-based verification

import { v4 as uuidv4 } from 'uuid';
import type { 
  TokenizationData, 
  TransferValidation, 
  Trade,
  Participant,
  ComplianceCheck,
  IdentityClaim
} from '../types/loan';

// ERC-3643 Claim Topics
export const CLAIM_TOPICS = {
  KYC: 1,
  ACCREDITATION: 2,
  JURISDICTION: 3,
  AML: 4,
  QUALIFIED_INVESTOR: 5
} as const;

// Mock Identity Registry - ERC-3643 on-chain identity simulation
interface OnChainIdentity {
  id: string;
  walletAddress: string;
  claims: IdentityClaim[];
  country: number; // ISO 3166-1 numeric
  isVerified: boolean;
}

const mockIdentityRegistry: Map<string, OnChainIdentity> = new Map();

// Mock Trusted Issuers
const trustedIssuers = [
  { address: '0xTRUSTED_KYC_PROVIDER_001', name: 'Refinitiv KYC Services', claimTopics: [1, 4] },
  { address: '0xTRUSTED_ACCRED_PROVIDER_001', name: 'Accreditation Authority', claimTopics: [2, 5] },
  { address: '0xTRUSTED_JURIS_PROVIDER_001', name: 'Jurisdiction Verifier', claimTopics: [3] }
];

// Mock participants database with ERC-3643 identity data
const mockParticipants: Map<string, Participant> = new Map([
  ['0x1234...5678', {
    id: uuidv4(),
    name: 'Goldman Sachs Asset Management',
    type: 'fund',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    kycStatus: 'approved',
    accreditedInvestor: true,
    jurisdiction: 'US',
    lockupEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday - lockup expired
    // ERC-3643 identity data
    identityContract: '0xID_GS_001',
    claims: [
      { topic: CLAIM_TOPICS.KYC, issuer: '0xTRUSTED_KYC_PROVIDER_001', isValid: true },
      { topic: CLAIM_TOPICS.ACCREDITATION, issuer: '0xTRUSTED_ACCRED_PROVIDER_001', isValid: true },
      { topic: CLAIM_TOPICS.JURISDICTION, issuer: '0xTRUSTED_JURIS_PROVIDER_001', isValid: true }
    ]
  }],
  ['0xabcd...ef01', {
    id: uuidv4(),
    name: 'BlackRock Fixed Income',
    type: 'fund',
    walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
    kycStatus: 'approved',
    accreditedInvestor: true,
    jurisdiction: 'US',
    lockupEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    identityContract: '0xID_BR_001',
    claims: [
      { topic: CLAIM_TOPICS.KYC, issuer: '0xTRUSTED_KYC_PROVIDER_001', isValid: true },
      { topic: CLAIM_TOPICS.ACCREDITATION, issuer: '0xTRUSTED_ACCRED_PROVIDER_001', isValid: true },
      { topic: CLAIM_TOPICS.JURISDICTION, issuer: '0xTRUSTED_JURIS_PROVIDER_001', isValid: true }
    ]
  }],
  ['0x9876...4321', {
    id: uuidv4(),
    name: 'Deutsche Bank Trading',
    type: 'bank',
    walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
    kycStatus: 'approved',
    accreditedInvestor: true,
    jurisdiction: 'DE',
    lockupEndDate: undefined,
    identityContract: '0xID_DB_001',
    claims: [
      { topic: CLAIM_TOPICS.KYC, issuer: '0xTRUSTED_KYC_PROVIDER_001', isValid: true },
      { topic: CLAIM_TOPICS.ACCREDITATION, issuer: '0xTRUSTED_ACCRED_PROVIDER_001', isValid: true },
      { topic: CLAIM_TOPICS.JURISDICTION, issuer: '0xTRUSTED_JURIS_PROVIDER_001', isValid: true }
    ]
  }],
  ['0x5555...6666', {
    id: uuidv4(),
    name: 'Pending Investor LLC',
    type: 'fund',
    walletAddress: '0x5555666677778888999900001111222233334444',
    kycStatus: 'pending',
    accreditedInvestor: false,
    jurisdiction: 'US',
    lockupEndDate: undefined,
    identityContract: undefined, // No identity registered - not verified
    claims: [] // No valid claims
  }]
]);

// Initialize identity registry from participants
mockParticipants.forEach((participant, key) => {
  if (participant.identityContract) {
    mockIdentityRegistry.set(participant.walletAddress!, {
      id: participant.identityContract,
      walletAddress: participant.walletAddress!,
      claims: participant.claims || [],
      country: getCountryCode(participant.jurisdiction),
      isVerified: participant.claims?.every(c => c.isValid) ?? false
    });
  }
});

function getCountryCode(jurisdiction: string): number {
  const countryCodes: Record<string, number> = {
    'US': 840,
    'UK': 826,
    'DE': 276,
    'FR': 250,
    'SG': 702,
    'HK': 344,
    'EU': 999 // Placeholder for EU
  };
  return countryCodes[jurisdiction] || 0;
}

// Token balances storage
const tokenBalances: Map<string, Map<string, number>> = new Map();

// Trade history
const tradeHistory: Trade[] = [];

// Frozen addresses (ERC-3643 feature)
const frozenAddresses: Set<string> = new Set();
const frozenTokens: Map<string, number> = new Map();

export async function mintLoanToken(
  nelId: string,
  terms: { borrowerName: string; facilityAmount: number; interestRateBps: number; maturityDate: Date },
  documentHash: string,
  totalUnits: number = 100
): Promise<TokenizationData> {
  // Simulate minting delay (blockchain confirmation)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const tokenAddress = '0x' + uuidv4().replace(/-/g, '').slice(0, 40);
  const symbol = `LT-${terms.borrowerName.split(' ')[0].toUpperCase().slice(0, 4)}`;
  
  const tokenization: TokenizationData = {
    tokenAddress,
    tokenSymbol: symbol,
    totalUnits,
    unitValue: terms.facilityAmount / totalUnits,
    partition: 'PRIMARY',
    status: 'minted',
    mintedAt: new Date(),
    blockchain: 'Polygon',
    chainId: 137,
    // ERC-3643 infrastructure addresses (mock)
    identityRegistry: '0xIDREG_' + tokenAddress.slice(2, 10),
    compliance: '0xCOMPL_' + tokenAddress.slice(2, 10)
  };
  
  // Initialize token balances - owner gets all units
  const balances = new Map<string, number>();
  balances.set('0x1234567890abcdef1234567890abcdef12345678', totalUnits); // Mock owner
  tokenBalances.set(tokenAddress, balances);
  
  console.log(`[ERC-3643] Minted ${totalUnits} units of ${symbol} at ${tokenAddress}`);
  console.log(`[ERC-3643] Identity Registry: ${tokenization.identityRegistry}`);
  console.log(`[ERC-3643] Compliance: ${tokenization.compliance}`);
  
  return tokenization;
}

/**
 * ERC-3643 Claim Verification
 * Checks if an address has valid claims from trusted issuers for required topics
 */
function verifyClaimsForAddress(address: string, requiredTopics: number[]): { 
  isVerified: boolean; 
  missingClaims: number[];
  details: string;
} {
  const identity = mockIdentityRegistry.get(address);
  
  if (!identity) {
    return { 
      isVerified: false, 
      missingClaims: requiredTopics,
      details: 'No identity registered in Identity Registry'
    };
  }

  const missingClaims: number[] = [];
  
  for (const topic of requiredTopics) {
    const claim = identity.claims.find(c => c.topic === topic && c.isValid);
    if (!claim) {
      missingClaims.push(topic);
    } else {
      // Verify claim is from trusted issuer
      const isTrusted = trustedIssuers.some(
        issuer => issuer.address === claim.issuer && issuer.claimTopics.includes(topic)
      );
      if (!isTrusted) {
        missingClaims.push(topic);
      }
    }
  }

  return {
    isVerified: missingClaims.length === 0,
    missingClaims,
    details: missingClaims.length === 0 
      ? 'All required claims verified by trusted issuers'
      : `Missing claims: ${missingClaims.map(t => getClaimTopicName(t)).join(', ')}`
  };
}

function getClaimTopicName(topic: number): string {
  const names: Record<number, string> = {
    1: 'KYC',
    2: 'Accreditation',
    3: 'Jurisdiction',
    4: 'AML',
    5: 'Qualified Investor'
  };
  return names[topic] || `Topic-${topic}`;
}

export async function validateTransfer(
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  units: number
): Promise<TransferValidation> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const checks: ComplianceCheck[] = [];
  let canTransfer = true;
  let reasonCode = '0x51'; // SUCCESS
  let reasonDescription = 'Transfer approved';
  
  // Required claim topics for this token
  const requiredClaimTopics = [CLAIM_TOPICS.KYC, CLAIM_TOPICS.ACCREDITATION];
  
  // Get participant data
  const fromParticipant = Array.from(mockParticipants.values()).find(
    p => p.walletAddress?.toLowerCase().includes(fromAddress.slice(2, 6).toLowerCase())
  );
  const toParticipant = Array.from(mockParticipants.values()).find(
    p => p.walletAddress?.toLowerCase().includes(toAddress.slice(2, 6).toLowerCase())
  );
  
  // ERC-3643 Check 1: Verify Sender Identity & Claims
  const senderVerification = verifyClaimsForAddress(fromAddress, requiredClaimTopics);
  checks.push({
    name: 'Sender Identity Verification (ERC-3643)',
    passed: senderVerification.isVerified,
    details: senderVerification.details
  });
  if (!senderVerification.isVerified) {
    canTransfer = false;
    reasonCode = '0x56';
    reasonDescription = `Invalid sender - ${senderVerification.details}`;
  }
  
  // ERC-3643 Check 2: Verify Receiver Identity & Claims
  const receiverVerification = verifyClaimsForAddress(toAddress, requiredClaimTopics);
  checks.push({
    name: 'Receiver Identity Verification (ERC-3643)',
    passed: receiverVerification.isVerified,
    details: receiverVerification.details
  });
  if (!receiverVerification.isVerified && canTransfer) {
    canTransfer = false;
    reasonCode = '0x57';
    reasonDescription = `Invalid receiver - ${receiverVerification.details}`;
  }
  
  // ERC-3643 Check 3: Address Frozen Check
  const senderFrozen = frozenAddresses.has(fromAddress);
  const receiverFrozen = frozenAddresses.has(toAddress);
  checks.push({
    name: 'Address Freeze Status (ERC-3643)',
    passed: !senderFrozen && !receiverFrozen,
    details: senderFrozen ? 'Sender address is frozen' : 
             receiverFrozen ? 'Receiver address is frozen' : 
             'No frozen addresses'
  });
  if ((senderFrozen || receiverFrozen) && canTransfer) {
    canTransfer = false;
    reasonCode = '0x55';
    reasonDescription = senderFrozen ? 'Sender address frozen' : 'Receiver address frozen';
  }
  
  // ERC-3643 Check 4: Compliance Module - Lockup Period
  const lockupExpired = !fromParticipant?.lockupEndDate || 
    fromParticipant.lockupEndDate < new Date();
  checks.push({
    name: 'Compliance: Lockup Period',
    passed: lockupExpired,
    details: lockupExpired ? 'No active lockup' : 'Lockup period still active'
  });
  if (!lockupExpired && canTransfer) {
    canTransfer = false;
    reasonCode = '0x55';
    reasonDescription = 'Funds locked - Lockup period active';
  }
  
  // Check 5: Balance check (including frozen tokens)
  const balances = tokenBalances.get(tokenAddress);
  const senderBalance = balances?.get(fromAddress) ?? 0;
  const senderFrozenTokens = frozenTokens.get(fromAddress) ?? 0;
  const availableBalance = senderBalance - senderFrozenTokens;
  const hasBalance = availableBalance >= units;
  checks.push({
    name: 'Available Balance Check',
    passed: hasBalance,
    details: hasBalance 
      ? `Available: ${availableBalance} units (${senderBalance} total, ${senderFrozenTokens} frozen)` 
      : `Insufficient: ${availableBalance} available < ${units} requested`
  });
  if (!hasBalance && canTransfer) {
    canTransfer = false;
    reasonCode = '0x52';
    reasonDescription = 'Insufficient available balance';
  }
  
  // ERC-3643 Check 6: Compliance Module - Country Restrictions
  const receiverCountry = mockIdentityRegistry.get(toAddress)?.country ?? 0;
  const blacklistedCountries = [408, 364, 760]; // North Korea, Iran, Syria
  const validCountry = receiverCountry > 0 && !blacklistedCountries.includes(receiverCountry);
  checks.push({
    name: 'Compliance: Country Eligibility',
    passed: validCountry,
    details: validCountry 
      ? `Approved country code: ${receiverCountry}` 
      : receiverCountry === 0 
        ? 'Country not verified in Identity Registry'
        : 'Country is restricted'
  });
  
  return {
    canTransfer,
    reasonCode,
    reasonDescription,
    checks
  };
}

export async function executeTransfer(
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  units: number,
  pricePerUnit: number
): Promise<Trade> {
  // First validate using ERC-3643 checks
  const validation = await validateTransfer(tokenAddress, fromAddress, toAddress, units);
  
  if (!validation.canTransfer) {
    throw new Error(validation.reasonDescription);
  }
  
  // Simulate blockchain transaction
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Update balances
  const balances = tokenBalances.get(tokenAddress) ?? new Map();
  const fromBalance = balances.get(fromAddress) ?? 0;
  const toBalance = balances.get(toAddress) ?? 0;
  
  balances.set(fromAddress, fromBalance - units);
  balances.set(toAddress, toBalance + units);
  tokenBalances.set(tokenAddress, balances);
  
  // Get participant info
  const fromParticipant = Array.from(mockParticipants.values()).find(
    p => p.walletAddress?.toLowerCase().includes(fromAddress.slice(2, 6).toLowerCase())
  ) ?? {
    id: uuidv4(),
    name: 'Unknown Seller',
    type: 'fund' as const,
    walletAddress: fromAddress,
    kycStatus: 'approved' as const,
    accreditedInvestor: true,
    jurisdiction: 'US'
  };
  
  const toParticipant = Array.from(mockParticipants.values()).find(
    p => p.walletAddress?.toLowerCase().includes(toAddress.slice(2, 6).toLowerCase())
  ) ?? {
    id: uuidv4(),
    name: 'Unknown Buyer',
    type: 'fund' as const,
    walletAddress: toAddress,
    kycStatus: 'approved' as const,
    accreditedInvestor: true,
    jurisdiction: 'US'
  };
  
  const settledAt = new Date();
  const createdAt = new Date(settledAt.getTime() - 2500); // 2.5 seconds ago
  
  const trade: Trade = {
    id: uuidv4(),
    loanId: 'mock-loan-id',
    tokenAddress,
    seller: fromParticipant,
    buyer: toParticipant,
    units,
    pricePerUnit,
    totalValue: units * pricePerUnit,
    status: 'settled',
    validation,
    createdAt,
    settledAt,
    txHash: '0x' + uuidv4().replace(/-/g, ''),
    settlementTime: 2.5 // 2.5 seconds - T+0 settlement!
  };
  
  tradeHistory.push(trade);
  
  console.log(`[ERC-3643] Transfer executed: ${units} units from ${fromParticipant.name} to ${toParticipant.name}`);
  
  return trade;
}

// ERC-3643: Freeze/Unfreeze Address
export function freezeAddress(address: string, freeze: boolean): void {
  if (freeze) {
    frozenAddresses.add(address);
  } else {
    frozenAddresses.delete(address);
  }
  console.log(`[ERC-3643] Address ${address} ${freeze ? 'frozen' : 'unfrozen'}`);
}

// ERC-3643: Freeze/Unfreeze Tokens
export function freezeTokensForAddress(address: string, amount: number): void {
  const current = frozenTokens.get(address) ?? 0;
  frozenTokens.set(address, current + amount);
  console.log(`[ERC-3643] Froze ${amount} tokens for ${address}`);
}

export function unfreezeTokensForAddress(address: string, amount: number): void {
  const current = frozenTokens.get(address) ?? 0;
  frozenTokens.set(address, Math.max(0, current - amount));
  console.log(`[ERC-3643] Unfroze ${amount} tokens for ${address}`);
}

// ERC-3643: Register Identity
export function registerIdentity(
  walletAddress: string,
  identityContract: string,
  claims: IdentityClaim[],
  country: number
): void {
  mockIdentityRegistry.set(walletAddress, {
    id: identityContract,
    walletAddress,
    claims,
    country,
    isVerified: claims.every(c => c.isValid)
  });
  console.log(`[ERC-3643] Identity registered for ${walletAddress}`);
}

export function getTokenBalances(tokenAddress: string): Map<string, number> {
  return tokenBalances.get(tokenAddress) ?? new Map();
}

export function getTradeHistory(): Trade[] {
  return tradeHistory;
}

export function getParticipants(): Participant[] {
  return Array.from(mockParticipants.values());
}

export function addParticipant(participant: Participant): void {
  const key = participant.walletAddress?.slice(0, 6) + '...' + participant.walletAddress?.slice(-4);
  mockParticipants.set(key, participant);
  
  // Also register identity if claims provided
  if (participant.walletAddress && participant.identityContract && participant.claims) {
    registerIdentity(
      participant.walletAddress,
      participant.identityContract,
      participant.claims,
      getCountryCode(participant.jurisdiction)
    );
  }
}

// ERC-3643: Get Identity Registry Info
export function getIdentityInfo(walletAddress: string): OnChainIdentity | undefined {
  return mockIdentityRegistry.get(walletAddress);
}

// ERC-3643: Get Trusted Issuers
export function getTrustedIssuers() {
  return trustedIssuers;
}
