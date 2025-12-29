import { http, createConfig } from 'wagmi';
import { hardhat, mainnet, polygon, sepolia, base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

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

// WalletConnect project ID (get from cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const wagmiConfig = createConfig({
  chains: [localhost, mainnet, polygon, sepolia, base, baseSepolia],
  connectors: [
    injected(), // MetaMask and other injected wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'LMA Loan Tokenization',
        description: 'Syndicated Loan Tokenization Platform',
        url: 'https://lma-loan-tokenization.vercel.app',
        icons: ['https://lma-loan-tokenization.vercel.app/icon.png'],
      },
    }),
    coinbaseWallet({
      appName: 'LMA Loan Tokenization',
    }),
  ],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

// Contract addresses per chain (populated after deployment)
export const DEPLOYED_CONTRACTS: Record<number, {
  loanTokenFactory: string;
  claimTopicsRegistry: string;
  trustedIssuersRegistry: string;
}> = {
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
    loanTokenFactory: '',
    claimTopicsRegistry: '',
    trustedIssuersRegistry: '',
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
