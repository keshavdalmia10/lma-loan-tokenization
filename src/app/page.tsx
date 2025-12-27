'use client';

import { useState } from 'react';
import { Link } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('dashboard');

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
