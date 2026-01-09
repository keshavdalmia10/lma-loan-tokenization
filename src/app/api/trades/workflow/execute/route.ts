import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { getTradeById, settleApprovedTrade } from '@/lib/store/loans';
import { validateTransferServer } from '@/lib/services/trade-validation-server';
import { assertRole, requireDemoActor } from '@/lib/services/trade-workflow-auth';
import { appendWorkflowEvent } from '@/lib/services/trade-workflow';

type ExecuteWorkflowTradeRequest = {
  tradeId: string;
};

// POST /api/trades/workflow/execute
// Agent executes an approved trade (revalidates + settles + mutates balances).
export async function POST(req: Request) {
  try {
    const actor = requireDemoActor(req);
    assertRole(actor, 'agent');

    const body = (await req.json()) as Partial<ExecuteWorkflowTradeRequest>;
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

    if (trade.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: `Trade not in approved state (status=${trade.status})` },
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
      to: 'settled',
      actor: { role: actor.role, wallet: actor.wallet },
    });

    const settled = await settleApprovedTrade({
      id: trade.id,
      workflow,
      validation,
      txHash: '0x' + uuidv4().replace(/-/g, ''),
      settlementTime: 2.5,
    });

    return NextResponse.json({ success: true, trade: settled });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
