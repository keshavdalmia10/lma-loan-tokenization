'use client';

import { useState } from 'react';
import { Link } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import TransferSimulator from '@/components/TransferSimulator';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/AuthButton';
import { useBlockchainService } from '@/hooks/useBlockchainService';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'transfer'>('dashboard');
  const { mode } = useBlockchainService();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LMA Loan Tokenization</h1>
                <p className="text-sm text-gray-500">Digitize • Tokenize • Trade • Settle in Seconds</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Navigation Tabs */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveTab('dashboard')}
                  variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => setActiveTab('upload')}
                  variant={activeTab === 'upload' ? 'default' : 'outline'}
                >
                  Upload Loan
                </Button>
                <Button
                  onClick={() => setActiveTab('transfer')}
                  variant={activeTab === 'transfer' ? 'default' : 'outline'}
                >
                  Transfer Demo
                </Button>
              </div>
              {/* Mode Indicator */}
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  mode === 'mock'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {mode === 'mock' ? 'Demo' : 'Live'}
              </span>
              {/* Auth Button */}
              <AuthButton showSmartAccountAddress />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Portfolio Overview</h2>
              <p className="text-gray-600 mt-2">
                Track digitized loans and their settlement performance
              </p>
            </div>
            <PortfolioDashboard />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Upload Loan Agreement</h2>
              <p className="text-gray-600 mt-2">
                Submit PDF or Word documents for AI-powered extraction and NEL Protocol digitization
              </p>
            </div>
            <DocumentUpload onSuccess={() => setActiveTab('dashboard')} />
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Transfer Simulator</h2>
              <p className="text-gray-600 mt-2">
                Test ERC-3643 compliant token transfers with on-chain compliance validation
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Info Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Demo Token: LT-ACME</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Token Address</span>
                    <span className="font-mono text-gray-900">0xDEMO...TOKEN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Units</span>
                    <span className="font-semibold text-gray-900">100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unit Value</span>
                    <span className="font-semibold text-gray-900">$2.5M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Facility</span>
                    <span className="font-semibold text-gray-900">$250M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Standard</span>
                    <span className="font-semibold text-blue-600">ERC-3643</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Compliance Requirements</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> KYC Verification
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Accredited Investor Status
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Jurisdiction Check (US)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Balance Verification
                    </li>
                  </ul>
                </div>
              </div>

              {/* Transfer Simulator */}
              <TransferSimulator
                tokenAddress="0xDEMO_TOKEN_ADDRESS_FOR_TESTING"
                tokenSymbol="LT-ACME"
                unitValue={2_500_000}
              />
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> This demo simulates an ERC-3643 compliant token transfer
                between two verified participants. The transfer validates identity claims (KYC, accreditation)
                before executing, ensuring regulatory compliance. Settlement happens in seconds vs. 27+ days
                with traditional loan trading.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900">LMA Hackathon 2025</h3>
              <p className="text-sm text-gray-600 mt-2">
                Enabling STP and reducing settlement times through blockchain tokenization
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Tech Stack</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Next.js 14 + TypeScript</li>
                <li>• Solidity ERC-3643 Smart Contracts</li>
                <li>• Nammu21 NEL Protocol</li>
                <li>• Polygon Blockchain</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Features</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>✓ AI-powered document parsing</li>
                <li>✓ NEL Protocol digitization</li>
                <li>✓ ERC-3643 tokenization</li>
                <li>✓ T+0 settlement simulation</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-600 text-center">
            <p>Hackathon MVP • December 2025 • Solving LMA Settlement Delays & STP Gaps</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
