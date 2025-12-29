// API Route: Parse Loan Document with Claude AI
// POST /api/parse-document

import { NextRequest, NextResponse } from 'next/server';
import { parseDocumentWithClaude, getMockParseResult } from '@/lib/services/claude-parser';

// pdf-parse is a CommonJS module, so we need to handle the import carefully
// For now, we'll extract text on the client side and send it to the API

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentText, fileName, useMock } = body;

    console.log(`[API] Parsing document: ${fileName}`);
    console.log(`[API] Text length: ${documentText?.length || 0} characters`);

    // Use mock if no API key or if explicitly requested
    if (useMock || !process.env.ANTHROPIC_API_KEY) {
      console.log('[API] Using mock parser (no API key or mock requested)');
      const mockResult = getMockParseResult();
      return NextResponse.json({
        success: true,
        source: 'mock',
        ...mockResult
      });
    }

    // Validate document text
    if (!documentText || documentText.length < 50) {
      console.log('[API] Document text too short, using mock');
      const mockResult = getMockParseResult();
      return NextResponse.json({
        success: true,
        source: 'mock',
        message: 'Document text too short for analysis',
        ...mockResult
      });
    }

    // Parse with Claude
    console.log('[API] Calling Claude API...');
    const result = await parseDocumentWithClaude(documentText);

    return NextResponse.json({
      success: true,
      source: 'claude',
      ...result
    });

  } catch (error) {
    console.error('[API] Error parsing document:', error);
    
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
