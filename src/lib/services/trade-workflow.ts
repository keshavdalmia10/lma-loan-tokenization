import type {
  TradeStatus,
  TradeWorkflow,
  TradeWorkflowActor,
  TradeWorkflowEvent,
} from '@/lib/types/loan';

export function ensureWorkflow(existing?: TradeWorkflow): TradeWorkflow {
  if (existing && existing.version === 1 && Array.isArray(existing.history)) return existing;
  return { version: 1, history: [] };
}

export function appendWorkflowEvent(params: {
  workflow?: TradeWorkflow;
  from: TradeWorkflowEvent['from'];
  to: TradeStatus;
  actor: TradeWorkflowActor;
  reason?: string;
}): TradeWorkflow {
  const workflow = ensureWorkflow(params.workflow);
  const event: TradeWorkflowEvent = {
    from: params.from,
    to: params.to,
    at: new Date().toISOString(),
    actor: params.actor,
    reason: params.reason,
  };

  const next: TradeWorkflow = {
    ...workflow,
    history: [...workflow.history, event],
  };

  if (params.to === 'proposed') next.proposedBy = params.actor;
  if (params.to === 'approved') next.approvedBy = params.actor;
  if (params.to === 'rejected') next.rejectedBy = params.actor;
  if (params.to === 'settled' || params.to === 'executed') next.executedBy = params.actor;

  return next;
}
