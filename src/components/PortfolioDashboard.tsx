'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { getPortfolioSummary } from '@/lib/store/loans';
import { Card } from '@/components/ui/card';

export default function PortfolioDashboard() {
  const summary = getPortfolioSummary();

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Loans</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalLoans}</p>
          <p className="text-xs text-gray-500 mt-2">Digital Credit Instruments</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Portfolio Value</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ${(summary.totalValue / 1_000_000_000).toFixed(1)}B
          </p>
          <p className="text-xs text-gray-500 mt-2">Total facility amounts</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Tokenized</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {summary.tokenizationRate.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ${(summary.tokenizedValue / 1_000_000_000).toFixed(2)}B on-chain
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Settlement Speed</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">
              {summary.avgSettlementTimeTokenized.toFixed(1)}s
            </p>
            <p className="text-xs text-gray-500">vs {summary.avgSettlementTime}d</p>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            99.7% faster
          </p>
        </Card>
      </div>

      {/* Recent Trades */}
      {summary.recentTrades.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Trading Activity
          </h3>

          <div className="space-y-3">
            {summary.recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {trade.seller.name.split(' ').slice(0, 2).join(' ')} → {trade.buyer.name.split(' ').slice(0, 2).join(' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {trade.units} units @ ${(trade.pricePerUnit / 1_000_000).toFixed(2)}M each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-gray-900">
                    ${(trade.totalValue / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center justify-end gap-1">
                    <span>✓</span>
                    {trade.settlementTime?.toFixed(1)}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Impact Comparison */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-4">Impact: Traditional vs. Tokenized</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-600 uppercase">Settlement Time</p>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-gray-600">Traditional</p>
                <p className="text-lg font-bold text-gray-900">{summary.avgSettlementTime} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tokenized</p>
                <p className="text-lg font-bold text-green-600">{summary.avgSettlementTimeTokenized.toFixed(2)}s</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600 uppercase">Operational Cost</p>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-gray-600">Traditional</p>
                <p className="text-lg font-bold text-gray-900">0.25-0.50%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tokenized</p>
                <p className="text-lg font-bold text-green-600">&lt;0.01%</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600 uppercase">Liquidity</p>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-gray-600">Traditional</p>
                <p className="text-lg font-bold text-gray-900">Weekly</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tokenized</p>
                <p className="text-lg font-bold text-green-600">24/7</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
