import { describe, it, expect } from 'vitest';
import { SECURITY_CONFIG } from '../config/security';

describe('SECURITY_CONFIG', () => {
  it('should have all required properties', () => {
    expect(SECURITY_CONFIG).toHaveProperty('maxInputLength');
    expect(SECURITY_CONFIG).toHaveProperty('maxContextLength');
    expect(SECURITY_CONFIG).toHaveProperty('maxMemoryLength');
    expect(SECURITY_CONFIG).toHaveProperty('maxScreenshotSize');
    expect(SECURITY_CONFIG).toHaveProperty('rateLimitWindow');
    expect(SECURITY_CONFIG).toHaveProperty('maxRequestsPerWindow');
    expect(SECURITY_CONFIG).toHaveProperty('requireApiKeyPrefix');
  });

  it('should have reasonable values', () => {
    expect(SECURITY_CONFIG.maxInputLength).toBe(50000);
    expect(SECURITY_CONFIG.maxContextLength).toBe(10000);
    expect(SECURITY_CONFIG.maxMemoryLength).toBe(5000);
    expect(SECURITY_CONFIG.maxScreenshotSize).toBe(5 * 1024 * 1024);
    expect(SECURITY_CONFIG.rateLimitWindow).toBe(60000);
    expect(SECURITY_CONFIG.maxRequestsPerWindow).toBe(10);
    expect(SECURITY_CONFIG.requireApiKeyPrefix).toBe('sk-ant-');
  });

  it('should have screenshot size as 5MB', () => {
    expect(SECURITY_CONFIG.maxScreenshotSize).toBe(5 * 1024 * 1024);
  });

  it('should have rate limit of 10 requests per minute', () => {
    expect(SECURITY_CONFIG.maxRequestsPerWindow).toBe(10);
    expect(SECURITY_CONFIG.rateLimitWindow).toBe(60000);
  });
});

describe('API Key Encryption', () => {
  it('should export encrypt and decrypt functions', async () => {
    const { encryptApiKey, decryptApiKey } = await import('../lib/utils');
    expect(typeof encryptApiKey).toBe('function');
    expect(typeof decryptApiKey).toBe('function');
  });

  it('should encrypt and decrypt API key correctly', async () => {
    const { encryptApiKey, decryptApiKey } = await import('../lib/utils');
    const testKey = 'sk-ant-test-api-key-1234567890';
    
    const encrypted = await encryptApiKey(testKey);
    expect(encrypted).not.toBe(testKey);
    expect(typeof encrypted).toBe('string');
    
    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toBe(testKey);
  });

  it('should handle save and load API key', async () => {
    const { saveApiKey, loadApiKey, clearApiKey } = await import('../lib/utils');
    const testKey = 'sk-ant-load-test-key-1234567890';
    
    await saveApiKey(testKey);
    const loaded = await loadApiKey();
    expect(loaded).toBe(testKey);
    
    clearApiKey();
    const afterClear = await loadApiKey();
    expect(afterClear).toBeNull();
  });

  it('should return null for invalid encrypted data', async () => {
    const { decryptApiKey } = await import('../lib/utils');
    const result = await decryptApiKey('invalid-data');
    expect(result).toBeNull();
  });

  it('should generate different ciphertext for same plaintext', async () => {
    const { encryptApiKey, clearApiKey } = await import('../lib/utils');
    const testKey = 'sk-ant-random-test-key-1234567890';
    
    clearApiKey();
    const encrypted1 = await encryptApiKey(testKey);
    const encrypted2 = await encryptApiKey(testKey);
    
    expect(encrypted1).not.toBe(encrypted2);
  });
});
