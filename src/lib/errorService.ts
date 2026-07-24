export interface AppError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
}

type ErrorHandler = (error: AppError) => void;

const handlers: ErrorHandler[] = [];
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
    if (import.meta.env.DEV) console.warn(`[ErrorService] ${code}: ${message}`, context);
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

  getLog(): readonly AppError[] {
    return errorLog;
  },

  clearLog(): void {
    errorLog.length = 0;
  },
};
