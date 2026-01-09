import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import type { Trade } from '@/lib/types/loan';
import { addTrade, getParticipantByWallet, getTradeById } from '@/lib/store/loans';
import { validateTransferServer } from '@/lib/services/trade-validation-server';
import { assertRole, requireDemoActor } from '@/lib/services/trade-workflow-auth';
import { appendWorkflowEvent } from '@/lib/services/trade-workflow';

type ProposeTradeRequest = {
  tokenAddress: string;
  seller: string;
  buyer: string;
  units: number;
  pricePerUnit: number;
};

// POST /api/trades/workflow/propose
// Trader proposes a trade after validation. Does NOT move balances.
export async function POST(req: Request) {
  try {
    const actor = requireDemoActor(req);
    assertRole(actor, 'trader');

    const body = (await req.json()) as Partial<ProposeTradeRequest>;

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
      status: 'proposed',
      validation,
      workflow: appendWorkflowEvent({
        workflow: undefined,
        from: 'none',
        to: 'proposed',
        actor: { role: actor.role, wallet: actor.wallet },
      }),
      createdAt: new Date(),
    };

    const id = await addTrade(trade);
    const created = await getTradeById(id);

    return NextResponse.json({ success: true, trade: created ?? { ...trade, id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
