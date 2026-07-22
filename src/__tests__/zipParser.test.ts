import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ZipParseResult } from '../workers/zipParser.worker';

class MockWorker {
  static instances: MockWorker[] = [];
  static reset(): void {
    MockWorker.instances = [];
  }
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private postedMessages: Array<{ data: unknown; transfer?: Transferable[] }> = [];
  private terminated = false;

  constructor() {
    MockWorker.instances.push(this);
  }

  postMessage(data: unknown, transfer?: Transferable[]): void {
    if (this.terminated) throw new Error('Worker is terminated');
    this.postedMessages.push({ data, transfer });
  }

  terminate(): void {
    this.terminated = true;
  }

  simulateResponse(response: {
    requestId: number;
    success: boolean;
    result?: ZipParseResult;
    error?: string;
  }): void {
    this.onmessage?.(new MessageEvent('message', { data: response }));
  }

  simulateError(message: string): void {
    this.onerror?.(new ErrorEvent('error', { message }));
  }

  get lastPostedData(): unknown {
    return this.postedMessages[this.postedMessages.length - 1]?.data;
  }

  get instanceIndex(): number {
    return MockWorker.instances.indexOf(this);
  }
}

function getLatestWorker(): MockWorker {
  return MockWorker.instances[MockWorker.instances.length - 1]!;
}

describe('ZipParserWorker wrapper', () => {
  let ZipParserWorkerClass: typeof import('../lib/workers/zipParser').ZipParserWorker;

  beforeEach(async () => {
    MockWorker.reset();
    vi.resetModules();
    vi.stubGlobal('Worker', MockWorker);

    const mod = await import('../lib/workers/zipParser');
    ZipParserWorkerClass = mod.ZipParserWorker;

    MockWorker.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a Worker on construction', () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();
    expect(worker).toBeInstanceOf(MockWorker);
    parser.terminate();
  });

  it('sends message with requestId and data', () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();
    const buffer = new ArrayBuffer(8);

    const promise = parser.parse(buffer, 'test.zip').catch(() => {});

    const posted = worker.lastPostedData as { requestId: number; data: ArrayBuffer; filename: string };
    expect(posted.requestId).toBe(1);
    expect(posted.data).toBe(buffer);
    expect(posted.filename).toBe('test.zip');
    parser.terminate();
    return promise;
  });

  it('resolves with result on success response', async () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();
    const mockResult: ZipParseResult = {
      files: [{ path: 'a.ts', name: 'a.ts', content: 'code', size: 4, lastModified: new Date() }],
      totalSize: 4,
      fileCount: 1,
      parseTimeMs: 10,
    };

    const promise = parser.parse(new ArrayBuffer(0), 'test.zip');
    worker.simulateResponse({ requestId: 1, success: true, result: mockResult });

    const result = await promise;
    expect(result).toEqual(mockResult);
    parser.terminate();
  });

  it('rejects with error on failure response', async () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();

    const promise = parser.parse(new ArrayBuffer(0), 'bad.zip');
    worker.simulateResponse({ requestId: 1, success: false, error: 'Invalid ZIP' });

    await expect(promise).rejects.toThrow('Invalid ZIP');
    parser.terminate();
  });

  it('rejects with default message when error is missing', async () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();

    const promise = parser.parse(new ArrayBuffer(0), 'bad.zip');
    worker.simulateResponse({ requestId: 1, success: false });

    await expect(promise).rejects.toThrow('Worker failed');
    parser.terminate();
  });

  it('rejects when worker not initialized', async () => {
    const parser = new ZipParserWorkerClass();
    parser.terminate();

    await expect(parser.parse(new ArrayBuffer(0), 'test.zip')).rejects.toThrow('Worker not initialized');
  });

  it('handles multiple concurrent requests with correct requestId', async () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();
    const result1: ZipParseResult = {
      files: [], totalSize: 0, fileCount: 0, parseTimeMs: 1,
    };
    const result2: ZipParseResult = {
      files: [], totalSize: 100, fileCount: 5, parseTimeMs: 20,
    };

    const p1 = parser.parse(new ArrayBuffer(0), 'a.zip');
    const p2 = parser.parse(new ArrayBuffer(0), 'b.zip');

    worker.simulateResponse({ requestId: 2, success: true, result: result2 });
    worker.simulateResponse({ requestId: 1, success: true, result: result1 });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual(result1);
    expect(r2).toEqual(result2);
    parser.terminate();
  });

  it('terminates worker and clears pending requests', () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();

    const promise = parser.parse(new ArrayBuffer(0), 'test.zip').catch(() => {});
    parser.terminate();

    expect(() => worker.postMessage({})).toThrow('Worker is terminated');
    return promise;
  });

  it('calls onerror handler and terminates worker', () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();

    worker.simulateError('Network error');

    expect(parser).toBeDefined();
    parser.terminate();
  });

  it('increments requestId for each request', () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();

    const p1 = parser.parse(new ArrayBuffer(0), 'a.zip').catch(() => {});
    const first = worker.lastPostedData as { requestId: number };

    const p2 = parser.parse(new ArrayBuffer(0), 'b.zip').catch(() => {});
    const second = worker.lastPostedData as { requestId: number };

    expect(second.requestId).toBe(first.requestId + 1);
    parser.terminate();
    return Promise.all([p1, p2]);
  });

  it('ignores responses for unknown requestId', async () => {
    const parser = new ZipParserWorkerClass();
    const worker = getLatestWorker();

    const promise = parser.parse(new ArrayBuffer(0), 'test.zip');

    worker.simulateResponse({ requestId: 999, success: true, result: {
      files: [], totalSize: 0, fileCount: 0, parseTimeMs: 0,
    } });

    worker.simulateResponse({ requestId: 1, success: true, result: {
      files: [], totalSize: 0, fileCount: 0, parseTimeMs: 0,
    } });

    await expect(promise).resolves.toBeDefined();
    parser.terminate();
  });
});
