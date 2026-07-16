import type { ZipParseResult } from '../../workers/zipParser.worker';

interface PendingRequest {
  resolve: (result: ZipParseResult) => void;
  reject: (error: Error) => void;
}

export class ZipParserWorker {
  private worker: Worker | null = null;
  private pendingRequests: Map<number, PendingRequest> = new Map();
  private requestId = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    this.worker = new Worker(
      new URL('../../workers/zipParser.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event: MessageEvent<{
      requestId: number;
      success: boolean;
      result?: ZipParseResult;
      error?: string;
    }>) => {
      const { requestId, success, result, error } = event.data;
      const pending = this.pendingRequests.get(requestId);

      if (pending) {
        this.pendingRequests.delete(requestId);
        if (success && result) {
          pending.resolve(result);
        } else {
          pending.reject(new Error(error || 'Worker failed'));
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('[ZipParserWorker] Fatal error:', error);
      this.terminate();
    };
  }

  async parse(data: ArrayBuffer, filename: string): Promise<ZipParseResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const requestId = ++this.requestId;

    return new Promise<ZipParseResult>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.worker!.postMessage({ requestId, data, filename }, [data]);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
    }
  }
}

export const zipParser = new ZipParserWorker();
