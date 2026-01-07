/**
 * Client-side Logger with IndexedDB Persistence
 *
 * Stores browser console logs in IndexedDB for retrieval and analysis.
 * Automatically syncs logs to backend API for centralized logging.
 * Implements size management and automatic cleanup.
 */

export interface ClientLogEntry {
  id?: number;
  timestamp: string;
  service: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  synced?: boolean;
}

const DB_NAME = 'lma_logs';
const DB_VERSION = 1;
const STORE_NAME = 'logs';
const MAX_LOGS = 10000; // Maximum logs to store before cleanup
const SYNC_INTERVAL = 30000; // Sync every 30 seconds (configurable via env)
const MAX_BATCH_SIZE = 100; // Send logs in batches

class ClientLogger {
  private db: IDBDatabase | null = null;
  private syncIntervalId: number | null = null;
  private logBuffer: ClientLogEntry[] = [];
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Only enable if explicitly configured
      const enabled = process.env.NEXT_PUBLIC_CLIENT_LOGGING_ENABLED === 'true';
      if (!enabled) {
        return;
      }

      // Initialize IndexedDB
      await this.initializeDB();

      // Start periodic sync
      const syncInterval = parseInt(
        process.env.NEXT_PUBLIC_CLIENT_LOG_SYNC_INTERVAL || '30000',
        10
      );
      this.startSync(syncInterval);

      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize client logger:', err);
    }
  }

  private initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('synced', 'synced', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Add a log entry to the database
   */
  async addLog(entry: Omit<ClientLogEntry, 'id'>): Promise<void> {
    if (!this.initialized || !this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Add synced flag
      const logEntry: ClientLogEntry = {
        ...entry,
        synced: false,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(logEntry);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      // Cleanup old logs if exceeding max size
      await this.cleanupOldLogs();
    } catch (err) {
      console.error('Failed to add log entry:', err);
    }
  }

  /**
   * Get unsynced logs
   */
  private async getUnsyncedLogs(limit: number = MAX_BATCH_SIZE): Promise<ClientLogEntry[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('synced');

        const range = IDBKeyRange.only(false);
        const request = index.getAll(range, limit);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          resolve((request.result as ClientLogEntry[]) || []);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Mark logs as synced
   */
  private async markLogsSynced(ids: (number | undefined)[]): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const id of ids) {
        if (id !== undefined) {
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const entry = getRequest.result;
            if (entry) {
              entry.synced = true;
              store.put(entry);
            }
          };
        }
      }

      await new Promise<void>((resolve, reject) => {
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
      });
    } catch (err) {
      console.error('Failed to mark logs as synced:', err);
    }
  }

  /**
   * Remove old logs when database exceeds max size
   */
  private async cleanupOldLogs(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const countRequest = store.count();
      await new Promise<void>((resolve) => {
        countRequest.onsuccess = () => {
          const count = countRequest.result;
          if (count > MAX_LOGS) {
            // Delete oldest logs (keep latest MAX_LOGS entries)
            const deleteTransaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const deleteStore = deleteTransaction.objectStore(STORE_NAME);
            const timeIndex = deleteStore.index('timestamp');

            const range = IDBKeyRange.upperBound(undefined);
            const getAllRequest = timeIndex.getAll(range);

            getAllRequest.onsuccess = () => {
              const allLogs = getAllRequest.result as ClientLogEntry[];
              const toDelete = allLogs.slice(0, count - MAX_LOGS);

              toDelete.forEach((log) => {
                if (log.id !== undefined) {
                  deleteStore.delete(log.id);
                }
              });
            };
          }
          resolve();
        };
      });
    } catch (err) {
      console.error('Failed to cleanup old logs:', err);
    }
  }

  /**
   * Sync unsynced logs to backend
   */
  private async syncLogsToBackend(): Promise<void> {
    if (!this.initialized || !this.db) {
      return;
    }

    try {
      const logs = await this.getUnsyncedLogs(MAX_BATCH_SIZE);

      if (logs.length === 0) {
        return;
      }

      const response = await fetch('/api/logs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (response.ok) {
        // Mark synced logs
        const logIds = logs.map((log) => log.id);
        await this.markLogsSynced(logIds);
      }
    } catch (err) {
      // Silently fail - logs will retry on next sync
      console.error('Failed to sync logs to backend:', err);
    }
  }

  /**
   * Start periodic sync
   */
  private startSync(interval: number): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = window.setInterval(() => {
      this.syncLogsToBackend();
    }, interval);

    // Also sync on page unload
    window.addEventListener('beforeunload', () => {
      this.syncLogsToBackend();
    });
  }

  /**
   * Stop periodic sync
   */
  stop(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Clear all logs from database
   */
  async clear(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  }
}

// Export singleton instance
export const clientLogger = new ClientLogger();

// Initialize on module load (if in browser)
if (typeof window !== 'undefined') {
  clientLogger.initialize().catch((err) => {
    console.error('Failed to initialize client logger:', err);
  });
}
