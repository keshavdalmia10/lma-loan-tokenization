'use client';

import { useState } from 'react';
import { Upload, FileText, Zap } from 'lucide-react';
import { parseDocument, createDigitalCreditInstrument, calculateDocumentHash } from '@/lib/services/nel-protocol';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DocumentUploadProps {
  onSuccess?: (nelId: string) => void;
}

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ filename: string; nelId: string } | null>(null);

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

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    setIsProcessing(true);
    setProgress(0);

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
      const { terms, covenants, lenders, esg, confidence } = await parseDocument(file);
      
      console.log(`Document parsed with ${Math.round(confidence * 100)}% confidence`);
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

      // Success!
      setSuccess({
        filename: file.name,
        nelId: instrument.nelId
      });

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

  return (
    <div className="space-y-4">
      <Card className={`border-2 border-dashed transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${error ? 'border-red-300 bg-red-50' : ''} ${success ? 'border-green-300 bg-green-50' : ''}`}>
        <div
          className="p-12 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!isProcessing && !success && (
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
              <Zap className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
              <div>
                <h3 className="font-semibold text-gray-900">Processing...</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Extracting loan data with AI and digitizing with NEL Protocol
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

          {success && (
            <div className="space-y-4">
              <FileText className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-gray-900">Document Processed!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>File:</strong> {success.filename}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>NEL ID:</strong> <span className="font-mono text-xs">{success.nelId}</span>
                </p>
              </div>
            </div>
          )}

          {error && (
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
