/**
 * @module encryption tests
 * @author ssrjkk
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../lib/keyManagement', () => ({
  keyManager: {
    isReady: vi.fn(() => false),
    encryptApiKey: vi.fn(async (k: string) => `encrypted:${k}`),
    decryptApiKey: vi.fn(async (d: string) => d.replace('encrypted:', '')),
  },
}));

vi.mock('../lib/errorService', () => ({
  ErrorService: {
    report: vi.fn(),
    reportAsync: vi.fn(),
  },
}));

import { encryptApiKey, decryptApiKey, saveApiKey, loadApiKey, clearApiKey } from '../lib/encryption';
import { keyManager } from '../lib/keyManagement';
import { STORAGE_KEYS } from '../lib/constants';

describe('encryption', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(keyManager.isReady).mockReturnValue(false);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('encryptApiKey uses legacy path when keyManager not ready', async () => {
    vi.mocked(keyManager.isReady).mockReturnValue(false);
    const result = await encryptApiKey('test-key-12345');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('test-key-12345');
  });

  it('encryptApiKey uses keyManager when ready', async () => {
    vi.mocked(keyManager.isReady).mockReturnValue(true);
    const result = await encryptApiKey('my-api-key');
    expect(result).toBe('encrypted:my-api-key');
  });

  it('decryptApiKey uses legacy path when keyManager not ready', async () => {
    vi.mocked(keyManager.isReady).mockReturnValue(false);
    const encrypted = await encryptApiKey('decrypt-test');
    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toBe('decrypt-test');
  });

  it('decryptApiKey uses keyManager when ready', async () => {
    vi.mocked(keyManager.isReady).mockReturnValue(true);
    vi.mocked(keyManager.decryptApiKey).mockResolvedValue('decrypted-value');
    const result = await decryptApiKey('some-encrypted-data');
    expect(result).toBe('decrypted-value');
  });

  it('decryptApiKey falls back to legacy when keyManager fails', async () => {
    // First encrypt with legacy path (keyManager not ready)
    vi.mocked(keyManager.isReady).mockReturnValue(false);
    const encrypted = await encryptApiKey('fallback-test');
    // Now make keyManager ready but failing
    vi.mocked(keyManager.isReady).mockReturnValue(true);
    vi.mocked(keyManager.decryptApiKey).mockRejectedValue(new Error('fail'));
    const result = await decryptApiKey(encrypted);
    expect(result).toBe('fallback-test');
  });

  it('saveApiKey stores encrypted data in localStorage', async () => {
    await saveApiKey('saved-key');
    const stored = localStorage.getItem(STORAGE_KEYS.apiKey);
    expect(stored).toBeTruthy();
    expect(stored).not.toBe('saved-key');
  });

  it('loadApiKey returns null when nothing saved', async () => {
    const result = await loadApiKey();
    expect(result).toBeNull();
  });

  it('loadApiKey returns decrypted data when saved', async () => {
    await saveApiKey('roundtrip-key');
    const result = await loadApiKey();
    expect(result).toBe('roundtrip-key');
  });

  it('clearApiKey removes stored key and salt', async () => {
    await saveApiKey('to-clear');
    localStorage.setItem(STORAGE_KEYS.salt, 'test-salt');
    clearApiKey();
    expect(localStorage.getItem(STORAGE_KEYS.apiKey)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.salt)).toBeNull();
  });

  it('legacy encrypt produces different ciphertext each time (unique IV)', async () => {
    const a = await encryptApiKey('same-plaintext');
    const b = await encryptApiKey('same-plaintext');
    expect(a).not.toBe(b);
  });
});
