import { NextRequest, NextResponse } from 'next/server';
import { getTrades, addTrade } from '@/lib/store/loans';
import type { Trade } from '@/lib/types/loan';

// GET /api/trades - Get all trades
export async function GET() {
  try {
    const trades = await getTrades();
    return NextResponse.json(trades);
  } catch (error) {
    console.error('[API] Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST /api/trades - Record a new trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Trade;

    // Validate required fields
    if (!body.tokenAddress || !body.seller || !body.buyer || !body.units) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenAddress, seller, buyer, units' },
        { status: 400 }
      );
    }

    await addTrade(body);

    return NextResponse.json(
      { success: true, id: body.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
