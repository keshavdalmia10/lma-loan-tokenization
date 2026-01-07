import { NextRequest, NextResponse } from 'next/server';
import { getTrades, addTrade } from '@/lib/store/loans';
import type { Trade } from '@/lib/types/loan';
import { logger } from '@/lib/utils/logger';

// GET /api/trades - Get all trades
export async function GET() {
  try {
    logger.api.api('GET', '/api/trades');
    const trades = await getTrades();
    logger.api.debug('Trades fetched', { count: trades.length });
    return NextResponse.json(trades);
  } catch (error) {
    logger.api.error('Failed to fetch trades', { error: String(error) });
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

    logger.api.api('POST', '/api/trades', {
      tokenAddress: body.tokenAddress?.slice(0, 10) + '...',
      units: body.units,
      totalValue: body.totalValue,
    });

    // Validate required fields
    if (!body.tokenAddress || !body.seller || !body.buyer || !body.units) {
      logger.api.warn('Missing required fields in trade creation');
      return NextResponse.json(
        { error: 'Missing required fields: tokenAddress, seller, buyer, units' },
        { status: 400 }
      );
    }

    await addTrade(body);

    logger.api.info('Trade recorded', {
      id: body.id,
      units: body.units,
      status: body.status,
    });

    return NextResponse.json(
      { success: true, id: body.id },
      { status: 201 }
    );
  } catch (error) {
    logger.api.error('Failed to create trade', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
