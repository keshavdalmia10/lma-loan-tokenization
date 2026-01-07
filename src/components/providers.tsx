'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { useState, type ReactNode } from 'react';
import { wagmiConfig } from '@/lib/wagmi/config';
import { privyConfig } from '@/lib/privy/config';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Application providers for "Invisible Crypto" UX
 *
 * Provider hierarchy:
 * 1. PrivyProvider - Handles authentication and embedded wallet creation
 * 2. QueryClientProvider - React Query for data fetching
 * 3. WagmiProvider - Ethereum interactions (configured without external wallets)
 *
 * Users sign in with email/social and get an MPC-sharded embedded wallet automatically.
 * No MetaMask, no seed phrases, no wallet popups.
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Privy app ID from environment
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // If no Privy app ID, render without Privy (for mock mode or development)
  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider appId={privyAppId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
