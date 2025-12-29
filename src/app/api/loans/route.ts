import { NextRequest, NextResponse } from 'next/server';
import { getAllLoans, addLoan, getPortfolioSummary } from '@/lib/store/loans';
import type { DigitalCreditInstrument } from '@/lib/types/loan';

// GET /api/loans - Get all loans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary');

    if (summary === 'true') {
      const portfolioSummary = await getPortfolioSummary();
      return NextResponse.json(portfolioSummary);
    }

    const loans = await getAllLoans();
    return NextResponse.json(loans);
  } catch (error) {
    console.error('[API] Error fetching loans:', error);
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

    // Validate required fields
    if (!body.nelId || !body.terms?.borrowerName) {
      return NextResponse.json(
        { error: 'Missing required fields: nelId and terms.borrowerName' },
        { status: 400 }
      );
    }

    await addLoan(body);

    return NextResponse.json(
      { success: true, nelId: body.nelId },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating loan:', error);
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}
