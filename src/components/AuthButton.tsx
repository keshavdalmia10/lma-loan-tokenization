'use client';

/**
 * AuthButton Component
 *
 * Replaces the traditional "Connect Wallet" button with a Web2-style "Sign In" experience.
 *
 * Features:
 * - Shows "Sign In" when logged out (triggers Privy modal)
 * - Shows user email/name when logged in
 * - Dropdown with account info and sign out option
 * - Optionally shows smart account address for developers
 *
 * The user never sees wallet addresses or Web3 complexity.
 */

import { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartAccount } from '@/hooks/useSmartAccount';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { User, LogOut, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';

interface AuthButtonProps {
  // Show smart account address in dropdown (for developers)
  showSmartAccountAddress?: boolean;
  // Compact mode (smaller button)
  compact?: boolean;
}

export function AuthButton({
  showSmartAccountAddress = false,
  compact = false,
}: AuthButtonProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { smartAccountAddress, isLoading: smartAccountLoading } = useSmartAccount();
  const { mode } = useBlockchainService();

  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Copy smart account address to clipboard
  const copyAddress = () => {
    if (smartAccountAddress) {
      navigator.clipboard.writeText(smartAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Not ready - show loading
  if (!ready) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        } bg-gray-100 rounded-lg text-gray-400`}
      >
        <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        {!compact && <span>Loading...</span>}
      </button>
    );
  }

  // Not authenticated - show sign in button
  if (!authenticated) {
    return (
      <button
        onClick={login}
        className={`flex items-center gap-2 ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        } bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors`}
      >
        <User className="h-4 w-4" />
        Sign In
      </button>
    );
  }

  // Get display name from user
  const displayName =
    user?.email?.address ||
    user?.google?.email ||
    user?.apple?.email ||
    'User';

  const initials = displayName
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        } bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors`}
      >
        {/* Avatar */}
        <div
          className={`${
            compact ? 'h-5 w-5 text-xs' : 'h-6 w-6 text-xs'
          } rounded-full bg-blue-500 flex items-center justify-center`}
        >
          <span className="text-white font-semibold">{initials}</span>
        </div>

        {/* Name (hide in compact mode) */}
        {!compact && (
          <span className="text-sm text-gray-700 max-w-[120px] truncate">
            {displayName.split('@')[0]}
          </span>
        )}

        {/* Loading indicator for smart account */}
        {smartAccountLoading && mode === 'real' && (
          <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}

        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            showMenu ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-semibold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{displayName}</p>
              </div>
            </div>

            {/* Mode Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  mode === 'mock'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {mode === 'mock' ? 'Demo Mode' : 'Live Mode'}
              </span>
              {mode === 'real' && smartAccountAddress && (
                <span className="text-xs text-gray-400">Base Sepolia</span>
              )}
            </div>
          </div>

          {/* Smart Account Info (optional, for developers) */}
          {showSmartAccountAddress && mode === 'real' && smartAccountAddress && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Smart Account</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-gray-700 flex-1 truncate">
                  {smartAccountAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </button>
                <a
                  href={`https://sepolia.basescan.org/address/${smartAccountAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-200 rounded"
                  title="View on explorer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
