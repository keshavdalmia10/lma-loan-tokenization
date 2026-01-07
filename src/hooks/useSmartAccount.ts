'use client';

/**
 * useSmartAccount Hook
 *
 * Manages the lifecycle of an ERC-4337 smart account for the current user.
 *
 * Flow:
 * 1. User signs in with Privy (email/Google/Apple)
 * 2. Privy creates an embedded MPC wallet automatically
 * 3. This hook creates a Safe smart account owned by that wallet
 * 4. All transactions go through the smart account with gas sponsorship
 *
 * The user never sees wallets, keys, or gas - it's completely invisible.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import {
  createSmartAccount,
  type SmartAccountResult,
} from '@/lib/services/smart-account';
import { getBlockchainMode } from '@/lib/services/blockchain-factory';
import { logger } from '@/lib/utils/logger';

interface UseSmartAccountReturn {
  // Smart account state
  smartAccountClient: SmartAccountResult['smartAccountClient'] | null;
  smartAccountAddress: string | null;
  publicClient: SmartAccountResult['publicClient'] | null;

  // Privy wallet state
  privyWallet: ReturnType<typeof useWallets>['wallets'][0] | null;
  privyWalletAddress: string | null;

  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  isReady: boolean;

  // Error state
  error: Error | null;

  // Actions
  refreshSmartAccount: () => Promise<void>;
}

export function useSmartAccount(): UseSmartAccountReturn {
  const { ready: privyReady, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const [smartAccountClient, setSmartAccountClient] =
    useState<SmartAccountResult['smartAccountClient'] | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );
  const [publicClient, setPublicClient] =
    useState<SmartAccountResult['publicClient'] | null>(null);
  const [privyWallet, setPrivyWallet] =
    useState<ReturnType<typeof useWallets>['wallets'][0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track initialization to prevent double-init
  const initializingRef = useRef(false);
  const initializedForUserRef = useRef<string | null>(null);

  // Get chain based on environment
  const chainId = process.env.NEXT_PUBLIC_CHAIN === 'base' ? 8453 : 84532;
  const chain = chainId === 8453 ? base : baseSepolia;

  /**
   * Initialize smart account for the current user
   */
  const initializeSmartAccount = useCallback(async () => {
    // Skip if in mock mode
    if (getBlockchainMode() === 'mock') {
      setIsInitializing(false);
      return;
    }

    // Skip if already initializing or not ready
    if (initializingRef.current) return;
    if (!privyReady || !authenticated) {
      setIsInitializing(false);
      return;
    }

    // Skip if we already initialized for this user
    const userId = user?.id;
    if (userId && initializedForUserRef.current === userId) {
      return;
    }

    // Find the embedded wallet from Privy
    const embeddedWallet = wallets.find(
      (w) => w.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      // Wallet might still be loading
      logger.ui.debug('Waiting for embedded wallet...');
      return;
    }

    initializingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      logger.ui.info('Initializing smart account', { userId });

      // Get the Ethereum provider from Privy wallet
      const provider = await embeddedWallet.getEthereumProvider();
      logger.privy.debug('Got Ethereum provider from embedded wallet');

      // Create a wallet client from the Privy embedded wallet
      const walletClient = createWalletClient({
        chain,
        transport: custom(provider),
        account: embeddedWallet.address as `0x${string}`,
      });

      // Create the smart account
      const result = await createSmartAccount(walletClient, chainId);

      setSmartAccountClient(result.smartAccountClient);
      setSmartAccountAddress(result.smartAccountAddress);
      setPublicClient(result.publicClient);
      setPrivyWallet(embeddedWallet);

      initializedForUserRef.current = userId || null;

      logger.ui.info('Smart account initialized', {
        smartAccount: result.smartAccountAddress.slice(0, 10) + '...',
        privyWallet: embeddedWallet.address.slice(0, 10) + '...',
      });
    } catch (err) {
      logger.ui.error('Smart account initialization failed', { error: String(err) });
      setError(err instanceof Error ? err : new Error('Failed to initialize smart account'));
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
      initializingRef.current = false;
    }
  }, [privyReady, authenticated, user?.id, wallets, chain, chainId]);

  /**
   * Refresh smart account (e.g., after wallet changes)
   */
  const refreshSmartAccount = useCallback(async () => {
    initializedForUserRef.current = null;
    await initializeSmartAccount();
  }, [initializeSmartAccount]);

  // Initialize on auth state changes
  useEffect(() => {
    initializeSmartAccount();
  }, [initializeSmartAccount]);

  // Clean up on logout
  useEffect(() => {
    if (!authenticated) {
      setSmartAccountClient(null);
      setSmartAccountAddress(null);
      setPublicClient(null);
      setPrivyWallet(null);
      setError(null);
      initializedForUserRef.current = null;
    }
  }, [authenticated]);

  const isReady =
    getBlockchainMode() === 'mock' ||
    (!!smartAccountClient && !!smartAccountAddress);

  return {
    smartAccountClient,
    smartAccountAddress,
    publicClient,
    privyWallet,
    privyWalletAddress: privyWallet?.address || null,
    isLoading,
    isInitializing,
    isReady,
    error,
    refreshSmartAccount,
  };
}
