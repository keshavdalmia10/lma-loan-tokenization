// Claude AI Document Parsing Service
// Extracts loan terms from PDF documents using Claude 3.5 Sonnet

import Anthropic from '@anthropic-ai/sdk';
import type { LoanTerms, Covenant, LenderPosition, ESGData } from '../types/loan';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extraction prompt for Claude
const EXTRACTION_PROMPT = `You are an expert at analyzing syndicated loan agreements. Extract the following information from this loan document and return it as valid JSON.

Required fields:
1. borrowerName: The name of the borrowing entity
2. facilityAmount: Total facility amount in USD (number only, no currency symbols)
3. interestRateBps: Interest rate in basis points (e.g., 5% = 500)
4. interestType: "fixed" or "floating"
5. spread: Spread over reference rate in basis points (if floating)
6. referenceRate: The reference rate (e.g., "SOFR", "EURIBOR", "LIBOR")
7. maturityDate: Maturity date in ISO format (YYYY-MM-DD)
8. currency: Currency code (e.g., "USD", "EUR", "GBP")
9. facilityType: One of "term_loan", "revolver", "delayed_draw", "bridge"
10. securityType: "secured" or "unsecured"
11. seniorityRank: "senior", "subordinated", or "mezzanine"

Also extract:
- covenants: Array of financial covenants with name, type, threshold, and testing frequency
- lenders: Array of lenders with name, commitment amount, and percentage
- esg: ESG-linked features if present (boolean hasESGLinking, KPIs, margin adjustment)

Return ONLY valid JSON in this exact structure:
{
  "terms": { ... },
  "covenants": [ ... ],
  "lenders": [ ... ],
  "esg": { ... } or null,
  "confidence": 0.0 to 1.0 (your confidence in the extraction accuracy),
  "explanations": {
    "terms": {
      "borrowerName": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "facilityAmount": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "interestRateBps": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "interestType": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "spread": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "referenceRate": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "maturityDate": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "currency": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "facilityType": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "securityType": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] },
      "seniorityRank": { "confidence": 0.0 to 1.0, "evidence": [{"quote": "...", "rationale": "..."}] }
    }
  }
}

Rules for explanations:
- Evidence quotes must be verbatim substrings from the provided document text.
- Keep each quote short (ideally <= 200 chars) and include just enough context.
- If unsure or not found, set confidence low and provide evidence as an empty array.

If a field cannot be determined from the document, use reasonable defaults or null.`;

export type EvidenceSnippet = {
  quote: string;
  rationale?: string;
};

export type FieldExplanation = {
  confidence: number;
  evidence: EvidenceSnippet[];
};

export type ExplainableExtraction = {
  terms?: Record<string, FieldExplanation>;
};

export interface DocumentParseResult {
  terms: LoanTerms;
  covenants: Covenant[];
  lenders: LenderPosition[];
  esg?: ESGData;
  confidence: number;
  explanations?: ExplainableExtraction;
  rawClaudeResponse?: string;
}

// Map Claude's covenant type responses to valid Prisma enum values
function normalizeCovenantType(type: string): 'financial' | 'affirmative' | 'negative' | 'reporting' {
  const normalized = (type || '').toLowerCase();

  // Map common variations to valid enum values
  if (['financial', 'maximum', 'minimum', 'ratio', 'leverage', 'coverage', 'liquidity'].some(t => normalized.includes(t))) {
    return 'financial';
  }
  if (['negative', 'restriction', 'prohibition', 'lien', 'debt'].some(t => normalized.includes(t))) {
    return 'negative';
  }
  if (['affirmative', 'positive', 'maintenance', 'insurance', 'compliance'].some(t => normalized.includes(t))) {
    return 'affirmative';
  }
  if (['reporting', 'disclosure', 'notice', 'financial statements'].some(t => normalized.includes(t))) {
    return 'reporting';
  }

  // Default to financial for unknown types
  return 'financial';
}

/**
 * Parse a loan document using Claude AI
 * @param documentText The extracted text from the PDF
 * @returns Parsed loan terms, covenants, lenders, and ESG data
 */
export async function parseDocumentWithClaude(documentText: string): Promise<DocumentParseResult> {
  try {
    console.log('[Claude] Sending document for analysis...');
    console.log('[Claude] Document length:', documentText.length, 'characters');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\n--- DOCUMENT START ---\n${documentText}\n--- DOCUMENT END ---`
        }
      ]
    });

    // Extract the text response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    console.log('[Claude] Response received, parsing JSON...');

    // Parse the JSON response
    // Claude sometimes wraps JSON in markdown code blocks
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Transform to our types
    const result: DocumentParseResult = {
      terms: {
        borrowerName: parsed.terms?.borrowerName || 'Unknown Borrower',
        facilityAmount: Number(parsed.terms?.facilityAmount) || 100_000_000,
        interestRateBps: Number(parsed.terms?.interestRateBps) || 500,
        interestType: parsed.terms?.interestType || 'floating',
        spread: Number(parsed.terms?.spread) || 200,
        referenceRate: parsed.terms?.referenceRate || 'SOFR',
        maturityDate: new Date(parsed.terms?.maturityDate || Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        currency: parsed.terms?.currency || 'USD',
        facilityType: parsed.terms?.facilityType || 'term_loan',
        securityType: parsed.terms?.securityType || 'secured',
        seniorityRank: parsed.terms?.seniorityRank || 'senior'
      },
      covenants: (parsed.covenants || []).map((c: Record<string, unknown>, i: number) => ({
        id: `cov-${i}`,
        type: normalizeCovenantType((c.type as string) || ''),
        name: (c.name as string) || `Covenant ${i + 1}`,
        description: (c.description as string) || '',
        threshold: Number(c.threshold) || undefined,
        testingFrequency: (c.testingFrequency as string) || 'quarterly',
        currentValue: Number(c.currentValue) || undefined,
        status: 'pending' as const
      })),
      lenders: (parsed.lenders || []).map((l: Record<string, unknown>, i: number) => ({
        lenderId: `lender-${i}`,
        lenderName: (l.name as string) || (l.lenderName as string) || `Lender ${i + 1}`,
        commitment: Number(l.commitment) || Number(l.commitmentAmount) || 0,
        fundedAmount: Number(l.fundedAmount) || Number(l.commitment) || 0,
        unfundedAmount: Number(l.unfundedAmount) || 0,
        percentage: Number(l.percentage) || 0,
        isLeadArranger: Boolean(l.isLeadArranger) || i === 0
      })),
      esg: parsed.esg ? {
        hasESGLinking: Boolean(parsed.esg.hasESGLinking),
        sustainabilityCoordinator: parsed.esg.sustainabilityCoordinator,
        kpis: (parsed.esg.kpis || []).map((k: Record<string, unknown>, i: number) => ({
          id: `kpi-${i}`,
          metric: (k.metric as string) || '',
          target: Number(k.target) || 0,
          current: Number(k.current) || undefined,
          unit: (k.unit as string) || '',
          status: 'pending' as const
        })),
        marginAdjustment: Number(parsed.esg.marginAdjustment) || undefined
      } : undefined,
      confidence: Number(parsed.confidence) || 0.8,
      explanations: parsed.explanations as ExplainableExtraction | undefined,
      rawClaudeResponse: responseText
    };

    console.log('[Claude] Successfully parsed loan terms for:', result.terms.borrowerName);
    console.log('[Claude] Confidence:', (result.confidence * 100).toFixed(1) + '%');

    return result;

  } catch (error) {
    console.error('[Claude] Error parsing document:', error);
    throw error;
  }
}

/**
 * Fallback mock parser for when Claude API fails or is unavailable
 */
export function getMockParseResult(): DocumentParseResult {
  const borrowerNames = [
    'Acme Industrial Holdings Ltd.',
    'Global Manufacturing Corp.',
    'European Tech Solutions GmbH',
    'Atlantic Energy Partners LLC',
    'Nordic Infrastructure Group AS'
  ];

  return {
    terms: {
      borrowerName: borrowerNames[Math.floor(Math.random() * borrowerNames.length)],
      facilityAmount: Math.floor(Math.random() * 400 + 100) * 1_000_000,
      interestRateBps: Math.floor(Math.random() * 300 + 200),
      interestType: Math.random() > 0.3 ? 'floating' : 'fixed',
      spread: Math.floor(Math.random() * 200 + 150),
      referenceRate: 'SOFR',
      maturityDate: new Date(Date.now() + (Math.floor(Math.random() * 4 + 2) * 365 * 24 * 60 * 60 * 1000)),
      currency: 'USD',
      facilityType: 'term_loan',
      securityType: Math.random() > 0.3 ? 'secured' : 'unsecured',
      seniorityRank: 'senior'
    },
    covenants: [
      {
        id: 'cov-1',
        type: 'financial',
        name: 'Maximum Leverage Ratio',
        description: 'Total Debt / EBITDA shall not exceed threshold',
        threshold: 4.5,
        testingFrequency: 'quarterly',
        currentValue: 3.2,
        status: 'compliant'
      },
      {
        id: 'cov-2',
        type: 'financial',
        name: 'Minimum Interest Coverage',
        description: 'EBITDA / Interest Expense shall not be less than threshold',
        threshold: 2.0,
        testingFrequency: 'quarterly',
        currentValue: 2.8,
        status: 'compliant'
      }
    ],
    lenders: [
      { lenderId: 'l1', lenderName: 'JP Morgan Chase', commitment: 62_500_000, fundedAmount: 62_500_000, unfundedAmount: 0, percentage: 25, isLeadArranger: true },
      { lenderId: 'l2', lenderName: 'Bank of America', commitment: 50_000_000, fundedAmount: 50_000_000, unfundedAmount: 0, percentage: 20, isLeadArranger: false },
      { lenderId: 'l3', lenderName: 'Barclays', commitment: 50_000_000, fundedAmount: 50_000_000, unfundedAmount: 0, percentage: 20, isLeadArranger: false }
    ],
    confidence: 0.95,
    explanations: {
      terms: {
        borrowerName: {
          confidence: 0.6,
          evidence: [
            {
              quote: 'Borrower: (mock data)',
              rationale: 'Fallback parser - not extracted from real document text.',
            },
          ],
        },
        facilityAmount: {
          confidence: 0.6,
          evidence: [
            {
              quote: 'Facility Amount: (mock data)',
              rationale: 'Fallback parser - not extracted from real document text.',
            },
          ],
        },
      },
    },
  };
}
