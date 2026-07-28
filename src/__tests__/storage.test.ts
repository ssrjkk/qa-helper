import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageFallback, createStorageProvider } from '../lib/storage';

const LS_KEY = 'app-state';

describe('LocalStorageFallback', () => {
  let storage: LocalStorageFallback;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageFallback();
  });

  it('returns null when no data saved', async () => {
    expect(await storage.load()).toBeNull();
  });

  it('saves and loads data round-trip', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    await storage.save(data);
    const loaded = await storage.load();
    expect(loaded).toBeTruthy();
    expect(loaded!.length).toBe(data.length);
    for (let i = 0; i < data.length; i++) {
      expect(loaded![i]).toBe(data[i]);
    }
  });

  it('clears saved data', async () => {
    await storage.save(new Uint8Array([10, 20]));
    await storage.clear();
    expect(await storage.load()).toBeNull();
  });

  it('getSize returns encoded size', async () => {
    await storage.save(new Uint8Array([1, 2, 3]));
    const size = await storage.getSize();
    expect(size).toBeGreaterThan(0);
  });

  it('getSize returns 0 when empty', async () => {
    expect(await storage.getSize()).toBe(0);
  });

  it('returns null for corrupted data', async () => {
    localStorage.setItem(LS_KEY, 'not-valid-base64-data!!!');
    expect(await storage.load()).toBeNull();
  });

  it('returns null for data shorter than IV', async () => {
    const short = btoa('short');
    localStorage.setItem(LS_KEY, short);
    expect(await storage.load()).toBeNull();
  });
});

describe('createStorageProvider()', () => {
  it('returns a storage provider', async () => {
    const provider = await createStorageProvider();
    expect(provider).toBeDefined();
    expect(typeof provider.save).toBe('function');
    expect(typeof provider.load).toBe('function');
  });
});
