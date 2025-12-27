'use client';

import { formatDistanceToNow } from '@/lib/dateUtils';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import type { DigitalCreditInstrument } from '@/lib/types/loan';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LoanCardProps {
  loan: DigitalCreditInstrument;
  onTokenize?: (nelId: string) => void;
  isTokenizing?: boolean;
}

export default function LoanCard({ loan, onTokenize, isTokenizing }: LoanCardProps) {
  const isTokenized = !!loan.tokenization && loan.tokenization.status !== 'pending';
  const interestRate = (loan.terms.interestRateBps / 100).toFixed(2);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {loan.terms.borrowerName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              NEL ID: <span className="font-mono text-xs">{loan.nelId}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {isTokenized && (
              <Badge className="bg-green-100 text-green-800">Tokenized</Badge>
            )}
            <Badge variant={loan.terms.securityType === 'secured' ? 'default' : 'secondary'}>
              {loan.terms.securityType === 'secured' ? 'Secured' : 'Unsecured'}
            </Badge>
          </div>
        </div>

        {/* Loan Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Facility Amount</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              ${(loan.terms.facilityAmount / 1_000_000).toFixed(0)}M
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Interest Rate</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {interestRate}%
              {loan.terms.spread && (
                <span className="text-sm font-normal text-gray-600 ml-1">
                  ({loan.terms.spread} bps spread)
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Maturity</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {loan.terms.maturityDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {loan.terms.facilityType.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Covenants Status */}
        <div className="mb-6 pb-6 border-t">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 mt-4">Covenants</h4>
          <div className="space-y-2">
            {loan.covenants.slice(0, 2).map((covenant) => (
              <div key={covenant.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{covenant.name}</span>
                <div className="flex items-center gap-2">
                  {covenant.currentValue !== undefined && covenant.threshold && (
                    <span className="text-gray-500">
                      {covenant.currentValue.toFixed(2)} / {covenant.threshold}
                    </span>
                  )}
                  {covenant.status === 'compliant' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {covenant.status === 'warning' && (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  {covenant.status === 'breach' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tokenization Status */}
        {isTokenized && loan.tokenization && (
          <div className="mb-6 pb-6 border-t pt-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">Tokenization</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Token</p>
                <p className="font-semibold text-gray-900">{loan.tokenization.tokenSymbol}</p>
              </div>
              <div>
                <p className="text-gray-500">Units</p>
                <p className="font-semibold text-gray-900">{loan.tokenization.totalUnits}</p>
              </div>
              <div>
                <p className="text-gray-500">Unit Value</p>
                <p className="font-semibold text-gray-900">
                  ${(loan.tokenization.unitValue / 1_000_000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-semibold text-green-600">{loan.tokenization.status}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Contract: <span className="font-mono">{loan.tokenization.tokenAddress?.slice(0, 10)}...</span>
            </p>
          </div>
        )}

        {/* ESG Badge */}
        {loan.esg && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
            <span>🌱</span>
            <span>ESG-linked with margin adjustment</span>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t">
          <span>Created {formatDistanceToNow(loan.createdAt, { addSuffix: true })}</span>
          {!isTokenized && onTokenize && (
            <button
              onClick={() => onTokenize(loan.nelId)}
              disabled={isTokenizing}
              className="text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
            >
              {isTokenizing ? 'Tokenizing...' : 'Tokenize'}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
