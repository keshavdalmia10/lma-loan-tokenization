// API Route: Parse Loan Document with Claude AI
// POST /api/parse-document

import { NextRequest, NextResponse } from 'next/server';
import { parseDocumentWithClaude, getMockParseResult } from '@/lib/services/claude-parser';
import { logger } from '@/lib/utils/logger';

// pdf-parse is a CommonJS module, so we need to handle the import carefully
// For now, we'll extract text on the client side and send it to the API

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { documentText, fileName, useMock } = body;

    logger.api.api('POST', '/api/parse-document', { fileName, textLength: documentText?.length || 0 });

    // Use mock if no API key or if explicitly requested
    if (useMock || !process.env.ANTHROPIC_API_KEY) {
      logger.api.info('Using mock parser', { reason: useMock ? 'requested' : 'no API key' });
      const mockResult = getMockParseResult();
      return NextResponse.json({
        success: true,
        source: 'mock',
        ...mockResult
      });
    }

    // Validate document text
    if (!documentText || documentText.length < 50) {
      logger.api.warn('Document text too short', { length: documentText?.length || 0 });
      const mockResult = getMockParseResult();
      return NextResponse.json({
        success: true,
        source: 'mock',
        message: 'Document text too short for analysis',
        ...mockResult
      });
    }

    // Parse with Claude
    logger.api.info('Calling Claude API for document parsing');
    const result = await parseDocumentWithClaude(documentText);

    logger.api.timing('Document parsed', Date.now() - startTime, { source: 'claude' });

    return NextResponse.json({
      success: true,
      source: 'claude',
      ...result
    });

  } catch (error) {
    logger.api.error('Document parsing failed', { error: String(error) });

    // Fall back to mock on error
    const mockResult = getMockParseResult();
    return NextResponse.json({
      success: true,
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error',
      ...mockResult
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Document parsing API. Use POST with { documentText, fileName } to parse.',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY
  });
}
