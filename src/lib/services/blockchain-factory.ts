/**
 * Blockchain Service Factory
 *
 * Provides a unified interface to switch between mock and real blockchain services.
 * Controlled by NEXT_PUBLIC_BLOCKCHAIN_MODE environment variable.
 *
 * - 'mock': Uses in-memory simulation (instant, no gas, no real transactions)
 * - 'real': Uses ERC-4337 smart accounts with Pimlico (actual on-chain transactions)
 */

import type { PublicClient } from 'viem';
import * as mockService from './blockchain';
import { RealBlockchainService } from './blockchain-real';
import type {
  TokenizationData,
  TransferValidation,
  Trade,
  Participant,
} from '../types/loan';

// Use a more flexible type for smart account client to avoid version conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SmartAccountClientType = any;

export type BlockchainMode = 'mock' | 'real';

/**
 * Unified blockchain service interface
 */
export interface BlockchainService {
  mode: BlockchainMode;

  // Core operations
  mintLoanToken(
    nelId: string,
    terms: {
      borrowerName: string;
      facilityAmount: number;
      interestRateBps: number;
      maturityDate: Date;
    },
    documentHash: string,
    totalUnits?: number
  ): Promise<TokenizationData>;

  validateTransfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    units: number
  ): Promise<TransferValidation>;

  executeTransfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    units: number,
    pricePerUnit: number
  ): Promise<Trade>;

  // Read operations
  getTradeHistory(): Trade[];
  getParticipants(): Participant[];

  // Identity operations (mock only for now)
  getIdentityInfo?(walletAddress: string): unknown;
  getTrustedIssuers?(): unknown[];

  // Smart account info (real mode only)
  getSmartAccountAddress?(): string;
  getChainId?(): number;

  // ERC-3643 Compliance operations (real mode only)
  isIdentityRegistered?(identityRegistryAddress: string): Promise<boolean>;
  registerSmartAccountIdentity?(
    identityRegistryAddress: string,
    identityContract: string,
    countryCode: number
  ): Promise<string>;
  getSmartAccountComplianceStatus?(tokenAddress: string): Promise<{
    kyc: boolean;
    accredited: boolean;
    lockupEnd: bigint;
    canCurrentlyTransfer: boolean;
  }>;
  checkTransferCompliance?(
    tokenAddress: string,
    toAddress: string,
    units: number
  ): Promise<{ canTransfer: boolean; reasonCode: string }>;
}

/**
 * Get the current blockchain mode from environment
 */
export function getBlockchainMode(): BlockchainMode {
  const mode = process.env.NEXT_PUBLIC_BLOCKCHAIN_MODE;
  if (mode === 'real') return 'real';
  return 'mock'; // Default to mock for safety
}

/**
 * Create a mock blockchain service wrapper
 */
function createMockService(): BlockchainService {
  return {
    mode: 'mock',

    async mintLoanToken(nelId, terms, documentHash, totalUnits) {
      return mockService.mintLoanToken(nelId, terms, documentHash, totalUnits);
    },

    async validateTransfer(tokenAddress, fromAddress, toAddress, units) {
      return mockService.validateTransfer(
        tokenAddress,
        fromAddress,
        toAddress,
        units
      );
    },

    async executeTransfer(tokenAddress, fromAddress, toAddress, units, pricePerUnit) {
      return mockService.executeTransfer(
        tokenAddress,
        fromAddress,
        toAddress,
        units,
        pricePerUnit
      );
    },

    getTradeHistory() {
      return mockService.getTradeHistory();
    },

    getParticipants() {
      return mockService.getParticipants();
    },

    getIdentityInfo(walletAddress) {
      return mockService.getIdentityInfo(walletAddress);
    },

    getTrustedIssuers() {
      return mockService.getTrustedIssuers();
    },
  };
}

/**
 * Create a real blockchain service wrapper
 */
function createRealService(
  smartAccountClient: SmartAccountClientType,
  publicClient: PublicClient,
  smartAccountAddress: string,
  chainId: number
): BlockchainService {
  const factoryAddress = getFactoryAddress(chainId);
  const realService = new RealBlockchainService(
    smartAccountClient,
    publicClient,
    factoryAddress,
    smartAccountAddress,
    chainId
  );

  // Keep track of trades locally (would be from indexer in production)
  const trades: Trade[] = [];

  return {
    mode: 'real',

    async mintLoanToken(nelId, terms, documentHash, totalUnits) {
      return realService.mintLoanToken(nelId, terms, documentHash, totalUnits);
    },

    async validateTransfer(tokenAddress, fromAddress, toAddress, units) {
      return realService.validateTransfer(
        tokenAddress,
        fromAddress,
        toAddress,
        units
      );
    },

    async executeTransfer(tokenAddress, fromAddress, toAddress, units, pricePerUnit) {
      const trade = await realService.executeTransfer(
        tokenAddress,
        fromAddress,
        toAddress,
        units,
        pricePerUnit
      );
      trades.push(trade);
      return trade;
    },

    getTradeHistory() {
      // In production, this would query an indexer or subgraph
      return trades;
    },

    getParticipants() {
      // In production, this would query identity registry
      return mockService.getParticipants();
    },

    getSmartAccountAddress() {
      return realService.getSmartAccountAddress();
    },

    getChainId() {
      return realService.getChainId();
    },

    // ERC-3643 Compliance methods
    async isIdentityRegistered(identityRegistryAddress: string) {
      return realService.isIdentityRegistered(identityRegistryAddress);
    },

    async registerSmartAccountIdentity(
      identityRegistryAddress: string,
      identityContract: string,
      countryCode: number
    ) {
      return realService.registerSmartAccountIdentity(
        identityRegistryAddress,
        identityContract,
        countryCode
      );
    },

    async getSmartAccountComplianceStatus(tokenAddress: string) {
      return realService.getSmartAccountComplianceStatus(tokenAddress);
    },

    async checkTransferCompliance(tokenAddress: string, toAddress: string, units: number) {
      return realService.checkTransferCompliance(tokenAddress, toAddress, units);
    },
  };
}

/**
 * Get factory address for a chain
 */
function getFactoryAddress(chainId: number): string {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_FACTORY_ADDRESS_BASE_SEPOLIA || '';
    case 8453: // Base
      return process.env.NEXT_PUBLIC_FACTORY_ADDRESS_BASE || '';
    case 31337: // Localhost
      return process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '';
    default:
      return '';
  }
}

/**
 * Get a blockchain service based on mode and context
 *
 * @param options - Configuration options
 * @returns BlockchainService instance
 */
export function getBlockchainService(options?: {
  smartAccountClient?: SmartAccountClientType;
  publicClient?: PublicClient;
  smartAccountAddress?: string;
  chainId?: number;
}): BlockchainService {
  const mode = getBlockchainMode();

  if (mode === 'mock') {
    return createMockService();
  }

  // Real mode requires smart account
  if (
    !options?.smartAccountClient ||
    !options?.publicClient ||
    !options?.smartAccountAddress
  ) {
    console.warn(
      'Real blockchain mode requires smart account. Falling back to mock.'
    );
    return createMockService();
  }

  return createRealService(
    options.smartAccountClient,
    options.publicClient,
    options.smartAccountAddress,
    options.chainId || 84532
  );
}

/**
 * Check if we're in mock mode
 */
export function isMockMode(): boolean {
  return getBlockchainMode() === 'mock';
}

/**
 * Check if we're in real mode
 */
export function isRealMode(): boolean {
  return getBlockchainMode() === 'real';
}
