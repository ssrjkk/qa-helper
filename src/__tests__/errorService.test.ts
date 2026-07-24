import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorService } from '../lib/errorService';

describe('ErrorService', () => {
  beforeEach(() => {
    ErrorService.clearLog();
  });

  describe('report()', () => {
    it('adds entries to the log', () => {
      ErrorService.report('TEST', 'test message');
      expect(ErrorService.getLog()).toHaveLength(1);
    });

    it('returns an AppError with correct structure', () => {
      const entry = ErrorService.report('CODE', 'msg', { key: 'val' }, false);
      expect(entry).toEqual({
        code: 'CODE',
        message: 'msg',
        context: { key: 'val' },
        recoverable: false,
        timestamp: expect.any(Number),
      });
    });

    it('defaults recoverable to true', () => {
      const entry = ErrorService.report('CODE', 'msg');
      expect(entry.recoverable).toBe(true);
    });

    it('recoverable=true vs recoverable=false', () => {
      const r = ErrorService.report('R', 'r', undefined, true);
      const nr = ErrorService.report('NR', 'nr', undefined, false);
      expect(r.recoverable).toBe(true);
      expect(nr.recoverable).toBe(false);
    });
  });

  describe('reportAsync()', () => {
    it('handles Error objects', () => {
      const entry = ErrorService.reportAsync('ASYNC', new Error('boom'));
      expect(entry.message).toBe('boom');
      expect(entry.code).toBe('ASYNC');
    });

    it('handles non-Error values gracefully', () => {
      const entry = ErrorService.reportAsync('ASYNC', 'string error');
      expect(entry.message).toBe('string error');
    });

    it('handles thrown errors gracefully', () => {
      const entry = ErrorService.reportAsync('ASYNC', 42);
      expect(entry.message).toBe('42');
      expect(ErrorService.getLog()).toHaveLength(1);
    });
  });

  describe('subscribe()', () => {
    it('gets notified of new errors', () => {
      const handler = vi.fn();
      ErrorService.subscribe(handler);
      ErrorService.report('T', 't');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ code: 'T' }));
    });

    it('can unsubscribe', () => {
      const handler = vi.fn();
      const unsub = ErrorService.subscribe(handler);
      ErrorService.report('T', 't');
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();
      ErrorService.report('T2', 't2');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('multiple subscribers are all notified', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      ErrorService.subscribe(h1);
      ErrorService.subscribe(h2);
      ErrorService.report('T', 't');
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLog()', () => {
    it('returns all logged errors', () => {
      ErrorService.report('A', 'a');
      ErrorService.report('B', 'b');
      expect(ErrorService.getLog()).toHaveLength(2);
    });

    it('returns empty array when no errors', () => {
      expect(ErrorService.getLog()).toHaveLength(0);
    });

    it('filters by code', () => {
      ErrorService.report('A', 'a');
      ErrorService.report('B', 'b');
      ErrorService.report('A', 'a2');
      const aErrors = ErrorService.getLog().filter((e) => e.code === 'A');
      expect(aErrors).toHaveLength(2);
    });
  });

  describe('clearLog()', () => {
    it('empties the log', () => {
      ErrorService.report('A', 'a');
      ErrorService.report('B', 'b');
      ErrorService.clearLog();
      expect(ErrorService.getLog()).toHaveLength(0);
    });
  });

  describe('error entry structure', () => {
    it('has code, message, context, recoverable, timestamp', () => {
      const entry = ErrorService.report('E', 'err', { x: 1 }, false);
      expect(entry).toHaveProperty('code', 'E');
      expect(entry).toHaveProperty('message', 'err');
      expect(entry).toHaveProperty('context', { x: 1 });
      expect(entry).toHaveProperty('recoverable', false);
      expect(entry).toHaveProperty('timestamp');
      expect(typeof entry.timestamp).toBe('number');
    });

    it('context is optional', () => {
      const entry = ErrorService.report('E', 'err');
      expect(entry.context).toBeUndefined();
    });
  });
});
