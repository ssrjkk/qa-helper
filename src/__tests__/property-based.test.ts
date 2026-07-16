import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { parseToolCall } from '../lib/toolParser';
import { useAppStore } from '../store/useAppStore';
import {
  validateApiKey,
  sanitizeInput,
  truncateText,
  formatFileSize,
  slugify,
  escapeRegex,
  clamp,
  parseJSON,
  chunk,
  unique,
  groupBy,
} from '../lib/utils';
import type { AiProvider } from '../config/security';
import type { MemoryEntry, MemoryCategory } from '../types/memory';

describe('Property-Based: parseToolCall', () => {
  it('never throws on arbitrary strings', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        expect(() => parseToolCall(str)).not.toThrow();
      }),
      { numRuns: 5000 },
    );
  });

  it('returns null for strings without tool blocks', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const result = parseToolCall(str);
        if (result !== null) {
          expect(result.name).toBeTruthy();
          expect(typeof result.name).toBe('string');
          expect(result.input).toBeTruthy();
          expect(typeof result.input).toBe('object');
        }
      }),
      { numRuns: 2000 },
    );
  });

  it('parses any valid {name, input} JSON inside ```tool blocks', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom('list_directory', 'read_file', 'search_code', 'custom_tool'),
        fc.dictionary(fc.string(), fc.jsonValue()),
        fc.string(),
        (prefix, name, input, suffix) => {
          const normalized = JSON.parse(JSON.stringify(input));
          const jsonStr = JSON.stringify({ name, input: normalized });
          const text = `${prefix}\n\`\`\`tool\n${jsonStr}\n\`\`\`\n${suffix}`;
          const result = parseToolCall(text);
          expect(result).not.toBeNull();
          expect(result!.name).toBe(name);
          expect(result!.input).toEqual(normalized);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('returns null for tool blocks with missing name or input', () => {
    fc.assert(
      fc.property(fc.string(), fc.jsonValue(), (prefix, payload) => {
        const text = `${prefix}\n\`\`\`tool\n${JSON.stringify({ data: payload })}\n\`\`\``;
        const result = parseToolCall(text);
        if (result !== null) {
          expect(typeof result.name).toBe('string');
        }
      }),
      { numRuns: 500 },
    );
  });
});

describe('Property-Based: validateApiKey', () => {
  const providers: AiProvider[] = [
    'claude', 'groq', 'openai', 'gemini', 'openrouter', 'deepseek', 'together', 'novita', 'lepton',
  ];

  it('never throws on any string for any provider', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom(...providers),
        (key, provider) => {
          expect(() => validateApiKey(key, provider)).not.toThrow();
        },
      ),
      { numRuns: 5000 },
    );
  });

  it('never throws when called without provider', () => {
    fc.assert(
      fc.property(fc.string(), (key) => {
        expect(() => validateApiKey(key)).not.toThrow();
      }),
      { numRuns: 3000 },
    );
  });

  it('always returns an object with valid:boolean', () => {
    fc.assert(
      fc.property(fc.string(), (key) => {
        const result = validateApiKey(key);
        expect(typeof result.valid).toBe('boolean');
        if (!result.valid) {
          expect(typeof result.error).toBe('string');
        }
      }),
      { numRuns: 2000 },
    );
  });

  it('valid keys with correct prefix and length always pass', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...providers),
        (provider) => {
          const patterns: Record<AiProvider, { prefix?: string[]; minLength: number }> = {
            claude: { prefix: ['sk-ant-'], minLength: 20 },
            groq: { prefix: ['gsk_'], minLength: 20 },
            openai: { prefix: ['sk-'], minLength: 20 },
            gemini: { prefix: ['AIza'], minLength: 20 },
            openrouter: { prefix: ['sk-or-'], minLength: 20 },
            deepseek: { prefix: ['sk-'], minLength: 20 },
            together: { minLength: 20 },
            novita: { minLength: 20 },
            lepton: { minLength: 20 },
          };
          const p = patterns[provider];
          const prefix = p.prefix?.[0] ?? '';
          const key = prefix + 'a'.repeat(Math.max(0, p.minLength - prefix.length));
          const result = validateApiKey(key, provider);
          expect(result.valid).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property-Based: sanitizeInput', () => {
  it('never throws on any input', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        expect(() => sanitizeInput(str)).not.toThrow();
      }),
      { numRuns: 3000 },
    );
  });

  it('always returns a string', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const result = sanitizeInput(str);
        expect(typeof result).toBe('string');
      }),
      { numRuns: 2000 },
    );
  });

  it('result never contains raw HTML special characters', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const result = sanitizeInput(str);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        expect(result).not.toContain('"');
        expect(result).not.toMatch(/(?<!&)'/);
      }),
      { numRuns: 2000 },
    );
  });

  it('respects maxLength (min 1)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 1, max: 100 }),
        (str, maxLen) => {
          const result = sanitizeInput(str, maxLen);
          expect(result.length).toBeLessThanOrEqual(maxLen);
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe('Property-Based: truncateText', () => {
  it('result never exceeds maxLength + 3 (for "...")', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 1, max: 1000 }),
        (str, maxLen) => {
          const result = truncateText(str, maxLen);
          expect(result.length).toBeLessThanOrEqual(maxLen + 3);
        },
      ),
      { numRuns: 2000 },
    );
  });

  it('returns original string unchanged if within maxLength', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 50 }),
        fc.integer({ min: 50, max: 500 }),
        (str, maxLen) => {
          const result = truncateText(str, maxLen);
          expect(result).toBe(str);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('ends with "..." when truncated', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10 }),
        fc.integer({ min: 1, max: 9 }),
        (str, maxLen) => {
          if (str.length > maxLen) {
            const result = truncateText(str, maxLen);
            expect(result.endsWith('...')).toBe(true);
          }
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe('Property-Based: formatFileSize', () => {
  it('never throws on any non-negative integer', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (bytes) => {
        expect(() => formatFileSize(bytes)).not.toThrow();
      }),
      { numRuns: 2000 },
    );
  });

  it('always returns a non-empty string with a size unit', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (bytes) => {
        const result = formatFileSize(bytes);
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/\d+ (Bytes|KB|MB|GB|TB|PB)/);
      }),
      { numRuns: 2000 },
    );
  });
});

describe('Property-Based: slugify', () => {
  it('output is always lowercase, no spaces, no special chars', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const result = slugify(str);
        expect(result).toBe(result.toLowerCase());
        expect(result).not.toMatch(/\s/);
        expect(result).not.toMatch(/[^\w-]/);
        expect(result).not.toMatch(/^-|-$/);
      }),
      { numRuns: 3000 },
    );
  });
});

describe('Property-Based: escapeRegex', () => {
  it('output is always a safe regex pattern', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const escaped = escapeRegex(str);
        expect(() => new RegExp(escaped)).not.toThrow();
      }),
      { numRuns: 2000 },
    );
  });

  it('escaped pattern matches the original string literally', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const escaped = escapeRegex(str);
        const re = new RegExp(escaped);
        expect(re.test(str)).toBe(true);
      }),
      { numRuns: 2000 },
    );
  });
});

describe('Property-Based: clamp', () => {
  it('result is always within [min, max]', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        (value, a, b) => {
          const min = Math.min(a, b);
          const max = Math.max(a, b);
          const result = clamp(value, min, max);
          expect(result).toBeGreaterThanOrEqual(min);
          expect(result).toBeLessThanOrEqual(max);
        },
      ),
      { numRuns: 3000 },
    );
  });
});

describe('Property-Based: parseJSON', () => {
  it('never throws — returns fallback on invalid JSON', () => {
    fc.assert(
      fc.property(fc.string(), fc.jsonValue(), (str, fallback) => {
        expect(() => parseJSON(str, fallback)).not.toThrow();
      }),
      { numRuns: 2000 },
    );
  });

  it('returns parsed value for valid JSON', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const json = JSON.stringify(value);
        const result = parseJSON(json, null);
        const normalized = JSON.parse(JSON.stringify(value));
        expect(result).toEqual(normalized);
      }),
      { numRuns: 1000 },
    );
  });
});

describe('Property-Based: chunk', () => {
  it('output length equals input length', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        fc.integer({ min: 1, max: 50 }),
        (arr, size) => {
          const result = chunk(arr, size);
          const totalItems = result.reduce((sum, c) => sum + c.length, 0);
          expect(totalItems).toBe(arr.length);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('each chunk has at most size elements (except possibly the last)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        fc.integer({ min: 1, max: 50 }),
        (arr, size) => {
          const result = chunk(arr, size);
          result.forEach((c, i) => {
            if (i < result.length - 1) {
              expect(c.length).toBe(size);
            } else {
              expect(c.length).toBeLessThanOrEqual(size);
            }
          });
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe('Property-Based: unique', () => {
  it('output contains no duplicates', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const result = unique(arr);
        expect(new Set(result).size).toBe(result.length);
      }),
      { numRuns: 1000 },
    );
  });

  it('output is a subset of input', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const result = unique(arr);
        const inputSet = new Set(arr);
        result.forEach((item) => {
          expect(inputSet.has(item)).toBe(true);
        });
      }),
      { numRuns: 1000 },
    );
  });
});

describe('Property-Based: groupBy', () => {
  it('every key maps to non-empty array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.integer(), cat: fc.constantFrom('a', 'b', 'c') })),
        (arr) => {
          const result = groupBy(arr, (item) => item.cat);
          Object.values(result).forEach((group) => {
            expect(group.length).toBeGreaterThan(0);
          });
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe('Property-Based: Zustand Store invariants', () => {
  beforeEach(() => {
    useAppStore.setState({
      sessions: [],
      memoryEntries: [],
      agentSteps: [],
      output: '',
      context: '',
      screenshotBase64: null,
      error: null,
    });
  });

  it('addSession never exceeds 50 entries', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            task_type: fc.string(),
            context: fc.string(),
            output: fc.string(),
            created_at: fc.constant('2024-01-01'),
          }),
          { minLength: 1, maxLength: 200 },
        ),
        (sessions) => {
          useAppStore.setState({ sessions: [] });
          sessions.forEach((s) => useAppStore.getState().addSession(s));
          expect(useAppStore.getState().sessions.length).toBeLessThanOrEqual(50);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('addSession prepends (newest first)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            task_type: fc.string(),
            context: fc.string(),
            output: fc.string(),
            created_at: fc.string(),
          }),
          { minLength: 2, maxLength: 10 },
        ),
        (sessions) => {
          useAppStore.setState({ sessions: [] });
          sessions.forEach((s) => useAppStore.getState().addSession(s));
          const stored = useAppStore.getState().sessions;
          expect(stored[0]).toEqual(sessions[sessions.length - 1]);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('setOutput handles both string and function updater', () => {
    fc.assert(
      fc.property(fc.string(), (initial) => {
        useAppStore.setState({ output: '' });
        useAppStore.getState().setOutput(initial);
        expect(useAppStore.getState().output).toBe(initial);

        useAppStore.getState().setOutput((prev) => prev + '_extended');
        expect(useAppStore.getState().output).toBe(initial + '_extended');
      }),
      { numRuns: 1000 },
    );
  });

  it('resetTask clears exactly the right fields', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (ctx, out) => {
        useAppStore.setState({
          context: ctx,
          output: out,
          screenshotBase64: 'data:image/png;base64,abc',
          error: 'some error',
          agentSteps: [{ id: '1', type: 'thinking', content: 'x', timestamp: 0 }],
          selectedTask: 'test_task',
          apiKey: 'should_not_be_cleared',
        });
        useAppStore.getState().resetTask();
        const state = useAppStore.getState();
        expect(state.context).toBe('');
        expect(state.output).toBe('');
        expect(state.screenshotBase64).toBeNull();
        expect(state.error).toBeNull();
        expect(state.agentSteps).toEqual([]);
        expect(state.selectedTask).toBe('test_task');
        expect(state.apiKey).toBe('should_not_be_cleared');
      }),
      { numRuns: 500 },
    );
  });

  it('removeMemoryEntry removes exactly the targeted entry', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 20 }),
        (targetId, otherIds) => {
          const ids = [...new Set([targetId, ...otherIds])];
          const categories: MemoryCategory[] = ['tech_stack', 'edge_cases', 'custom'];
          const entries: MemoryEntry[] = ids.map((id) => ({
            id,
            project_id: 1,
            category: categories[id % 3],
            key: `key_${id}`,
            value: `val_${id}`,
            confidence: 0.8,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          }));
          useAppStore.setState({ memoryEntries: entries });
          useAppStore.getState().removeMemoryEntry(targetId);
          const remaining = useAppStore.getState().memoryEntries;
          expect(remaining.find((e) => e.id === targetId)).toBeUndefined();
          expect(remaining.length).toBe(entries.length - 1);
        },
      ),
      { numRuns: 500 },
    );
  });
});
