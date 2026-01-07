/**
 * Smart Account Service for ERC-4337 Account Abstraction
 *
 * Creates and manages Safe smart accounts owned by Privy embedded wallets.
 * Uses Pimlico as bundler and paymaster for gasless transactions.
 *
 * Architecture:
 * - Privy creates an MPC-sharded embedded wallet (EOA) for the user
 * - This EOA becomes the owner of a Safe smart account
 * - All transactions go through the smart account
 * - Pimlico paymaster sponsors gas fees
 */

import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { baseSepolia, base } from 'viem/chains';
import {
  createPublicClient,
  http,
  type WalletClient,
  type PublicClient,
  type Chain,
} from 'viem';
import { entryPoint07Address } from 'viem/account-abstraction';
import { logger } from '../utils/logger';

// Use flexible types to avoid version conflicts with permissionless library
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SmartAccountClientType = any;

// Pimlico API configuration
const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY || '';

/**
 * Get Pimlico bundler/paymaster URL for a chain
 */
function getPimlicoUrl(chainId: number): string {
  const chainName = chainId === 84532 ? 'base-sepolia' : chainId === 8453 ? 'base' : 'base-sepolia';
  return `https://api.pimlico.io/v2/${chainName}/rpc?apikey=${PIMLICO_API_KEY}`;
}

/**
 * Get the chain object for a given chain ID
 */
function getChain(chainId: number): Chain {
  switch (chainId) {
    case 8453:
      return base;
    case 84532:
    default:
      return baseSepolia;
  }
}

/**
 * Get RPC URL for a chain
 */
function getRpcUrl(chainId: number): string {
  switch (chainId) {
    case 8453:
      return process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
    case 84532:
    default:
      return process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
  }
}

export interface SmartAccountResult {
  smartAccountClient: SmartAccountClientType;
  smartAccountAddress: `0x${string}`;
  publicClient: PublicClient;
}

/**
 * Create a Smart Account for a user
 *
 * @param privyWalletClient - The wallet client from Privy's embedded wallet
 * @param chainId - Target chain ID (default: Base Sepolia)
 * @returns Smart account client and address
 */
export async function createSmartAccount(
  privyWalletClient: WalletClient,
  chainId: number = 84532
): Promise<SmartAccountResult> {
  logger.smartAccount.info('Creating smart account', { chainId });
  const startTime = Date.now();

  if (!PIMLICO_API_KEY) {
    logger.smartAccount.error('Missing Pimlico API key');
    throw new Error('NEXT_PUBLIC_PIMLICO_API_KEY is required for smart accounts');
  }

  const chain = getChain(chainId);
  const rpcUrl = getRpcUrl(chainId);
  const pimlicoUrl = getPimlicoUrl(chainId);

  logger.smartAccount.debug('Initializing clients', { chain: chain.name, rpcUrl });

  // Create public client for blockchain reads
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  // Create Pimlico client for bundler + paymaster
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
  });

  logger.pimlico.debug('Pimlico client created', { entryPoint: '0.7' });

  // Get the signer address from the Privy wallet
  const ownerAddress = privyWalletClient.account?.address;
  if (!ownerAddress) {
    logger.smartAccount.error('Privy wallet has no account');
    throw new Error('Privy wallet client has no account');
  }

  logger.privy.info('Privy wallet connected', {
    owner: ownerAddress.slice(0, 10) + '...',
  });

  // Create Safe smart account owned by the Privy embedded wallet
  logger.smartAccount.debug('Creating Safe smart account');
  const safeAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [{ address: ownerAddress, type: 'local' } as any],
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
    version: '1.4.1',
  });

  logger.smartAccount.info('Safe account created', {
    address: safeAccount.address.slice(0, 10) + '...',
  });

  // Create smart account client with Pimlico paymaster for gas sponsorship
  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    chain,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        const gasPrice = await pimlicoClient.getUserOperationGasPrice();
        return gasPrice.fast;
      },
    },
  }) as SmartAccountClientType;

  logger.smartAccount.timing('Smart account ready', Date.now() - startTime, {
    smartAccount: safeAccount.address,
    owner: ownerAddress,
    chain: chain.name,
  });

  return {
    smartAccountClient,
    smartAccountAddress: safeAccount.address,
    publicClient,
  };
}

/**
 * Check if smart account is deployed on chain
 */
export async function isSmartAccountDeployed(
  publicClient: PublicClient,
  smartAccountAddress: `0x${string}`
): Promise<boolean> {
  const code = await publicClient.getCode({ address: smartAccountAddress });
  return code !== undefined && code !== '0x';
}

/**
 * Get user operation status
 */
export async function getUserOperationStatus(
  chainId: number,
  userOpHash: `0x${string}`
): Promise<'pending' | 'included' | 'failed'> {
  const pimlicoUrl = getPimlicoUrl(chainId);
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
  });

  try {
    const receipt = await pimlicoClient.getUserOperationReceipt({
      hash: userOpHash,
    });

    if (receipt) {
      return receipt.success ? 'included' : 'failed';
    }
    return 'pending';
  } catch {
    return 'pending';
  }
}
