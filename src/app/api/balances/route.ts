import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

// GET /api/balances?tokenAddress=0x...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenAddress = searchParams.get('tokenAddress');

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required query param: tokenAddress' },
        { status: 400 }
      );
    }

    const balances = await prisma.tokenBalance.findMany({
      where: { tokenAddress },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            jurisdiction: true,
            kycStatus: true,
            accreditedInvestor: true,
          },
        },
      },
      orderBy: [{ balance: 'desc' }],
    });

    return NextResponse.json(
      balances.map((b) => ({
        participant: b.participant,
        tokenAddress: b.tokenAddress,
        balance: b.balance,
        frozenAmount: b.frozenAmount,
        available: Math.max(0, b.balance - b.frozenAmount),
        updatedAt: b.updatedAt,
      }))
    );
  } catch (error) {
    console.error('[API] Error fetching balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}
