/**
 * @module toolParser tests
 * @author ssrjkk
 */
import { describe, it, expect } from 'vitest';
import { parseToolCall } from '../lib/toolParser';

describe('parseToolCall', () => {
  it('parses valid tool call', () => {
    const response = 'Here is my result:\n```tool\n{"name":"read_file","input":{"path":"src/index.ts"}}\n```\nDone.';
    const result = parseToolCall(response);
    expect(result).toEqual({
      name: 'read_file',
      input: { path: 'src/index.ts' },
    });
  });

  it('returns null for no tool block', () => {
    expect(parseToolCall('Just a regular response')).toBeNull();
  });

  it('returns null for invalid JSON inside tool block', () => {
    const response = '```tool\n{invalid json}\n```';
    expect(parseToolCall(response)).toBeNull();
  });

  it('returns null for missing name field', () => {
    const response = '```tool\n{"input":{"path":"src"}}\n```';
    expect(parseToolCall(response)).toBeNull();
  });

  it('returns null for missing input field', () => {
    const response = '```tool\n{"name":"read_file"}\n```';
    expect(parseToolCall(response)).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    const response = '```tool\n"just a string"\n```';
    expect(parseToolCall(response)).toBeNull();
  });

  it('returns null for array JSON', () => {
    const response = '```tool\n[1, 2, 3]\n```';
    expect(parseToolCall(response)).toBeNull();
  });

  it('handles nested input objects', () => {
    const response = '```tool\n{"name":"search","input":{"query":{"text":"hello","filters":{"lang":"en"}}}}\n```';
    const result = parseToolCall(response);
    expect(result).not.toBeNull();
    expect(result!.input.query).toEqual({ text: 'hello', filters: { lang: 'en' } });
  });

  it('handles empty input object', () => {
    const response = '```tool\n{"name":"noop","input":{}}\n```';
    const result = parseToolCall(response);
    expect(result).toEqual({ name: 'noop', input: {} });
  });

  it('handles tool block with extra whitespace', () => {
    const response = '```tool  \n  {"name":"test","input":{"a":1}}  \n```';
    const result = parseToolCall(response);
    expect(result).toEqual({ name: 'test', input: { a: 1 } });
  });

  it('returns null for empty tool block', () => {
    const response = '```tool\n\n```';
    expect(parseToolCall(response)).toBeNull();
  });

  it('extracts first tool call when multiple exist', () => {
    const response = '```tool\n{"name":"first","input":{"x":1}}\n```\n\n```tool\n{"name":"second","input":{"y":2}}\n```';
    const result = parseToolCall(response);
    expect(result!.name).toBe('first');
  });

  it('name must be a string (not number)', () => {
    const response = '```tool\n{"name":123,"input":{}}\n```';
    expect(parseToolCall(response)).toBeNull();
  });
});
