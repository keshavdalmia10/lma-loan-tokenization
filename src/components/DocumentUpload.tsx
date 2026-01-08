'use client';

import { useState } from 'react';
import { Upload, FileText, Zap, CheckCircle, Building2, DollarSign, Calendar, Percent, Shield, Users, Leaf, ChevronRight } from 'lucide-react';
import { parseDocument, createDigitalCreditInstrument, calculateDocumentHash } from '@/lib/services/nel-protocol';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DigitalCreditInstrument } from '@/lib/types/loan';

interface DocumentUploadProps {
  onSuccess?: (nelId: string) => void;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsedInstrument, setParsedInstrument] = useState<DigitalCreditInstrument | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFile(e.target.files[0]);
    }
  };

  const resetUpload = () => {
    setParsedInstrument(null);
    setFilename('');
    setConfidence(0);
    setError(null);
    setProgress(0);
  };

  const processFile = async (file: File) => {
    setError(null);
    setParsedInstrument(null);
    setIsProcessing(true);
    setProgress(0);
    setFilename(file.name);

    try {
      // Validate file
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        throw new Error('Only PDF and Word documents are supported');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Step 1: Calculate hash
      setProgress(10);
      const buffer = await file.arrayBuffer();
      const documentHash = await calculateDocumentHash(buffer);

      // Step 2: Parse document with AI
      setProgress(30);
      const { terms, covenants, lenders, esg, confidence: parseConfidence } = await parseDocument(file);

      console.log(`Document parsed with ${Math.round(parseConfidence * 100)}% confidence`);
      setConfidence(parseConfidence);
      setProgress(60);

      // Step 3: Create Digital Credit Instrument
      setProgress(80);
      const instrument = createDigitalCreditInstrument(
        terms,
        covenants,
        lenders,
        `doc-${Date.now()}`,
        documentHash,
        esg
      );

      // Step 4: Store in database via API
      const saveResponse = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instrument),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save loan');
      }
      setProgress(100);

      // Success - store the full instrument
      setParsedInstrument(instrument);

      // Notify parent
      setTimeout(() => {
        onSuccess?.(instrument.nelId);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show parsed loan details
  if (parsedInstrument) {
    const { terms, covenants, lenders, esg } = parsedInstrument;

    return (
      <div className="space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Document Successfully Processed</h3>
                <p className="text-sm text-green-700">{filename}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600">AI Confidence</p>
                <p className="text-lg font-bold text-green-700">{Math.round(confidence * 100)}%</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-xs text-green-600 font-mono">NEL ID: {parsedInstrument.nelId}</p>
            </div>
          </div>
        </Card>

        {/* Loan Terms */}
        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-blue-600" />
              Loan Terms
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Borrower</p>
                <p className="font-medium text-gray-900">{terms.borrowerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Facility Amount</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {formatCurrency(terms.facilityAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Maturity Date</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  {formatDate(terms.maturityDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Interest Rate</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Percent className="h-4 w-4 text-purple-600" />
                  {terms.interestType === 'floating'
                    ? `${terms.referenceRate} + ${terms.spread}bps`
                    : `${(terms.interestRateBps / 100).toFixed(2)}%`
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Facility Type</p>
                <p className="font-medium text-gray-900 capitalize">{terms.facilityType.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Security</p>
                <p className="font-medium text-gray-900 capitalize flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  {terms.securityType} / {terms.seniorityRank}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Covenants */}
        {covenants.length > 0 && (
          <Card>
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-orange-600" />
                Covenants ({covenants.length})
              </h4>
              <div className="space-y-3">
                {covenants.map((covenant, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{covenant.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{covenant.type} covenant</p>
                    </div>
                    <div className="text-right">
                      {covenant.threshold && (
                        <p className="font-medium text-gray-900">
                          {typeof covenant.threshold === 'number' && covenant.threshold > 1000
                            ? formatCurrency(covenant.threshold)
                            : covenant.threshold
                          }
                        </p>
                      )}
                      <p className="text-xs text-gray-500 capitalize">{covenant.testingFrequency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Lenders */}
        {lenders.length > 0 && (
          <Card>
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-indigo-600" />
                Lender Syndicate ({lenders.length})
              </h4>
              <div className="space-y-3">
                {lenders.map((lender, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {lender.lenderName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lender.lenderName}</p>
                        {lender.isLeadArranger && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Lead Arranger</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(lender.commitment)}</p>
                      <p className="text-xs text-gray-500">{lender.percentage}% share</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ESG Data */}
        {esg?.hasESGLinking && (
          <Card className="border-green-200">
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Leaf className="h-5 w-5 text-green-600" />
                ESG-Linked Features
              </h4>
              {esg.sustainabilityCoordinator && (
                <p className="text-sm text-gray-600 mb-3">
                  Sustainability Coordinator: <span className="font-medium">{esg.sustainabilityCoordinator}</span>
                </p>
              )}
              {esg.marginAdjustment && (
                <p className="text-sm text-gray-600 mb-3">
                  Margin Adjustment: <span className="font-medium text-green-600">{esg.marginAdjustment > 0 ? '+' : ''}{esg.marginAdjustment}bps</span>
                </p>
              )}
              {esg.kpis && esg.kpis.length > 0 && (
                <div className="space-y-2">
                  {esg.kpis.map((kpi, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{kpi.metric}</span>
                      <span className="text-sm font-medium text-green-700">Target: {kpi.target}{kpi.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={resetUpload} className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Upload Another Document
          </Button>
          <Button
            onClick={() => onSuccess?.(parsedInstrument.nelId)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            View in Dashboard
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Upload UI
  return (
    <div className="space-y-4">
      <Card className={`border-2 border-dashed transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${error ? 'border-red-300 bg-red-50' : ''}`}>
        <div
          className="p-12 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!isProcessing && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Loan Agreement</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Drag and drop your PDF or Word document here, or click to select
                </p>
              </div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                type="button"
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-400">PDF or Word document up to 10MB</p>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <Zap className="h-12 w-12 text-blue-500 mx-auto animate-pulse" />
              <div>
                <h3 className="font-semibold text-gray-900">Processing {filename}...</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {progress < 30 && 'Calculating document hash...'}
                  {progress >= 30 && progress < 60 && 'Extracting loan data with Claude AI...'}
                  {progress >= 60 && progress < 80 && 'Creating Digital Credit Instrument...'}
                  {progress >= 80 && 'Saving to database...'}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{progress}%</p>
            </div>
          )}

          {error && !isProcessing && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setIsProcessing(false);
                }}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
