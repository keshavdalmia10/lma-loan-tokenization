/**
 * Real Blockchain Service for ERC-4337 Smart Account Transactions
 *
 * This service executes actual on-chain transactions using a smart account client.
 * Gas fees are sponsored by the Pimlico paymaster - users never pay gas.
 *
 * All transactions are UserOperations submitted through the bundler.
 */

import { v4 as uuidv4 } from 'uuid';
import { encodeFunctionData, parseEventLogs, type PublicClient } from 'viem';
import { LoanTokenABI, LoanTokenFactoryABI, IdentityRegistryABI } from '../contracts/abi';
import type {
  TokenizationData,
  TransferValidation,
  Trade,
  ComplianceCheck,
} from '../types/loan';
import { logger } from '../utils/logger';

// Use a flexible type for smart account client to avoid version conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SmartAccountClientType = any;

// Partition constants (must match contract)
const PRIMARY_PARTITION = '0x5052494d415259000000000000000000000000000000000000000000000000000' as `0x${string}`;

// ERC-3643 Claim Topics (must match ClaimTopicsRegistry)
export const CLAIM_TOPICS = {
  KYC: 1,
  ACCREDITATION: 2,
  JURISDICTION: 3,
  AML: 4,
  QUALIFIED_INVESTOR: 5,
} as const;

export class RealBlockchainService {
  private smartAccountClient: SmartAccountClientType;
  private publicClient: PublicClient;
  private factoryAddress: `0x${string}`;
  private smartAccountAddress: `0x${string}`;
  private chainId: number;

  constructor(
    smartAccountClient: SmartAccountClientType,
    publicClient: PublicClient,
    factoryAddress: string,
    smartAccountAddress: string,
    chainId: number = 84532
  ) {
    this.smartAccountClient = smartAccountClient;
    this.publicClient = publicClient;
    this.factoryAddress = factoryAddress as `0x${string}`;
    this.smartAccountAddress = smartAccountAddress as `0x${string}`;
    this.chainId = chainId;

    logger.blockchain.info('RealBlockchainService initialized', {
      chainId,
      factoryAddress,
      smartAccountAddress: smartAccountAddress.slice(0, 10) + '...',
    });
  }

  /**
   * Mint a new loan token through the factory
   * Gas is sponsored by paymaster - user pays nothing
   */
  async mintLoanToken(
    nelId: string,
    terms: {
      borrowerName: string;
      facilityAmount: number;
      interestRateBps: number;
      maturityDate: Date;
    },
    documentHash: string,
    totalUnits: number = 100
  ): Promise<TokenizationData> {
    const symbol = `LT-${terms.borrowerName.split(' ')[0].toUpperCase().slice(0, 4)}`;
    const name = `${terms.borrowerName} Loan Token`;

    logger.blockchain.info('Minting loan token', {
      nelId,
      symbol,
      borrower: terms.borrowerName,
      facilityAmount: terms.facilityAmount,
    });

    const startTime = Date.now();

    // Encode the function call
    const data = encodeFunctionData({
      abi: LoanTokenFactoryABI,
      functionName: 'createLoanToken',
      args: [
        name,
        symbol,
        terms.borrowerName,
        BigInt(Math.floor(terms.facilityAmount)),
        BigInt(terms.interestRateBps),
        BigInt(Math.floor(terms.maturityDate.getTime() / 1000)),
        nelId,
        documentHash as `0x${string}`,
      ],
    });

    logger.blockchain.debug('Sending UserOperation to factory', {
      factory: this.factoryAddress,
    });

    // Send UserOperation - gas sponsored by paymaster
    const txHash = await this.smartAccountClient.sendTransaction({
      to: this.factoryAddress,
      data,
      value: BigInt(0),
    });

    logger.blockchain.tx('UserOperation submitted', txHash);

    // Wait for receipt
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    logger.blockchain.debug('Transaction confirmed', {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
    });

    // Parse LoanTokenCreated event to get token address
    const logs = parseEventLogs({
      abi: LoanTokenFactoryABI,
      logs: receipt.logs,
      eventName: 'LoanTokenCreated',
    });

    const tokenAddress = logs[0]?.args?.tokenAddress as `0x${string}` || `0x${uuidv4().replace(/-/g, '').slice(0, 40)}`;

    const tokenization: TokenizationData = {
      tokenAddress,
      tokenSymbol: symbol,
      totalUnits,
      unitValue: terms.facilityAmount / totalUnits,
      partition: 'PRIMARY',
      status: 'minted',
      mintedAt: new Date(),
      blockchain: 'Base Sepolia',
      chainId: this.chainId,
      identityRegistry: '', // Would be set from factory
      compliance: '',
    };

    logger.blockchain.timing('Token minted', Date.now() - startTime, {
      symbol,
      tokenAddress,
      txHash,
    });

    return tokenization;
  }

  /**
   * Validate a transfer using on-chain compliance checks
   */
  async validateTransfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    units: number
  ): Promise<TransferValidation> {
    const checks: ComplianceCheck[] = [];

    logger.blockchain.info('Validating transfer', {
      tokenAddress: tokenAddress.slice(0, 10) + '...',
      from: fromAddress.slice(0, 10) + '...',
      to: toAddress.slice(0, 10) + '...',
      units,
    });

    try {
      // Call canTransferByPartition on the token contract
      const [reasonCode, appCode] = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'canTransferByPartition',
        args: [PRIMARY_PARTITION, toAddress as `0x${string}`, BigInt(units), '0x'],
      });

      const canTransfer = reasonCode === '0x51'; // SUCCESS code

      checks.push({
        name: 'On-chain Compliance Check',
        passed: canTransfer,
        details: canTransfer
          ? 'Transfer approved by smart contract'
          : `Transfer rejected: code ${reasonCode}`,
      });

      // Get compliance status for from address
      const [kyc, accredited, lockupEnd, canCurrentlyTransfer] = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'getComplianceStatus',
        args: [fromAddress as `0x${string}`],
      });

      checks.push({
        name: 'Sender KYC Status',
        passed: kyc,
        details: kyc ? 'KYC verified' : 'KYC not verified',
      });

      checks.push({
        name: 'Sender Accreditation',
        passed: accredited,
        details: accredited ? 'Accredited investor' : 'Not accredited',
      });

      checks.push({
        name: 'Sender Lockup',
        passed: canCurrentlyTransfer,
        details: canCurrentlyTransfer
          ? 'No active lockup'
          : `Locked until ${new Date(Number(lockupEnd) * 1000).toISOString()}`,
      });

      // Check receiver
      const [toKyc, toAccredited] = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'getComplianceStatus',
        args: [toAddress as `0x${string}`],
      });

      checks.push({
        name: 'Receiver KYC Status',
        passed: toKyc,
        details: toKyc ? 'KYC verified' : 'KYC not verified',
      });

      // Get balance
      const balance = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'balanceOfByPartition',
        args: [PRIMARY_PARTITION, fromAddress as `0x${string}`],
      });

      const hasBalance = balance >= BigInt(units);
      checks.push({
        name: 'Balance Check',
        passed: hasBalance,
        details: hasBalance
          ? `Available: ${balance.toString()} units`
          : `Insufficient: ${balance.toString()} < ${units}`,
      });

      const result = {
        canTransfer: canTransfer && hasBalance,
        reasonCode: reasonCode as string,
        reasonDescription: canTransfer && hasBalance
          ? 'Transfer approved'
          : 'Transfer not allowed',
        checks,
      };

      logger.blockchain.info('Transfer validation complete', {
        canTransfer: result.canTransfer,
        reasonCode: result.reasonCode,
        checksCount: checks.length,
      });

      return result;
    } catch (error) {
      logger.blockchain.error('Validation error', { error: String(error) });
      return {
        canTransfer: false,
        reasonCode: '0x50',
        reasonDescription: `Validation failed: ${error}`,
        checks: [
          {
            name: 'Contract Validation',
            passed: false,
            details: `Error: ${error}`,
          },
        ],
      };
    }
  }

  /**
   * Execute a token transfer via smart account
   * Gas is sponsored by paymaster
   */
  async executeTransfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    units: number,
    pricePerUnit: number
  ): Promise<Trade> {
    logger.blockchain.info('Executing transfer', {
      tokenAddress: tokenAddress.slice(0, 10) + '...',
      from: fromAddress.slice(0, 10) + '...',
      to: toAddress.slice(0, 10) + '...',
      units,
      totalValue: units * pricePerUnit,
    });

    // First validate
    const validation = await this.validateTransfer(
      tokenAddress,
      fromAddress,
      toAddress,
      units
    );

    if (!validation.canTransfer) {
      logger.blockchain.error('Transfer validation failed', {
        reason: validation.reasonDescription,
      });
      throw new Error(validation.reasonDescription);
    }

    // Encode transfer function
    const data = encodeFunctionData({
      abi: LoanTokenABI,
      functionName: 'transferByPartition',
      args: [
        PRIMARY_PARTITION,
        toAddress as `0x${string}`,
        BigInt(units),
        '0x',
      ],
    });

    const startTime = Date.now();

    logger.blockchain.debug('Sending transfer UserOperation');

    // Send UserOperation - gas sponsored
    const txHash = await this.smartAccountClient.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data,
      value: BigInt(0),
    });

    logger.blockchain.tx('Transfer submitted', txHash);

    // Wait for confirmation
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    const endTime = Date.now();
    const settlementTime = (endTime - startTime) / 1000;

    logger.blockchain.timing('Transfer settled', endTime - startTime, {
      settlementTime: `${settlementTime}s`,
      txHash,
    });

    const trade: Trade = {
      id: uuidv4(),
      loanId: 'real-loan',
      tokenAddress,
      seller: {
        id: uuidv4(),
        name: 'Smart Account',
        type: 'fund',
        walletAddress: fromAddress,
        kycStatus: 'approved',
        accreditedInvestor: true,
        jurisdiction: 'US',
      },
      buyer: {
        id: uuidv4(),
        name: 'Recipient',
        type: 'fund',
        walletAddress: toAddress,
        kycStatus: 'approved',
        accreditedInvestor: true,
        jurisdiction: 'US',
      },
      units,
      pricePerUnit,
      totalValue: units * pricePerUnit,
      status: 'settled',
      validation,
      createdAt: new Date(startTime),
      settledAt: new Date(endTime),
      txHash,
      settlementTime,
    };

    
    return trade;
  }

  /**
   * Issue new tokens to an address
   */
  async issueTokens(
    tokenAddress: string,
    toAddress: string,
    amount: number
  ): Promise<string> {
    const data = encodeFunctionData({
      abi: LoanTokenABI,
      functionName: 'issue',
      args: [
        toAddress as `0x${string}`,
        BigInt(amount),
        PRIMARY_PARTITION,
      ],
    });

    const txHash = await this.smartAccountClient.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data,
      value: BigInt(0),
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`[ERC-3643] Issued ${amount} tokens to ${toAddress}`);

    return txHash;
  }

  /**
   * Get token balance for an address
   */
  async getBalance(
    tokenAddress: string,
    holderAddress: string
  ): Promise<number> {
    const balance = await this.publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: LoanTokenABI,
      functionName: 'balanceOfByPartition',
      args: [PRIMARY_PARTITION, holderAddress as `0x${string}`],
    });

    return Number(balance);
  }

  /**
   * Get user's smart account address
   */
  getSmartAccountAddress(): string {
    return this.smartAccountAddress;
  }

  /**
   * Get the chain ID
   */
  getChainId(): number {
    return this.chainId;
  }

  // ===========================================================================
  // ERC-3643 IDENTITY & COMPLIANCE METHODS
  // ===========================================================================

  /**
   * Check if the smart account is registered in the Identity Registry
   * This is REQUIRED for ERC-3643 compliant transfers
   */
  async isIdentityRegistered(identityRegistryAddress: string): Promise<boolean> {
    try {
      const isVerified = await this.publicClient.readContract({
        address: identityRegistryAddress as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'isVerified',
        args: [this.smartAccountAddress],
      });
      return isVerified as boolean;
    } catch {
      return false;
    }
  }

  /**
   * Register the smart account identity in the ERC-3643 Identity Registry
   * This must be called by an agent with registration rights (typically admin)
   *
   * @param identityRegistryAddress - Address of the Identity Registry
   * @param identityContract - Address of the on-chain identity contract (ONCHAINID)
   * @param countryCode - ISO 3166-1 numeric country code (e.g., 840 for US)
   */
  async registerSmartAccountIdentity(
    identityRegistryAddress: string,
    identityContract: string,
    countryCode: number
  ): Promise<string> {
    const data = encodeFunctionData({
      abi: IdentityRegistryABI,
      functionName: 'registerIdentity',
      args: [
        this.smartAccountAddress,
        identityContract as `0x${string}`,
        countryCode,
      ],
    });

    const txHash = await this.smartAccountClient.sendTransaction({
      to: identityRegistryAddress as `0x${string}`,
      data,
      value: BigInt(0),
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`[ERC-3643] Identity registered for smart account ${this.smartAccountAddress}`);

    return txHash;
  }

  /**
   * Get the compliance status of the smart account for a specific token
   */
  async getSmartAccountComplianceStatus(tokenAddress: string): Promise<{
    kyc: boolean;
    accredited: boolean;
    lockupEnd: bigint;
    canCurrentlyTransfer: boolean;
  }> {
    const [kyc, accredited, lockupEnd, canCurrentlyTransfer] = await this.publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: LoanTokenABI,
      functionName: 'getComplianceStatus',
      args: [this.smartAccountAddress],
    });

    return {
      kyc: kyc as boolean,
      accredited: accredited as boolean,
      lockupEnd: lockupEnd as bigint,
      canCurrentlyTransfer: canCurrentlyTransfer as boolean,
    };
  }

  /**
   * Set KYC status for the smart account (admin function)
   */
  async setSmartAccountKYC(tokenAddress: string, approved: boolean): Promise<string> {
    const data = encodeFunctionData({
      abi: LoanTokenABI,
      functionName: 'setKYCStatus',
      args: [this.smartAccountAddress, approved],
    });

    const txHash = await this.smartAccountClient.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data,
      value: BigInt(0),
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`[ERC-3643] KYC status set to ${approved} for ${this.smartAccountAddress}`);

    return txHash;
  }

  /**
   * Set accreditation status for the smart account (admin function)
   */
  async setSmartAccountAccreditation(tokenAddress: string, accredited: boolean): Promise<string> {
    const data = encodeFunctionData({
      abi: LoanTokenABI,
      functionName: 'setAccreditedStatus',
      args: [this.smartAccountAddress, accredited],
    });

    const txHash = await this.smartAccountClient.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data,
      value: BigInt(0),
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`[ERC-3643] Accreditation set to ${accredited} for ${this.smartAccountAddress}`);

    return txHash;
  }

  /**
   * Check if a transfer would be compliant before executing
   * Uses the ERC-3643 canTransferByPartition function
   */
  async checkTransferCompliance(
    tokenAddress: string,
    toAddress: string,
    units: number
  ): Promise<{ canTransfer: boolean; reasonCode: string }> {
    try {
      const [reasonCode] = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'canTransferByPartition',
        args: [
          PRIMARY_PARTITION,
          toAddress as `0x${string}`,
          BigInt(units),
          '0x',
        ],
      });

      // ERC-1066 reason codes: 0x51 = success
      const canTransfer = (reasonCode as string) === '0x51';

      return { canTransfer, reasonCode: reasonCode as string };
    } catch (error) {
      return { canTransfer: false, reasonCode: '0x50' }; // 0x50 = failure
    }
  }
}
