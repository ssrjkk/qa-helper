/**
 * Centralized error reporting service with pub/sub pattern
 * Supports external monitoring integration (Sentry-ready)
 * @module errorService
 * @author ssrjkk
 */

export interface AppError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
}

type ErrorHandler = (error: AppError) => void;
type ExternalReporter = (error: AppError) => void;

const handlers: ErrorHandler[] = [];
const externalReporters: ExternalReporter[] = [];
const errorLog: AppError[] = [];
const MAX_LOG_SIZE = 100;

function notify(error: AppError): void {
  for (const handler of handlers) {
    try {
      handler(error);
    } catch {
      // Handler failed — never cascade
    }
  }
}

function reportExternal(error: AppError): void {
  for (const reporter of externalReporters) {
    try {
      reporter(error);
    } catch {
      // External reporter failed — never cascade
    }
  }
}

export const ErrorService = {
  report(code: string, message: string, context?: Record<string, unknown>, recoverable = true): AppError {
    const error: AppError = {
      code,
      message,
      context,
      timestamp: Date.now(),
      recoverable,
    };
    errorLog.push(error);
    if (errorLog.length > MAX_LOG_SIZE) errorLog.shift();
    notify(error);
    reportExternal(error);
    if (import.meta.env.DEV) console.warn(`[ErrorService] ${code}: ${message}`);
    return error;
  },

  reportAsync(code: string, err: unknown, context?: Record<string, unknown>, recoverable = true): AppError {
    const message = err instanceof Error ? err.message : String(err);
    return this.report(code, message, context, recoverable);
  },

  subscribe(handler: ErrorHandler): () => void {
    handlers.push(handler);
    return () => {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    };
  },

  registerExternalReporter(reporter: ExternalReporter): () => void {
    externalReporters.push(reporter);
    return () => {
      const idx = externalReporters.indexOf(reporter);
      if (idx >= 0) externalReporters.splice(idx, 1);
    };
  },

  getLog(): readonly AppError[] {
    return errorLog;
  },

  getLogByCode(code: string): AppError[] {
    return errorLog.filter(e => e.code === code);
  },

  getRecentErrors(ms: number): AppError[] {
    const cutoff = Date.now() - ms;
    return errorLog.filter(e => e.timestamp >= cutoff);
  },

  clearLog(): void {
    errorLog.length = 0;
  },

  exportLog(): string {
    return JSON.stringify(errorLog, null, 2);
  },
};
