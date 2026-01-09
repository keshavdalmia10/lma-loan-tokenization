export type DemoTradeRole = 'trader' | 'checker' | 'agent';

export type DemoActor = {
  role: DemoTradeRole;
  wallet: string;
};

function isDemoRole(value: unknown): value is DemoTradeRole {
  return value === 'trader' || value === 'checker' || value === 'agent';
}

export function requireDemoActor(req: Request): DemoActor {
  const roleHeader = req.headers.get('x-demo-role');
  const walletHeader = req.headers.get('x-demo-wallet');

  if (!isDemoRole(roleHeader)) {
    throw new Error('Missing or invalid x-demo-role (expected trader|checker|agent)');
  }

  if (!walletHeader || walletHeader.trim().length < 6) {
    throw new Error('Missing x-demo-wallet');
  }

  return { role: roleHeader, wallet: walletHeader.trim() };
}

export function assertRole(actor: DemoActor, required: DemoTradeRole) {
  if (actor.role !== required) {
    throw new Error(`Forbidden: requires role ${required}`);
  }
}
