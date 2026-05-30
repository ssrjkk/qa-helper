import { describe, it, expect } from 'vitest';
import { validateApiKey, sanitizeInput, formatFileSize, truncateText } from '../lib/utils';

describe('validateApiKey', () => {
  it('should return invalid for empty key', () => {
    const result = validateApiKey('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('API key required');
  });

  it('should return invalid for null', () => {
    const result = validateApiKey(null as any);
    expect(result.valid).toBe(false);
  });

  it('should return invalid for key too short', () => {
    const result = validateApiKey('sk-ant-short');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Too short');
  });

  it('should return invalid for wrong prefix', () => {
    const result = validateApiKey('sk-openai-123456789012345678901234');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Must start with sk-ant-');
  });

  it('should return invalid for invalid characters', () => {
    const result = validateApiKey('sk-ant-api03-abc@#$%123456789012');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid characters');
  });

  it('should return valid for correct API key', () => {
    const result = validateApiKey('sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890');
    expect(result.valid).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('should return empty string for null', () => {
    expect(sanitizeInput(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('should escape HTML characters', () => {
    const result = sanitizeInput('<script>alert("xss")</script>');
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should trim whitespace', () => {
    const result = sanitizeInput('  hello world  ');
    expect(result).toBe('hello world');
  });

  it('should truncate to maxLength', () => {
    const result = sanitizeInput('hello world', 5);
    expect(result).toBe('hello');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('should format MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('should format GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should handle zero', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });
});

describe('truncateText', () => {
  it('should not truncate short text', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('should truncate long text', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
  });

  it('should handle exact length', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });
});
