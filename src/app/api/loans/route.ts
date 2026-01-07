import { NextRequest, NextResponse } from 'next/server';
import { getAllLoans, addLoan, getPortfolioSummary } from '@/lib/store/loans';
import type { DigitalCreditInstrument } from '@/lib/types/loan';
import { logger } from '@/lib/utils/logger';

// GET /api/loans - Get all loans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary');

    logger.api.api('GET', '/api/loans', { summary: !!summary });

    if (summary === 'true') {
      const portfolioSummary = await getPortfolioSummary();
      logger.api.debug('Portfolio summary fetched', { totalLoans: portfolioSummary.totalLoans });
      return NextResponse.json(portfolioSummary);
    }

    const loans = await getAllLoans();
    logger.api.debug('Loans fetched', { count: loans.length });
    return NextResponse.json(loans);
  } catch (error) {
    logger.api.error('Failed to fetch loans', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

// POST /api/loans - Create a new loan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DigitalCreditInstrument;

    logger.api.api('POST', '/api/loans', { nelId: body.nelId, borrower: body.terms?.borrowerName });

    // Validate required fields
    if (!body.nelId || !body.terms?.borrowerName) {
      logger.api.warn('Missing required fields in loan creation');
      return NextResponse.json(
        { error: 'Missing required fields: nelId and terms.borrowerName' },
        { status: 400 }
      );
    }

    await addLoan(body);

    logger.api.info('Loan created', { nelId: body.nelId });

    return NextResponse.json(
      { success: true, nelId: body.nelId },
      { status: 201 }
    );
  } catch (error) {
    logger.api.error('Failed to create loan', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}
