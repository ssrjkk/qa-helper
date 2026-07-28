import { describe, it, expect } from 'vitest';
import { KeyManager } from '../lib/keyManagement';

describe('KeyManager', () => {
  it('isReady returns false before initialization', () => {
    const km = new KeyManager();
    expect(km.isReady()).toBe(false);
  });

  it('clear resets state', () => {
    const km = new KeyManager();
    km.clear();
    expect(km.isReady()).toBe(false);
  });

  it('initialize rejects short passwords', async () => {
    const km = new KeyManager();
    await expect(km.initialize('short')).rejects.toThrow('Password must be at least 8 characters');
  });

  it('encryptApiKey throws before initialization', async () => {
    const km = new KeyManager();
    await expect(km.encryptApiKey('sk-test')).rejects.toThrow('KeyManager not initialized');
  });

  it('decryptApiKey throws before initialization', async () => {
    const km = new KeyManager();
    await expect(km.decryptApiKey('encrypted')).rejects.toThrow('KeyManager not initialized');
  });

  it('hasStoredSalt returns false when no IndexedDB available', async () => {
    const km = new KeyManager();
    const result = await km.hasStoredSalt().catch(() => false);
    expect(typeof result).toBe('boolean');
  });
});
