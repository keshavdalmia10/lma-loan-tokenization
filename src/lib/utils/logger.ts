/**
 * Structured Logger for LMA Loan Tokenization
 *
 * Provides consistent, color-coded logging across frontend and backend.
 * Logs include timestamps, service names, and structured data.
 * 
 * Backend logs are persisted to files with automatic rotation.
 * Frontend logs are stored in IndexedDB for retrieval and analysis.
 */

import * as fs from 'fs';
import * as path from 'path';

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

function getFullTimestamp(): string {
  return new Date().toISOString();
}

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return '';
  return ' ' + JSON.stringify(context);
}

function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * File logging utilities for backend
 */
class FileLogger {
  private logDir: string;
  private maxSize: number; // in bytes
  private logFile: string;
  private currentSize: number = 0;
  private initialized: boolean = false;

  constructor() {
    this.logDir = process.env.LOG_DIR || './logs';
    this.maxSize = this.parseSize(process.env.LOG_MAX_SIZE || '10mb');
    this.logFile = path.join(this.logDir, 'app.log');
    
    if (isServer()) {
      this.initialize();
    }
  }

  private initialize() {
    if (this.initialized) return;
    
    try {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }

      // Get current log file size
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        this.currentSize = stats.size;
      }

      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize file logger:', err);
    }
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB

    const value = parseInt(match[1], 10);
    const unit = match[2] || 'b';
    return value * (units[unit] || 1);
  }

  private rotate() {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFile = path.join(
        this.logDir,
        `app-${timestamp}-${Date.now()}.log`
      );
      fs.renameSync(this.logFile, backupFile);
      this.currentSize = 0;

      // Clean up old log files (keep last 10)
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'))
        .sort()
        .reverse();

      if (files.length > 10) {
        files.slice(10).forEach(f => {
          try {
            fs.unlinkSync(path.join(this.logDir, f));
          } catch (err) {
            // Ignore cleanup errors
          }
        });
      }
    } catch (err) {
      console.error('Failed to rotate log file:', err);
    }
  }

  write(message: string) {
    if (!isServer() || !this.initialized) return;

    try {
      const logEntry = `${getFullTimestamp()} ${message}\n`;
      const entrySize = Buffer.byteLength(logEntry, 'utf8');

      // Rotate if needed
      if (this.currentSize + entrySize > this.maxSize) {
        this.rotate();
      }

      // Append to log file
      fs.appendFileSync(this.logFile, logEntry, { encoding: 'utf8' });
      this.currentSize += entrySize;
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
}

const fileLogger = new FileLogger();

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

      const formattedMessage = `${colors.dim}${timestamp}${colors.reset} ${this.color}${prefix}${colors.reset} ${levelColor}${level.toUpperCase()}${colors.reset} ${message}${colors.dim}${contextStr}${colors.reset}`;
      
      console.log(formattedMessage);

      // Write to file (plain text without ANSI codes)
      const plainMessage = `${timestamp} ${prefix} ${level.toUpperCase()} ${message}${formatContext(context)}`;
      fileLogger.write(plainMessage);
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

      // Store in IndexedDB for client-side persistence
      if (typeof window !== 'undefined') {
        try {
          const logEntry = {
            timestamp: getFullTimestamp(),
            service: this.service,
            level,
            message,
            context,
          };
          // Store will be implemented in client-logger utility
          sessionStorage.setItem(
            `log_${Date.now()}_${Math.random()}`,
            JSON.stringify(logEntry)
          );
        } catch (err) {
          // Ignore storage errors
        }
      }
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
