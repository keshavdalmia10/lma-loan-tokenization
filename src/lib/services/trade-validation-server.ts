import type { TransferValidation } from '@/lib/types/loan';
import { prisma } from '@/lib/db/prisma';
import { getBlockchainService } from '@/lib/services/blockchain-factory';

export async function validateTransferServer(input: {
  tokenAddress: string;
  seller: string;
  buyer: string;
  units: number;
}): Promise<TransferValidation> {
  const service = getBlockchainService();
  const base = await service.validateTransfer(
    input.tokenAddress,
    input.seller,
    input.buyer,
    input.units
  );

  // Override ONLY the balance check using DB (TokenBalance) so the server report
  // matches the portfolio/dashboard balances.
  const sellerBalance = await prisma.tokenBalance.findFirst({
    where: {
      tokenAddress: input.tokenAddress,
      participant: { walletAddress: input.seller },
    },
    select: { balance: true, frozenAmount: true },
  });

  const balance = sellerBalance?.balance ?? 0;
  const frozenAmount = sellerBalance?.frozenAmount ?? 0;
  const available = balance - frozenAmount;
  const hasBalance = available >= input.units;

  const checks = base.checks.map((c) =>
    c.name === 'Available Balance Check'
      ? {
          name: c.name,
          passed: hasBalance,
          details: hasBalance
            ? `Available: ${available} units (${balance} total, ${frozenAmount} frozen)`
            : `Insufficient: ${available} available < ${input.units} requested`,
        }
      : c
  );

  const canTransfer = checks.every((c) => c.passed);
  if (canTransfer) {
    return {
      ...base,
      canTransfer: true,
      reasonCode: '0x51',
      reasonDescription: 'Transfer approved',
      checks,
    };
  }

  // If the first failing check is balance, align reason with balance failure.
  const firstFailed = checks.find((c) => !c.passed);
  if (firstFailed?.name === 'Available Balance Check') {
    return {
      ...base,
      canTransfer: false,
      reasonCode: '0x52',
      reasonDescription: 'Insufficient available balance',
      checks,
    };
  }

  return {
    ...base,
    canTransfer: false,
    checks,
  };
}
