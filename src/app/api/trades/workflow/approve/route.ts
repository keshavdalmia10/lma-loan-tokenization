import { NextResponse } from 'next/server';

import { getTradeById, updateTradeWorkflowAndStatus } from '@/lib/store/loans';
import { validateTransferServer } from '@/lib/services/trade-validation-server';
import { assertRole, requireDemoActor } from '@/lib/services/trade-workflow-auth';
import { appendWorkflowEvent } from '@/lib/services/trade-workflow';

type ApproveTradeRequest = {
  tradeId: string;
};

// POST /api/trades/workflow/approve
// Checker approves a proposed trade (revalidates server-side).
export async function POST(req: Request) {
  try {
    const actor = requireDemoActor(req);
    assertRole(actor, 'checker');

    const body = (await req.json()) as Partial<ApproveTradeRequest>;
    const tradeId = body.tradeId;

    if (!tradeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: tradeId' },
        { status: 400 }
      );
    }

    const trade = await getTradeById(tradeId);
    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    if (trade.status !== 'proposed') {
      return NextResponse.json(
        { success: false, error: `Trade not in proposed state (status=${trade.status})` },
        { status: 409 }
      );
    }

    const seller = trade.seller.walletAddress;
    const buyer = trade.buyer.walletAddress;

    if (!seller || !buyer) {
      return NextResponse.json(
        { success: false, error: 'Trade is missing seller/buyer walletAddress' },
        { status: 400 }
      );
    }

    const validation = await validateTransferServer({
      tokenAddress: trade.tokenAddress,
      seller,
      buyer,
      units: trade.units,
    });

    if (!validation.canTransfer) {
      return NextResponse.json(
        { success: false, error: validation.reasonDescription, validation },
        { status: 409 }
      );
    }

    const workflow = appendWorkflowEvent({
      workflow: trade.workflow,
      from: trade.status,
      to: 'approved',
      actor: { role: actor.role, wallet: actor.wallet },
    });

    await updateTradeWorkflowAndStatus({
      id: trade.id,
      status: 'approved',
      workflow,
      validation,
    });

    const updated = await getTradeById(trade.id);
    return NextResponse.json({ success: true, trade: updated ?? trade });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
