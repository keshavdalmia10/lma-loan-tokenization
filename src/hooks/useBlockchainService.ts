'use client';

/**
 * useBlockchainService Hook
 *
 * Provides the appropriate blockchain service based on the current mode.
 *
 * - Mock mode: Returns a service that simulates blockchain operations
 * - Real mode: Returns a service that uses ERC-4337 smart accounts
 *
 * The hook automatically selects the right service based on:
 * - NEXT_PUBLIC_BLOCKCHAIN_MODE environment variable
 * - Smart account availability (for real mode)
 */

import { useMemo, useEffect } from 'react';
import { useSmartAccount } from './useSmartAccount';
import {
  getBlockchainService,
  getBlockchainMode,
  type BlockchainService,
  type BlockchainMode,
} from '@/lib/services/blockchain-factory';
import { logger } from '@/lib/utils/logger';

interface UseBlockchainServiceReturn {
  // The blockchain service instance
  service: BlockchainService | null;

  // Current mode
  mode: BlockchainMode;

  // Ready state
  isReady: boolean;

  // Loading state
  isLoading: boolean;

  // Error state
  error: Error | null;

  // Smart account address (for real mode)
  smartAccountAddress: string | null;

  // Chain ID (for real mode)
  chainId: number | null;
}

export function useBlockchainService(): UseBlockchainServiceReturn {
  const {
    smartAccountClient,
    smartAccountAddress,
    publicClient,
    isLoading,
    isReady: smartAccountReady,
    error,
  } = useSmartAccount();

  const mode = getBlockchainMode();
  const chainId = process.env.NEXT_PUBLIC_CHAIN === 'base' ? 8453 : 84532;

  // Create the service instance
  const service = useMemo(() => {
    if (mode === 'mock') {
      // Mock mode - always available
      logger.blockchain.debug('Using mock blockchain service');
      return getBlockchainService();
    }

    // Real mode - needs smart account
    if (!smartAccountClient || !publicClient || !smartAccountAddress) {
      logger.blockchain.debug('Waiting for smart account...', {
        hasClient: !!smartAccountClient,
        hasPublic: !!publicClient,
        hasAddress: !!smartAccountAddress,
      });
      return null;
    }

    logger.blockchain.info('Creating real blockchain service', {
      mode: 'real',
      chainId,
      smartAccount: smartAccountAddress.slice(0, 10) + '...',
    });

    return getBlockchainService({
      smartAccountClient,
      publicClient,
      smartAccountAddress,
      chainId,
    });
  }, [mode, smartAccountClient, publicClient, smartAccountAddress, chainId]);

  // Ready when we have a service
  const isReady = mode === 'mock' ? true : smartAccountReady && !!service;

  // Log when service becomes ready
  useEffect(() => {
    if (isReady && service) {
      logger.blockchain.info('Blockchain service ready', { mode, isReady });
    }
  }, [isReady, service, mode]);

  return {
    service,
    mode,
    isReady,
    isLoading,
    error,
    smartAccountAddress: mode === 'real' ? smartAccountAddress : null,
    chainId: mode === 'real' ? chainId : null,
  };
}

/**
 * Hook to check if we're in mock mode
 */
export function useIsMockMode(): boolean {
  return getBlockchainMode() === 'mock';
}

/**
 * Hook to check if we're in real mode
 */
export function useIsRealMode(): boolean {
  return getBlockchainMode() === 'real';
}
