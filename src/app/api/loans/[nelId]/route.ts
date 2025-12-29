import { NextRequest, NextResponse } from 'next/server';
import { getLoan, updateLoan } from '@/lib/store/loans';
import type { DigitalCreditInstrument } from '@/lib/types/loan';

// GET /api/loans/[nelId] - Get a single loan by NEL ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nelId: string }> }
) {
  try {
    const { nelId } = await params;
    const loan = await getLoan(nelId);

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error('[API] Error fetching loan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan' },
      { status: 500 }
    );
  }
}

// PATCH /api/loans/[nelId] - Update a loan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ nelId: string }> }
) {
  try {
    const { nelId } = await params;
    const body = await request.json() as Partial<DigitalCreditInstrument>;

    // Check if loan exists
    const existing = await getLoan(nelId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    await updateLoan(nelId, body);

    // Return updated loan
    const updated = await getLoan(nelId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API] Error updating loan:', error);
    return NextResponse.json(
      { error: 'Failed to update loan' },
      { status: 500 }
    );
  }
}
