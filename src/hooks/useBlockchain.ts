'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { keccak256, stringToHex } from 'viem';
import { useMemo, useCallback } from 'react';
import {
  LoanTokenFactoryABI,
  LoanTokenABI,
  IdentityRegistryABI,
  ComplianceABI,
} from '@/lib/contracts/abi';
import { getContracts } from '@/lib/wagmi/config';

// Partition constants
export const PRIMARY_PARTITION = keccak256(stringToHex('PRIMARY'));
export const SECONDARY_PARTITION = keccak256(stringToHex('SECONDARY'));

// ============ Factory Hooks ============

/**
 * Hook to get deployed contract addresses for the current chain
 */
export function useContractAddresses() {
  const chainId = useChainId();
  return useMemo(() => getContracts(chainId), [chainId]);
}

/**
 * Hook to create a new loan token via factory
 */
export function useCreateLoanToken() {
  const { loanTokenFactory: factoryAddress } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createLoanToken = useCallback(
    async (params: {
      name: string;
      symbol: string;
      borrowerName: string;
      facilityAmount: bigint;
      interestRateBps: number;
      maturityDate: number;
      nelProtocolId: string;
      documentHash: `0x${string}`;
    }) => {
      if (!factoryAddress) throw new Error('Factory address not configured');

      return writeContract({
        address: factoryAddress as `0x${string}`,
        abi: LoanTokenFactoryABI,
        functionName: 'createLoanToken',
        args: [
          params.name,
          params.symbol,
          params.borrowerName,
          params.facilityAmount,
          BigInt(params.interestRateBps),
          BigInt(params.maturityDate),
          params.nelProtocolId,
          params.documentHash,
        ],
      });
    },
    [factoryAddress, writeContract]
  );

  return {
    createLoanToken,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to get all deployed tokens from factory
 */
export function useDeployedTokens() {
  const { loanTokenFactory: factoryAddress } = useContractAddresses();

  return useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: LoanTokenFactoryABI,
    functionName: 'getDeployedTokens',
    query: {
      enabled: !!factoryAddress,
    },
  });
}

/**
 * Hook to get token address by NEL Protocol ID
 */
export function useTokenByNelId(nelId: string) {
  const { loanTokenFactory: factoryAddress } = useContractAddresses();

  return useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: LoanTokenFactoryABI,
    functionName: 'getTokenByNelId',
    args: [nelId],
    query: {
      enabled: !!factoryAddress && !!nelId,
    },
  });
}

// ============ Loan Token Hooks ============

/**
 * Hook to get loan token balance
 */
export function useTokenBalance(tokenAddress: string, holderAddress?: string) {
  const { address } = useAccount();
  const holder = holderAddress || address;

  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'balanceOf',
    args: holder ? [holder as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!holder,
    },
  });
}

/**
 * Hook to get balance by partition
 */
export function useBalanceByPartition(
  tokenAddress: string,
  partition: `0x${string}` = PRIMARY_PARTITION,
  holderAddress?: string
) {
  const { address } = useAccount();
  const holder = holderAddress || address;

  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'balanceOfByPartition',
    args: holder ? [partition, holder as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!holder,
    },
  });
}

/**
 * Hook to get loan details
 */
export function useLoanDetails(tokenAddress: string) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'getLoanSummary',
    query: {
      enabled: !!tokenAddress,
    },
  });
}

/**
 * Hook to check if transfer can be executed
 */
export function useCanTransfer(
  tokenAddress: string,
  to: string,
  value: bigint,
  partition: `0x${string}` = PRIMARY_PARTITION
) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'canTransferByPartition',
    args: [partition, to as `0x${string}`, value, '0x'],
    query: {
      enabled: !!tokenAddress && !!to && value > BigInt(0),
    },
  });
}

/**
 * Hook to transfer tokens by partition
 */
export function useTransferByPartition() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const transfer = useCallback(
    (
      tokenAddress: string,
      partition: `0x${string}`,
      to: string,
      value: bigint,
      data: `0x${string}` = '0x'
    ) => {
      return writeContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'transferByPartition',
        args: [partition, to as `0x${string}`, value, data],
      });
    },
    [writeContract]
  );

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    error,
  };
}

/**
 * Hook to get compliance status for an address
 */
export function useComplianceStatus(tokenAddress: string, accountAddress?: string) {
  const { address } = useAccount();
  const account = accountAddress || address;

  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'getComplianceStatus',
    args: account ? [account as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });
}

// ============ Identity Registry Hooks ============

/**
 * Hook to check if an address is verified
 */
export function useIsVerified(identityRegistryAddress: string, userAddress?: string) {
  const { address } = useAccount();
  const user = userAddress || address;

  return useReadContract({
    address: identityRegistryAddress as `0x${string}`,
    abi: IdentityRegistryABI,
    functionName: 'isVerified',
    args: user ? [user as `0x${string}`] : undefined,
    query: {
      enabled: !!identityRegistryAddress && !!user,
    },
  });
}

/**
 * Hook to get investor country
 */
export function useInvestorCountry(identityRegistryAddress: string, userAddress?: string) {
  const { address } = useAccount();
  const user = userAddress || address;

  return useReadContract({
    address: identityRegistryAddress as `0x${string}`,
    abi: IdentityRegistryABI,
    functionName: 'investorCountry',
    args: user ? [user as `0x${string}`] : undefined,
    query: {
      enabled: !!identityRegistryAddress && !!user,
    },
  });
}

/**
 * Hook to register an identity (owner only)
 */
export function useRegisterIdentity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerIdentity = useCallback(
    (
      identityRegistryAddress: string,
      userAddress: string,
      identityAddress: string,
      countryCode: number
    ) => {
      return writeContract({
        address: identityRegistryAddress as `0x${string}`,
        abi: IdentityRegistryABI,
        functionName: 'registerIdentity',
        args: [
          userAddress as `0x${string}`,
          identityAddress as `0x${string}`,
          countryCode,
        ],
      });
    },
    [writeContract]
  );

  return {
    registerIdentity,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Token Issuance Hooks ============

/**
 * Hook to issue tokens (owner only)
 */
export function useIssueTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const issue = useCallback(
    (
      tokenAddress: string,
      tokenHolder: string,
      value: bigint,
      partition: `0x${string}` = PRIMARY_PARTITION
    ) => {
      return writeContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'issue',
        args: [tokenHolder as `0x${string}`, value, partition],
      });
    },
    [writeContract]
  );

  return {
    issue,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to redeem tokens
 */
export function useRedeemTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const redeem = useCallback(
    (tokenAddress: string, value: bigint, partition: `0x${string}` = PRIMARY_PARTITION) => {
      return writeContract({
        address: tokenAddress as `0x${string}`,
        abi: LoanTokenABI,
        functionName: 'redeem',
        args: [value, partition],
      });
    },
    [writeContract]
  );

  return {
    redeem,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Freeze & Pause Hooks ============

/**
 * Hook to check if token is paused
 */
export function useIsPaused(tokenAddress: string) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'paused',
    query: {
      enabled: !!tokenAddress,
    },
  });
}

/**
 * Hook to check if address is frozen
 */
export function useIsFrozen(tokenAddress: string, accountAddress?: string) {
  const { address } = useAccount();
  const account = accountAddress || address;

  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'isFrozen',
    args: account ? [account as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });
}

/**
 * Hook to get frozen token amount
 */
export function useFrozenTokens(tokenAddress: string, accountAddress?: string) {
  const { address } = useAccount();
  const account = accountAddress || address;

  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: LoanTokenABI,
    functionName: 'getFrozenTokens',
    args: account ? [account as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });
}

// ============ Combined Transfer Validation Hook ============

export interface TransferValidation {
  canTransfer: boolean;
  reasonCode: string;
  reasonDescription: string;
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
}

/**
 * Comprehensive hook to validate a transfer
 */
export function useValidateTransfer(
  tokenAddress: string,
  identityRegistryAddress: string,
  from: string,
  to: string,
  value: bigint
): TransferValidation | null {
  const { data: canTransferResult } = useCanTransfer(tokenAddress, to, value);
  const { data: senderVerified } = useIsVerified(identityRegistryAddress, from);
  const { data: receiverVerified } = useIsVerified(identityRegistryAddress, to);
  const { data: senderFrozen } = useIsFrozen(tokenAddress, from);
  const { data: receiverFrozen } = useIsFrozen(tokenAddress, to);
  const { data: senderBalance } = useBalanceByPartition(tokenAddress, PRIMARY_PARTITION, from);
  const { data: paused } = useIsPaused(tokenAddress);
  const { data: senderCountry } = useInvestorCountry(identityRegistryAddress, from);
  const { data: receiverCountry } = useInvestorCountry(identityRegistryAddress, to);

  return useMemo(() => {
    if (!canTransferResult) return null;

    const [reasonCode, appCode] = canTransferResult as [string, string];
    const isSuccess = reasonCode === '0x51';

    const checks = [
      {
        name: 'Sender Identity Verification (ERC-3643)',
        passed: senderVerified === true,
        details: senderVerified ? 'Verified in Identity Registry' : 'Not verified',
      },
      {
        name: 'Receiver Identity Verification (ERC-3643)',
        passed: receiverVerified === true,
        details: receiverVerified ? 'Verified in Identity Registry' : 'Not verified',
      },
      {
        name: 'Address Freeze Status (ERC-3643)',
        passed: !senderFrozen && !receiverFrozen,
        details: senderFrozen || receiverFrozen ? 'Address is frozen' : 'No frozen addresses',
      },
      {
        name: 'Token Pause Status',
        passed: paused !== true,
        details: paused ? 'Token is paused' : 'Token is active',
      },
      {
        name: 'Available Balance Check',
        passed: senderBalance !== undefined && senderBalance >= value,
        details: `Available: ${senderBalance?.toString() || '0'} units`,
      },
      {
        name: 'Sender Country Eligibility',
        passed: senderCountry !== undefined && senderCountry > 0,
        details: `Country code: ${senderCountry || 'Unknown'}`,
      },
      {
        name: 'Receiver Country Eligibility',
        passed: receiverCountry !== undefined && receiverCountry > 0,
        details: `Country code: ${receiverCountry || 'Unknown'}`,
      },
    ];

    const reasonDescriptions: Record<string, string> = {
      '0x51': 'Transfer approved',
      '0x52': 'Insufficient balance',
      '0x55': 'Funds locked (token paused)',
      '0x56': 'Invalid sender (not verified or frozen)',
      '0x57': 'Invalid receiver (not verified or frozen)',
      '0x58': 'Compliance failure',
    };

    return {
      canTransfer: isSuccess,
      reasonCode,
      reasonDescription: reasonDescriptions[reasonCode] || 'Unknown reason',
      checks,
    };
  }, [
    canTransferResult,
    senderVerified,
    receiverVerified,
    senderFrozen,
    receiverFrozen,
    senderBalance,
    paused,
    senderCountry,
    receiverCountry,
    value,
  ]);
}

// ============ Utility Hooks ============

/**
 * Hook to get current user's wallet info
 */
export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const chainId = useChainId();

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
  };
}
