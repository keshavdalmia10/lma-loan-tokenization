/**
 * Structured Logger for LMA Loan Tokenization
 *
 * Provides consistent, color-coded logging across frontend and backend.
 * Logs include timestamps, service names, and structured data.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

// ANSI color codes for terminal (backend)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Service-specific colors
const serviceColors: Record<string, string> = {
  'blockchain': colors.cyan,
  'smart-account': colors.magenta,
  'privy': colors.green,
  'pimlico': colors.yellow,
  'nel-protocol': colors.blue,
  'api': colors.bright,
  'ui': colors.gray,
};

function getTimestamp(): string {
  return new Date().toISOString().split('T')[1].slice(0, 12);
}

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return '';
  return ' ' + JSON.stringify(context);
}

function isServer(): boolean {
  return typeof window === 'undefined';
}

class Logger {
  private service: string;
  private color: string;

  constructor(service: string) {
    this.service = service;
    this.color = serviceColors[service] || colors.reset;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = getTimestamp();
    const prefix = `[${this.service.toUpperCase()}]`;

    if (isServer()) {
      // Server-side: Use ANSI colors
      const levelColors: Record<LogLevel, string> = {
        debug: colors.gray,
        info: colors.green,
        warn: colors.yellow,
        error: colors.red,
      };
      const levelColor = levelColors[level];
      const contextStr = formatContext(context);

      console.log(
        `${colors.dim}${timestamp}${colors.reset} ${this.color}${prefix}${colors.reset} ${levelColor}${level.toUpperCase()}${colors.reset} ${message}${colors.dim}${contextStr}${colors.reset}`
      );
    } else {
      // Client-side: Use CSS colors
      const levelStyles: Record<LogLevel, string> = {
        debug: 'color: gray',
        info: 'color: green',
        warn: 'color: orange',
        error: 'color: red; font-weight: bold',
      };

      const contextStr = context ? context : '';
      console.log(
        `%c${timestamp} %c${prefix} %c${level.toUpperCase()} %c${message}`,
        'color: gray',
        'color: #0ea5e9; font-weight: bold',
        levelStyles[level],
        'color: inherit',
        contextStr
      );
    }
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  // Convenience methods for common operations
  tx(action: string, hash?: string, context?: LogContext) {
    this.info(`TX: ${action}`, { txHash: hash, ...context });
  }

  api(method: string, path: string, context?: LogContext) {
    this.info(`${method} ${path}`, context);
  }

  timing(action: string, durationMs: number, context?: LogContext) {
    this.info(`${action} completed`, { duration: `${durationMs}ms`, ...context });
  }
}

// Pre-configured loggers for each service
export const logger = {
  blockchain: new Logger('blockchain'),
  smartAccount: new Logger('smart-account'),
  privy: new Logger('privy'),
  pimlico: new Logger('pimlico'),
  nel: new Logger('nel-protocol'),
  api: new Logger('api'),
  ui: new Logger('ui'),
};

// Create custom logger for any service
export function createLogger(service: string): Logger {
  return new Logger(service);
}

export default logger;
