import { NextRequest, NextResponse } from 'next/server';
import { getTrades, addTrade } from '@/lib/store/loans';
import type { Trade } from '@/lib/types/loan';
import { logger } from '@/lib/utils/logger';

function toDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

function normalizeTradeInput(input: unknown): Trade {
  const t = input as Partial<Trade> & Record<string, unknown>;
  const createdAt = toDate(t.createdAt) ?? new Date();
  const settledAt = toDate(t.settledAt);

  const normalizeParticipant = (p: unknown) => {
    const participant = p as Trade['seller'];
    return {
      ...participant,
      lockupEndDate: toDate((participant as unknown as Record<string, unknown>)?.lockupEndDate),
    };
  };

  return {
    ...(t as unknown as Trade),
    seller: normalizeParticipant(t.seller),
    buyer: normalizeParticipant(t.buyer),
    createdAt,
    settledAt,
  };
}

// GET /api/trades - Get trades (optionally filtered)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get('status');
    const allowedStatuses: Trade['status'][] = [
      'pending',
      'validating',
      'proposed',
      'approved',
      'executed',
      'settled',
      'rejected',
      'expired',
    ];
    const status = rawStatus && allowedStatuses.includes(rawStatus as Trade['status'])
      ? (rawStatus as Trade['status'])
      : null;

    if (rawStatus && !status) {
      return NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    logger.api.api('GET', '/api/trades', { status: status ?? undefined });

    const trades = await getTrades({ status: status ?? undefined });
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
    const rawBody = await request.json();
    const body = normalizeTradeInput(rawBody);

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

    const id = await addTrade(body);

    logger.api.info('Trade recorded', {
      id,
      units: body.units,
      status: body.status,
    });

    return NextResponse.json(
      { success: true, id },
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
