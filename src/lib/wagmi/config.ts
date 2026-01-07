import { http, createConfig } from 'wagmi';
import { hardhat, mainnet, polygon, sepolia, base, baseSepolia } from 'wagmi/chains';

// Custom localhost chain matching Hardhat configuration
const localhost = {
  ...hardhat,
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
} as const;

/**
 * Wagmi configuration for "Invisible Crypto" mode
 *
 * NOTE: External wallet connectors (MetaMask, WalletConnect, Coinbase) are removed.
 * Privy handles wallet creation and management via embedded MPC wallets.
 * Users never see wallet connection UI - they just sign in with email/social.
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia, base, localhost, mainnet, polygon, sepolia],
  // No connectors - Privy manages wallet connection internally
  connectors: [],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [localhost.id]: http('http://127.0.0.1:8545'),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

// Contract addresses per chain (populated after deployment)
export const DEPLOYED_CONTRACTS: Record<number, {
  loanTokenFactory: string;
  claimTopicsRegistry: string;
  trustedIssuersRegistry: string;
}> = {
  [baseSepolia.id]: {
    loanTokenFactory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_BASE_SEPOLIA || '',
    claimTopicsRegistry: process.env.NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY_BASE_SEPOLIA || '',
    trustedIssuersRegistry: process.env.NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY_BASE_SEPOLIA || '',
  },
  [localhost.id]: {
    loanTokenFactory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
    claimTopicsRegistry: process.env.NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY || '',
    trustedIssuersRegistry: process.env.NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY || '',
  },
  [sepolia.id]: {
    loanTokenFactory: '',
    claimTopicsRegistry: '',
    trustedIssuersRegistry: '',
  },
  [polygon.id]: {
    loanTokenFactory: '',
    claimTopicsRegistry: '',
    trustedIssuersRegistry: '',
  },
  [base.id]: {
    loanTokenFactory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_BASE || '',
    claimTopicsRegistry: process.env.NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY_BASE || '',
    trustedIssuersRegistry: process.env.NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY_BASE || '',
  },
};

// Get contracts for current chain
export function getContracts(chainId: number) {
  return DEPLOYED_CONTRACTS[chainId] || DEPLOYED_CONTRACTS[localhost.id];
}

// Chain configuration for display
export const CHAIN_CONFIG: Record<number, {
  name: string;
  explorer: string;
  isTestnet: boolean;
}> = {
  [localhost.id]: {
    name: 'Localhost (Hardhat)',
    explorer: '',
    isTestnet: true,
  },
  [sepolia.id]: {
    name: 'Sepolia Testnet',
    explorer: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  [polygon.id]: {
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
    isTestnet: false,
  },
  [base.id]: {
    name: 'Base',
    explorer: 'https://basescan.org',
    isTestnet: false,
  },
  [baseSepolia.id]: {
    name: 'Base Sepolia',
    explorer: 'https://sepolia.basescan.org',
    isTestnet: true,
  },
};

export { localhost };
