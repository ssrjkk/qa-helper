import { describe, it, expect, vi } from 'vitest';
import {
  validateApiKey, sanitizeInput, formatFileSize, truncateText,
  debounce, throttle, retry, chunk, groupBy, unique, deepClone,
  generateId, parseQueryParams, buildQueryParams, isValidUrl,
  capitalize, slugify, escapeRegex, parseJSON, clamp, randomInt,
  pick, omit,
} from '../lib/utils';

describe('validateApiKey', () => {
  it('should return invalid for empty key', () => {
    const result = validateApiKey('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('API key required');
  });

  it('should return invalid for null', () => {
    const result = validateApiKey(null as unknown as string);
    expect(result.valid).toBe(false);
  });

  it('should return invalid for key too short', () => {
    const result = validateApiKey('sk-ant-short');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Too short');
  });

  it('should accept valid key without provider', () => {
    const result = validateApiKey('sk-openai-123456789012345678901234');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for invalid characters', () => {
    const result = validateApiKey('sk-ant-api03-abc@#$%123456789012');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid characters in API key');
  });

  it('should return valid for correct API key', () => {
    const result = validateApiKey('sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890');
    expect(result.valid).toBe(true);
  });

  it('should validate claude provider prefix', () => {
    const bad = validateApiKey('sk-openai-123456789012345678901234', 'claude');
    expect(bad.valid).toBe(false);
    expect(bad.error).toContain('sk-ant-');

    const good = validateApiKey('sk-ant-api03-abcdefghijklmnopqrstuvwxyz', 'claude');
    expect(good.valid).toBe(true);
  });

  it('should validate groq provider prefix', () => {
    const bad = validateApiKey('sk-ant-123456789012345678901234', 'groq');
    expect(bad.valid).toBe(false);
    expect(bad.error).toContain('gsk_');

    const good = validateApiKey('gsk_abcdefghijklmnopqrstuvwxyz', 'groq');
    expect(good.valid).toBe(true);
  });

  it('should validate openai provider prefix', () => {
    const bad = validateApiKey('gsk_123456789012345678901234', 'openai');
    expect(bad.valid).toBe(false);

    const good = validateApiKey('sk-abcdefghijklmnopqrstuvwxyz', 'openai');
    expect(good.valid).toBe(true);
  });

  it('should validate gemini provider prefix', () => {
    const bad = validateApiKey('sk-ant-123456789012345678901234', 'gemini');
    expect(bad.valid).toBe(false);

    const good = validateApiKey('AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ', 'gemini');
    expect(good.valid).toBe(true);
  });

  it('should accept providers with no prefix requirement', () => {
    const result = validateApiKey('abcdefghijklmnopqrstuvwxyz123456', 'together');
    expect(result.valid).toBe(true);
  });

  it('should reject short key for specific provider', () => {
    const result = validateApiKey('short', 'claude');
    expect(result.valid).toBe(false);
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
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('should truncate to maxLength', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => expect(formatFileSize(500)).toBe('500 Bytes'));
  it('should format KB', () => expect(formatFileSize(1024)).toBe('1 KB'));
  it('should format MB', () => expect(formatFileSize(1024 * 1024)).toBe('1 MB'));
  it('should format GB', () => expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB'));
  it('should handle zero', () => expect(formatFileSize(0)).toBe('0 Bytes'));
});

describe('truncateText', () => {
  it('should not truncate short text', () => expect(truncateText('hello', 10)).toBe('hello'));
  it('should truncate long text', () => expect(truncateText('hello world', 5)).toBe('hello...'));
  it('should handle exact length', () => expect(truncateText('hello', 5)).toBe('hello'));
});

describe('debounce', () => {
  it('should delay function execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should cancel previous call on rapid invocations', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    debounced('b');
    debounced('c');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
    vi.useRealTimers();
  });

  it('should pass arguments correctly', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced('hello', 42);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith('hello', 42);
    vi.useRealTimers();
  });
});

describe('throttle', () => {
  it('should call function immediately on first call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should ignore calls within throttle window', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should allow calls after throttle window expires', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('retry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, { maxAttempts: 3, delay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should succeed after failures', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');
    const result = await retry(fn, { maxAttempts: 3, delay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should reject after max attempts exceeded', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));
    await expect(retry(fn, { maxAttempts: 2, delay: 10 })).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle empty array', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('should handle chunk size larger than array', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('should handle exact division', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });
});

describe('groupBy', () => {
  it('should group by key function', () => {
    const items = [{ type: 'a', val: 1 }, { type: 'b', val: 2 }, { type: 'a', val: 3 }];
    const result = groupBy(items, i => i.type);
    expect(result.a).toHaveLength(2);
    expect(result.b).toHaveLength(1);
  });

  it('should handle empty array', () => {
    expect(groupBy([], i => i)).toEqual({});
  });
});

describe('unique', () => {
  it('should remove duplicates without key function', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('should remove duplicates by key function', () => {
    const items = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 1, name: 'c' }];
    const result = unique(items, i => i.id);
    expect(result).toHaveLength(2);
  });
});

describe('deepClone', () => {
  it('should deep clone objects', () => {
    const obj = { a: { b: { c: 1 } }, d: [1, 2, { e: 3 }] };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.a).not.toBe(obj.a);
    expect(cloned.d).not.toBe(obj.d);
  });

  it('should handle primitives', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
  });

  it('should handle arrays', () => {
    const arr = [1, [2, 3]];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should include prefix', () => {
    const id = generateId('task');
    expect(id).toMatch(/^task_/);
  });

  it('should work without prefix', () => {
    const id = generateId();
    expect(id).toMatch(/_/);
  });
});

describe('parseQueryParams', () => {
  it('should parse query params', () => {
    const result = parseQueryParams('https://example.com?foo=bar&baz=42');
    expect(result.foo).toBe('bar');
    expect(result.baz).toBe('42');
  });

  it('should return empty for invalid URL', () => {
    expect(parseQueryParams('not-a-url')).toEqual({});
  });
});

describe('buildQueryParams', () => {
  it('should build query string', () => {
    const result = buildQueryParams({ foo: 'bar', num: 42 });
    expect(result).toContain('foo=bar');
    expect(result).toContain('num=42');
  });

  it('should skip undefined values', () => {
    const result = buildQueryParams({ a: '1', b: undefined });
    expect(result).toBe('a=1');
  });
});

describe('isValidUrl', () => {
  it('should validate URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('Hello');
    expect(capitalize('hELLO')).toBe('Hello');
  });
});

describe('slugify', () => {
  it('should create slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('  Spaces  ')).toBe('spaces');
    expect(slugify('Special!@#Chars')).toBe('specialchars');
  });
});

describe('escapeRegex', () => {
  it('should escape regex special chars', () => {
    expect(escapeRegex('hello.world')).toBe('hello\\.world');
    expect(escapeRegex('[test]')).toBe('\\[test\\]');
  });
});

describe('parseJSON', () => {
  it('should parse valid JSON', () => {
    expect(parseJSON('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('should return fallback on invalid JSON', () => {
    expect(parseJSON('bad', 'fallback')).toBe('fallback');
  });
});

describe('clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('randomInt', () => {
  it('should return integer within range', () => {
    for (let i = 0; i < 50; i++) {
      const val = randomInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });
});

describe('pick', () => {
  it('should pick specified keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('should ignore non-existent keys', () => {
    expect(pick({ a: 1 }, ['a', 'z' as never])).toEqual({ a: 1 });
  });
});

describe('omit', () => {
  it('should omit specified keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 });
  });
});
