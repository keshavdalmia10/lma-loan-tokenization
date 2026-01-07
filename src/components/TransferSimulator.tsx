'use client';

import { useState } from 'react';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { useSmartAccount } from '@/hooks/useSmartAccount';
import type { Trade, TransferValidation } from '@/lib/types/loan';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TransferSimulatorProps {
  tokenAddress: string;
  tokenSymbol: string;
  unitValue: number;
}

export default function TransferSimulator({
  tokenAddress,
  tokenSymbol,
  unitValue,
}: TransferSimulatorProps) {
  const [units, setUnits] = useState(5);
  const [price, setPrice] = useState(unitValue);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    trade?: Trade;
    validation?: TransferValidation;
    error?: string;
  } | null>(null);

  // Use blockchain service hook for mock/real mode switching
  const { service, mode, isReady, isLoading: serviceLoading } = useBlockchainService();
  const { smartAccountAddress } = useSmartAccount();

  const handleSimulate = async () => {
    if (!service) {
      setSimulationResult({ error: 'Blockchain service not ready' });
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);

    try {
      // In real mode, use the smart account address; in mock mode, use mock addresses
      const sellerAddress = mode === 'real' && smartAccountAddress
        ? smartAccountAddress
        : '0x1234567890abcdef1234567890abcdef12345678';
      const buyerAddress = '0xabcdef0123456789abcdef0123456789abcdef01';

      const trade = await service.executeTransfer(
        tokenAddress,
        sellerAddress,
        buyerAddress,
        units,
        price
      );

      setSimulationResult({ trade });
    } catch (error) {
      setSimulationResult({
        error: error instanceof Error ? error.message : 'Transfer failed',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const totalValue = units * price;
  const result = simulationResult;

  return (
    <div className="space-y-4">
      {/* Input Section */}
      {!result && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Simulate Transfer</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units to Transfer
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={units}
                  onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={isSimulating}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-sm text-gray-600 py-2">
                  ({(units * unitValue / 1_000_000).toFixed(2)}M)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit (USD)
              </label>
              <input
                type="number"
                step="100000"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || unitValue)}
                disabled={isSimulating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Total Value</span>
                <span className="font-semibold text-gray-900">
                  ${(totalValue / 1_000_000).toFixed(2)}M
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-700">Settlement Time (Expected)</span>
                <span className="font-semibold text-green-600">~2.5 seconds (T+0)</span>
              </div>
            </div>

            <Button
              onClick={handleSimulate}
              disabled={isSimulating || !isReady || serviceLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {serviceLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up account...
                </>
              ) : isSimulating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'real' ? 'Submitting transaction...' : 'Executing Transfer...'}
                </>
              ) : (
                'Execute Transfer'
              )}
            </Button>
            {mode === 'real' && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Gas fees are sponsored. No wallet popup required.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <Card className={`p-6 ${result.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex gap-4 mb-6">
            {result.error ? (
              <X className="h-8 w-8 text-red-600 flex-shrink-0" />
            ) : (
              <Check className="h-8 w-8 text-green-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                result.error ? 'text-red-900' : 'text-green-900'
              }`}>
                {result.error ? 'Transfer Failed' : 'Transfer Successful'}
              </h3>
              {result.error && (
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
              )}
            </div>
          </div>

          {result.trade && (
            <div className="space-y-4">
              {/* Trade Details */}
              <div className="grid grid-cols-2 gap-4 bg-white rounded p-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">From</p>
                  <p className="font-mono text-sm text-gray-900 mt-1">
                    {result.trade.seller.name.split(' ')[0]}...
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">To</p>
                  <p className="font-mono text-sm text-gray-900 mt-1">
                    {result.trade.buyer.name.split(' ')[0]}...
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Units</p>
                  <p className="font-semibold text-gray-900 mt-1">{result.trade.units}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Value</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    ${(result.trade.totalValue / 1_000_000).toFixed(2)}M
                  </p>
                </div>
              </div>

              {/* Compliance Checks */}
              <div className="bg-white rounded p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Compliance Validation
                </h4>
                <div className="space-y-2">
                  {result.trade.validation?.checks.map((check, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{check.name}</span>
                      {check.passed ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement Info */}
              <div className="bg-white rounded p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Settlement Time</p>
                    <p className="font-semibold text-green-600 text-lg mt-1">
                      {result.trade.settlementTime?.toFixed(1)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-semibold text-green-600 mt-1">
                      {result.trade.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 font-mono">
                  TxHash: {result.trade.txHash?.slice(0, 20)}...
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              setSimulationResult(null);
              setUnits(5);
              setPrice(unitValue);
            }}
            className="w-full mt-4"
            variant="outline"
          >
            New Transfer
          </Button>
        </Card>
      )}
    </div>
  );
}
