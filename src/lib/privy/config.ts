import type { PrivyClientConfig } from '@privy-io/react-auth';
import { baseSepolia, base } from 'viem/chains';

/**
 * Privy configuration for "Invisible Crypto" UX
 * - Social login only (no external wallets)
 * - Embedded wallets auto-created for new users
 * - No signature prompts (noPromptOnSignature)
 */
export const privyConfig: PrivyClientConfig = {
  // Appearance - make it look like Web2
  appearance: {
    theme: 'light',
    accentColor: '#2563eb', // Matches app's blue-600
    logo: '/logo.png',
    showWalletLoginFirst: false,
    // Hide wallet options - users shouldn't see Web3 complexity
    walletList: [],
  },

  // Login methods - Web2 only, no external wallets
  loginMethods: ['email', 'google', 'apple'],

  // Embedded wallet configuration (new API structure)
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    showWalletUIs: false, // Hide wallet UIs for invisible crypto
  },

  // Default chain for embedded wallet
  defaultChain: baseSepolia,

  // Supported chains
  supportedChains: [baseSepolia, base],

  // Legal/compliance
  legal: {
    termsAndConditionsUrl: '/terms',
    privacyPolicyUrl: '/privacy',
  },
};

/**
 * Chain configuration for the app
 */
export const SUPPORTED_CHAINS = {
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    isTestnet: true,
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    isTestnet: false,
  },
} as const;

/**
 * Get the current chain based on environment
 */
export function getCurrentChain() {
  const chainName = process.env.NEXT_PUBLIC_CHAIN || 'baseSepolia';
  return SUPPORTED_CHAINS[chainName as keyof typeof SUPPORTED_CHAINS] || SUPPORTED_CHAINS.baseSepolia;
}
