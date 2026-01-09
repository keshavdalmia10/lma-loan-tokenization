import { NextResponse } from 'next/server';

import { getTradeById, updateTradeWorkflowAndStatus } from '@/lib/store/loans';
import { assertRole, requireDemoActor } from '@/lib/services/trade-workflow-auth';
import { appendWorkflowEvent } from '@/lib/services/trade-workflow';

type RejectTradeRequest = {
  tradeId: string;
  reason?: string;
};

// POST /api/trades/workflow/reject
// Checker rejects a proposed trade.
export async function POST(req: Request) {
  try {
    const actor = requireDemoActor(req);
    assertRole(actor, 'checker');

    const body = (await req.json()) as Partial<RejectTradeRequest>;
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

    const workflow = appendWorkflowEvent({
      workflow: trade.workflow,
      from: trade.status,
      to: 'rejected',
      actor: { role: actor.role, wallet: actor.wallet },
      reason: body.reason,
    });

    await updateTradeWorkflowAndStatus({
      id: trade.id,
      status: 'rejected',
      workflow,
    });

    const updated = await getTradeById(trade.id);
    return NextResponse.json({ success: true, trade: updated ?? trade });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
