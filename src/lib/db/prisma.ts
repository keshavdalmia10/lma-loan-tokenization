import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit due to hot reloading.
// See: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Build connection URL with serverless-optimized settings
  let datasourceUrl = process.env.DATABASE_URL;

  // Add connection pool settings for serverless if not already present
  if (datasourceUrl && !datasourceUrl.includes('connection_limit')) {
    const separator = datasourceUrl.includes('?') ? '&' : '?';
    datasourceUrl = `${datasourceUrl}${separator}connection_limit=1&pool_timeout=20&connect_timeout=10`;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper to ensure connection is ready (useful for serverless cold starts)
export async function ensureConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('[Prisma] Connection check failed, attempting reconnect:', error);
    await prisma.$disconnect();
    await prisma.$connect();
  }
}

export default prisma;
