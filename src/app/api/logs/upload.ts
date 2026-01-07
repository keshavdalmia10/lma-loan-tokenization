/**
 * API Route: POST /api/logs/upload
 *
 * Receives batches of frontend logs from client-side and stores them in the database.
 * Implements rate limiting and validation to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';

// Simple rate limiting: max 1000 logs per hour per IP
const ipLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = ipLimits.get(ip);

  if (!limit) {
    ipLimits.set(ip, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }

  if (now > limit.resetTime) {
    ipLimits.set(ip, { count: 1, resetTime: now + 3600000 });
    return true;
  }

  if (limit.count >= 1000) {
    return false;
  }

  limit.count++;
  return true;
}

interface ClientLogEntry {
  timestamp: string;
  service: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
}

interface RequestBody {
  logs: ClientLogEntry[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      logger.api.api('POST', '/api/logs/upload', { status: 429, reason: 'rate_limit' });
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = (await request.json()) as RequestBody;

    if (!Array.isArray(body.logs)) {
      return NextResponse.json(
        { error: 'Invalid request: logs must be an array' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent huge payloads
    const logs = body.logs.slice(0, 100);

    if (logs.length === 0) {
      return NextResponse.json(
        { success: true, stored: 0 }
      );
    }

    // Validate and sanitize log entries
    const validLogs = logs.filter((log) => {
      return (
        typeof log.timestamp === 'string' &&
        typeof log.service === 'string' &&
        typeof log.level === 'string' &&
        typeof log.message === 'string' &&
        log.level.match(/^(debug|info|warn|error)$/)
      );
    });

    if (validLogs.length === 0) {
      return NextResponse.json(
        { error: 'No valid logs in request' },
        { status: 400 }
      );
    }

    // Store in database
    const created = await prisma.clientLog.createMany({
      data: validLogs.map((log) => ({
        timestamp: new Date(log.timestamp),
        service: log.service.substring(0, 50),
        level: log.level,
        message: log.message.substring(0, 1000),
        context: log.context || undefined,
        synced: true,
      })),
      skipDuplicates: false,
    });

    logger.api.api('POST', '/api/logs/upload', {
      status: 200,
      logsReceived: logs.length,
      logsStored: created.count,
    });

    return NextResponse.json({
      success: true,
      stored: created.count,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.api.error('Failed to process logs upload', {
      error: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      { error: 'Failed to process logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logs/upload - Retrieve recent logs (admin only)
 *
 * Query params:
 *   - limit: number (default: 100, max: 1000)
 *   - service: string (filter by service)
 *   - level: string (filter by level)
 *   - minutes: number (get logs from last N minutes, default: 60)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '100', 10),
      1000
    );
    const service = url.searchParams.get('service');
    const level = url.searchParams.get('level');
    const minutes = parseInt(url.searchParams.get('minutes') || '60', 10);

    // Build filter
    const where: Record<string, unknown> = {
      timestamp: {
        gte: new Date(Date.now() - minutes * 60 * 1000),
      },
    };

    if (service) {
      where.service = { contains: service };
    }

    if (level && level.match(/^(debug|info|warn|error)$/)) {
      where.level = level;
    }

    // Retrieve logs
    const logs = await prisma.clientLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    logger.api.api('GET', '/api/logs/upload', {
      status: 200,
      logsRetrieved: logs.length,
      filters: { service, level, minutes },
    });

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.api.error('Failed to retrieve logs', {
      error: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    );
  }
}
