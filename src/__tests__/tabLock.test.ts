/**
 * @module tabLock tests
 * @author ssrjkk
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tabLock } from '../lib/tabLock';

describe('TabLock', () => {
  beforeEach(() => {
    tabLock.init();
  });

  afterEach(() => {
    tabLock.destroy();
  });

  it('init is idempotent', () => {
    tabLock.init();
    tabLock.init();
    expect(tabLock).toBeDefined();
  });

  it('acquire returns true when no channel', () => {
    tabLock.destroy();
    // After destroy, channel is null, acquire returns true
    tabLock['channel'] = null;
    tabLock.acquire('test-key').then(result => {
      expect(result).toBe(true);
    });
  });

  it('release clears lock', () => {
    // Manually set a lock
    const mockTimeout = setTimeout(() => {}, 5000);
    tabLock['locks'].set('key1', { id: 'test-id', timeout: mockTimeout });
    expect(tabLock.isLocked('key1')).toBe(true);
    tabLock.release('key1');
    expect(tabLock.isLocked('key1')).toBe(false);
  });

  it('release on non-existent key is no-op', () => {
    expect(() => tabLock.release('nonexistent')).not.toThrow();
  });

  it('isLocked returns false for unknown key', () => {
    expect(tabLock.isLocked('unknown')).toBe(false);
  });

  it('destroy clears all state', () => {
    const mockTimeout = setTimeout(() => {}, 5000);
    tabLock['locks'].set('key1', { id: 'id1', timeout: mockTimeout });
    tabLock['pendingRequests'].set('key1', { resolve: vi.fn() });
    tabLock.destroy();
    expect(tabLock.isLocked('key1')).toBe(false);
    expect(tabLock['pendingRequests'].size).toBe(0);
  });

  it('handleMessage acquired resolves pending', () => {
    const resolve = vi.fn();
    tabLock['pendingRequests'].set('key1', { resolve });
    const mockTimeout = setTimeout(() => {}, 5000);
    tabLock['locks'].set('key1', { id: 'lock-id', timeout: mockTimeout });
    tabLock['handleMessage']({ type: 'acquired', key: 'key1', id: 'lock-id' });
    expect(resolve).toHaveBeenCalledWith(true);
    expect(tabLock['pendingRequests'].has('key1')).toBe(false);
  });

  it('handleMessage busy resolves false', () => {
    const resolve = vi.fn();
    tabLock['pendingRequests'].set('key1', { resolve });
    const mockTimeout = setTimeout(() => {}, 5000);
    tabLock['locks'].set('key1', { id: 'lock-id', timeout: mockTimeout });
    tabLock['handleMessage']({ type: 'busy', key: 'key1', id: 'other-id' });
    expect(resolve).toHaveBeenCalledWith(false);
    expect(tabLock.isLocked('key1')).toBe(false);
  });

  it('handleMessage release is no-op', () => {
    expect(() => {
      tabLock['handleMessage']({ type: 'release', key: 'key1', id: 'id' });
    }).not.toThrow();
  });

  it('handleMessage acquire with no existing lock sends acquired', () => {
    const postMessage = vi.fn();
    const close = vi.fn();
    tabLock['channel'] = { postMessage, close } as unknown as BroadcastChannel;
    tabLock['handleMessage']({ type: 'acquire', key: 'new-key', id: 'req-id' });
    expect(postMessage).toHaveBeenCalledWith({
      type: 'acquired',
      key: 'new-key',
      id: 'req-id',
    });
    // Clean up: restore null so destroy() doesn't call close on mock
    tabLock['channel'] = null;
  });

  it('handleMessage acquire with existing lock sends busy', () => {
    const mockTimeout = setTimeout(() => {}, 5000);
    tabLock['locks'].set('existing-key', { id: 'holder-id', timeout: mockTimeout });
    const postMessage = vi.fn();
    const close = vi.fn();
    tabLock['channel'] = { postMessage, close } as unknown as BroadcastChannel;
    tabLock['handleMessage']({ type: 'acquire', key: 'existing-key', id: 'new-id' });
    expect(postMessage).toHaveBeenCalledWith({
      type: 'busy',
      key: 'existing-key',
      id: 'holder-id',
    });
    // Clean up: clear lock and restore null so destroy() doesn't call close on mock
    clearTimeout(mockTimeout);
    tabLock['locks'].delete('existing-key');
    tabLock['channel'] = null;
  });
});
