import { describe, it, expect } from 'vitest';
import {
  projectId,
  taskId,
  memoryEntryId,
  screenshotId,
  conversationMessageId,
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  tryCatch,
  tryCatchSync,
} from '../types/branded';

describe('Branded Types', () => {
  describe('createProjectId()', () => {
    it('returns a branded ProjectId', () => {
      const id = projectId(42);
      expect(id).toBe(42);
    });
  });

  describe('createTaskId()', () => {
    it('returns a branded TaskId', () => {
      const id = taskId(7);
      expect(id).toBe(7);
    });
  });

  describe('createMemoryEntryId()', () => {
    it('returns a branded MemoryEntryId', () => {
      const id = memoryEntryId(99);
      expect(id).toBe(99);
    });
  });

  describe('createScreenshotId()', () => {
    it('returns a branded ScreenshotId', () => {
      const id = screenshotId(5);
      expect(id).toBe(5);
    });
  });

  describe('createConversationMessageId()', () => {
    it('returns a branded ConversationMessageId', () => {
      const id = conversationMessageId(12);
      expect(id).toBe(12);
    });
  });
});

describe('Result', () => {
  const success = ok(42);
  const failure = err(new Error('fail'));

  describe('isOk()', () => {
    it('returns true for Ok results', () => {
      expect(isOk(success)).toBe(true);
    });

    it('returns false for Err results', () => {
      expect(isOk(failure)).toBe(false);
    });
  });

  describe('isErr()', () => {
    it('returns true for Err results', () => {
      expect(isErr(failure)).toBe(true);
    });

    it('returns false for Ok results', () => {
      expect(isErr(success)).toBe(false);
    });
  });

  describe('unwrap()', () => {
    it('returns value from Ok', () => {
      expect(unwrap(success)).toBe(42);
    });

    it('throws from Err', () => {
      expect(() => unwrap(failure)).toThrow('fail');
    });
  });

  describe('unwrapOr()', () => {
    it('returns value from Ok', () => {
      expect(unwrapOr(success, 0)).toBe(42);
    });

    it('returns default from Err', () => {
      expect(unwrapOr(failure, 0)).toBe(0);
    });
  });
});

describe('tryCatch()', () => {
  it('returns Ok for successful async functions', async () => {
    const result = await tryCatch(async () => 10);
    expect(isOk(result)).toBe(true);
    expect(unwrap(result)).toBe(10);
  });

  it('returns Err for throwing async functions', async () => {
    const result = await tryCatch(async () => {
      throw new Error('async fail');
    });
    expect(isErr(result)).toBe(true);
    if (!result.ok) {
      expect(result.error.message).toBe('async fail');
    }
  });
});

describe('tryCatchSync()', () => {
  it('returns Ok for successful functions', () => {
    const result = tryCatchSync(() => 5);
    expect(isOk(result)).toBe(true);
    expect(unwrap(result)).toBe(5);
  });

  it('returns Err for throwing functions', () => {
    const result = tryCatchSync(() => {
      throw new Error('sync fail');
    });
    expect(isErr(result)).toBe(true);
    if (!result.ok) {
      expect(result.error.message).toBe('sync fail');
    }
  });

  it('works synchronously (no await needed)', () => {
    const result = tryCatchSync(() => 'hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('hello');
    }
  });
});
