import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import type { Trade } from '@/lib/types/loan';
import { getParticipantByWallet, addTrade } from '@/lib/store/loans';
import { validateTransferServer } from '@/lib/services/trade-validation-server';

type ExecuteTradeRequest = {
  tokenAddress: string;
  seller: string;
  buyer: string;
  units: number;
  pricePerUnit: number;
};

// POST /api/trades/execute
// Mock-mode execution: validates using DB-backed balances, persists trade, and updates TokenBalance.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ExecuteTradeRequest>;

    const tokenAddress = body.tokenAddress;
    const seller = body.seller;
    const buyer = body.buyer;
    const units = body.units;
    const pricePerUnit = body.pricePerUnit;

    if (
      !tokenAddress ||
      !seller ||
      !buyer ||
      typeof units !== 'number' ||
      typeof pricePerUnit !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: tokenAddress, seller, buyer, units, pricePerUnit',
        },
        { status: 400 }
      );
    }

    const validation = await validateTransferServer({
      tokenAddress,
      seller,
      buyer,
      units,
    });

    if (!validation.canTransfer) {
      return NextResponse.json(
        { success: false, error: validation.reasonDescription, validation },
        { status: 409 }
      );
    }

    const [sellerParticipant, buyerParticipant] = await Promise.all([
      getParticipantByWallet(seller),
      getParticipantByWallet(buyer),
    ]);

    const now = new Date();
    const settlementTime = 2.5;

    const trade: Trade = {
      id: uuidv4(),
      loanId: 'mock-loan-id',
      tokenAddress,
      seller:
        sellerParticipant ??
        ({
          id: uuidv4(),
          name: 'Unknown Seller',
          type: 'fund',
          walletAddress: seller,
          kycStatus: 'approved',
          accreditedInvestor: true,
          jurisdiction: 'US',
        } as const),
      buyer:
        buyerParticipant ??
        ({
          id: uuidv4(),
          name: 'Unknown Buyer',
          type: 'fund',
          walletAddress: buyer,
          kycStatus: 'approved',
          accreditedInvestor: true,
          jurisdiction: 'US',
        } as const),
      units,
      pricePerUnit,
      totalValue: units * pricePerUnit,
      status: 'settled',
      validation,
      createdAt: new Date(now.getTime() - settlementTime * 1000),
      settledAt: now,
      txHash: '0x' + uuidv4().replace(/-/g, ''),
      settlementTime,
    };

    const id = await addTrade(trade);

    return NextResponse.json({ success: true, trade: { ...trade, id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
