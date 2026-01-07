'use client';

/**
 * AuthGate Component
 *
 * Wraps protected content and requires authentication in real blockchain mode.
 * In mock mode, authentication is optional and content is always shown.
 *
 * Features:
 * - Shows loading state while Privy initializes
 * - Shows login prompt when not authenticated (real mode)
 * - Shows loading while smart account initializes (real mode)
 * - Passes through children when ready
 */

import { usePrivy } from '@privy-io/react-auth';
import { useSmartAccount } from '@/hooks/useSmartAccount';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { Loader2, LogIn, Wallet } from 'lucide-react';

interface AuthGateProps {
  // Content to show when authenticated
  children: React.ReactNode;
  // Custom fallback when not authenticated
  fallback?: React.ReactNode;
  // Whether to require auth even in mock mode
  requireAuthInMockMode?: boolean;
  // Custom loading component
  loadingComponent?: React.ReactNode;
}

export function AuthGate({
  children,
  fallback,
  requireAuthInMockMode = false,
  loadingComponent,
}: AuthGateProps) {
  const { ready: privyReady, authenticated, login } = usePrivy();
  const { isLoading: smartAccountLoading, isReady: smartAccountReady, error } = useSmartAccount();
  const { mode } = useBlockchainService();

  // In mock mode, skip auth check unless explicitly required
  if (mode === 'mock' && !requireAuthInMockMode) {
    return <>{children}</>;
  }

  // Privy still loading
  if (!privyReady) {
    return (
      loadingComponent || (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      )
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sign in to continue
            </h2>
            <p className="text-gray-600 max-w-sm">
              Access your loan tokenization dashboard by signing in with your email
              or social account.
            </p>
          </div>
          <button
            onClick={login}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <LogIn className="h-5 w-5" />
            Sign In
          </button>
          <p className="text-xs text-gray-400 max-w-xs text-center">
            No crypto wallet needed. Sign in with your email, Google, or Apple account.
          </p>
        </div>
      )
    );
  }

  // Smart account still loading (only in real mode)
  if (mode === 'real' && smartAccountLoading) {
    return (
      loadingComponent || (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="relative">
            <Wallet className="h-10 w-10 text-blue-500" />
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium">Setting up your account</p>
            <p className="text-sm text-gray-500 mt-1">
              Creating your secure smart account...
            </p>
          </div>
        </div>
      )
    );
  }

  // Smart account error
  if (mode === 'real' && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Account Setup Failed
          </h2>
          <p className="text-gray-600 max-w-sm mb-4">
            {error.message || 'Unable to set up your smart account. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Smart account not ready yet (shouldn't happen often)
  if (mode === 'real' && !smartAccountReady) {
    return (
      loadingComponent || (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-gray-600">Preparing account...</p>
        </div>
      )
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}

/**
 * Simple loading spinner component
 */
export function AuthLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
    </div>
  );
}
