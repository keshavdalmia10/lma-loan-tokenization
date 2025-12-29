'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { CHAIN_CONFIG } from '@/lib/wagmi/config';
import { Wallet, ChevronDown, LogOut, AlertCircle, Check } from 'lucide-react';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className = '' }: WalletButtonProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [showConnectors, setShowConnectors] = useState(false);
  const [showChainSelect, setShowChainSelect] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const currentChain = CHAIN_CONFIG[chainId];

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get connector icon/name mapping
  const getConnectorDisplay = (connectorName: string) => {
    const displays: Record<string, { name: string; color: string }> = {
      'MetaMask': { name: 'MetaMask', color: 'text-orange-500' },
      'WalletConnect': { name: 'WalletConnect', color: 'text-blue-500' },
      'Coinbase Wallet': { name: 'Coinbase', color: 'text-blue-600' },
      'Injected': { name: 'Browser Wallet', color: 'text-gray-500' },
    };
    return displays[connectorName] || { name: connectorName, color: 'text-gray-500' };
  };

  if (isConnecting || isPending) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg ${className}`}
      >
        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowConnectors(!showConnectors)}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${className}`}
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showConnectors ? 'rotate-180' : ''}`} />
        </button>

        {showConnectors && (
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 px-2">Select a wallet</p>
            </div>
            <div className="p-2">
              {connectors.map((connector) => {
                const display = getConnectorDisplay(connector.name);
                return (
                  <button
                    key={connector.uid}
                    onClick={() => {
                      connect({ connector });
                      setShowConnectors(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Wallet className={`h-5 w-5 ${display.color}`} />
                    <span className="text-white">{display.name}</span>
                  </button>
                );
              })}
            </div>
            {error && (
              <div className="p-2 border-t border-gray-700">
                <p className="text-xs text-red-400 px-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Chain selector */}
      <div className="relative">
        <button
          onClick={() => {
            setShowChainSelect(!showChainSelect);
            setShowAccountMenu(false);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <span className={`h-2 w-2 rounded-full ${currentChain?.isTestnet ? 'bg-yellow-500' : 'bg-green-500'}`} />
          <span className="text-sm">{currentChain?.name || 'Unknown'}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${showChainSelect ? 'rotate-180' : ''}`} />
        </button>

        {showChainSelect && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 px-2">Select network</p>
            </div>
            <div className="p-2">
              {Object.entries(CHAIN_CONFIG).map(([id, config]) => (
                <button
                  key={id}
                  onClick={() => {
                    switchChain({ chainId: Number(id) });
                    setShowChainSelect(false);
                  }}
                  disabled={isSwitching}
                  className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors ${
                    Number(id) === chainId ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${config.isTestnet ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <span className="text-white text-sm">{config.name}</span>
                  </div>
                  {Number(id) === chainId && <Check className="h-4 w-4 text-green-500" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account menu */}
      <div className="relative">
        <button
          onClick={() => {
            setShowAccountMenu(!showAccountMenu);
            setShowChainSelect(false);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
          <span className="text-sm font-mono">{truncateAddress(address!)}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
        </button>

        {showAccountMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Connected wallet</p>
              <p className="text-sm font-mono text-white break-all">{address}</p>
            </div>
            <div className="p-2">
              {currentChain?.explorer && (
                <a
                  href={`${currentChain.explorer}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400 text-sm"
                >
                  View on Explorer
                </a>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address!);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 text-sm"
              >
                Copy Address
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setShowAccountMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 text-sm"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Minimal wallet button for inline use
 */
export function WalletButtonMinimal({ className = '' }: WalletButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className={`text-blue-400 hover:text-blue-300 text-sm ${className}`}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-mono text-gray-400">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <button
        onClick={() => disconnect()}
        className="text-red-400 hover:text-red-300 text-xs"
      >
        Disconnect
      </button>
    </div>
  );
}

export default WalletButton;
