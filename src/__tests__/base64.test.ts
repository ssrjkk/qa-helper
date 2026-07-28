/**
 * @module base64 tests
 * @author ssrjkk
 */
import { describe, it, expect } from 'vitest';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../lib/base64';

describe('base64', () => {
  it('round-trips empty buffer', () => {
    const buf = new ArrayBuffer(0);
    const b64 = arrayBufferToBase64(buf);
    expect(b64).toBe('');
    const result = base64ToArrayBuffer(b64);
    expect(result.length).toBe(0);
  });

  it('round-trips simple ASCII data', () => {
    const text = 'Hello, World!';
    const encoder = new TextEncoder();
    const buf = encoder.encode(text).buffer;
    const b64 = arrayBufferToBase64(buf);
    expect(typeof b64).toBe('string');
    expect(b64.length).toBeGreaterThan(0);
    const decoded = base64ToArrayBuffer(b64);
    const decoder = new TextDecoder();
    expect(decoder.decode(decoded)).toBe(text);
  });

  it('round-trips binary data', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);
    const b64 = arrayBufferToBase64(bytes.buffer);
    const decoded = base64ToArrayBuffer(b64);
    expect(decoded).toEqual(bytes);
  });

  it('handles large data (chunked encoding)', () => {
    const size = 20000;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = i % 256;
    const b64 = arrayBufferToBase64(bytes.buffer);
    const decoded = base64ToArrayBuffer(b64);
    expect(decoded.length).toBe(size);
    expect(decoded[0]).toBe(0);
    expect(decoded[255]).toBe(255);
    expect(decoded[256]).toBe(0);
  });

  it('base64ToArrayBuffer returns Uint8Array', () => {
    const result = base64ToArrayBuffer('AQID');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('produces valid base64', () => {
    const buf = new TextEncoder().encode('test').buffer;
    const b64 = arrayBufferToBase64(buf);
    expect(b64).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});
