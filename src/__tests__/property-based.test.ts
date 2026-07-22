import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { parseToolCall } from '../lib/toolParser';
import { useAppStore } from '../store/useAppStore';
import { CircuitBreaker, CircuitBreakerOpenError } from '../lib/circuitBreaker';
import { validateApiKey, sanitizeInput, truncateText, formatFileSize, slugify, escapeRegex, clamp, parseJSON, chunk, unique, groupBy } from '../lib/utils';
import type { AiProvider } from '../config/security';
import type { MemoryEntry, MemoryCategory } from '../types/memory';

describe('Property-Based: parseToolCall (real toolParser.ts)', () => {
  it('never throws on any string (10k runs)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        let threw = false;
        try { parseToolCall(input); } catch { threw = true; }
        expect(threw).toBe(false);
      }),
      { numRuns: 10_000 },
    );
  });

  it('returns null when no ```tool block exists', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 500 }), (input) => {
        if (!/```tool[\s\S]*?```/.test(input)) {
          expect(parseToolCall(input)).toBeNull();
        }
      }),
      { numRuns: 5_000 },
    );
  });

  it('result always has non-empty name and object input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = parseToolCall(input);
        if (result !== null) {
          expect(typeof result.name).toBe('string');
          expect(result.name.length).toBeGreaterThan(0);
          expect(typeof result.input).toBe('object');
          expect(result.input).not.toBeNull();
        }
      }),
      { numRuns: 5_000 },
    );
  });

  it('correctly extracts name and input from valid tool blocks', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 100 }),
        fc.constantFrom('list_directory', 'read_file', 'search_code', 'custom_tool'),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue(), { maxKeys: 10 }),
        fc.string({ maxLength: 100 }),
        (prefix, name, input, suffix) => {
          const normalized = JSON.parse(JSON.stringify(input));
          const json = JSON.stringify({ name, input: normalized });
          const text = `${prefix}\n\`\`\`tool\n${json}\n\`\`\`\n${suffix}`;
          const result = parseToolCall(text);
          expect(result).not.toBeNull();
          expect(result!.name).toBe(name);
          expect(result!.input).toEqual(normalized);
        },
      ),
      { numRuns: 2_000 },
    );
  });
});

describe('Property-Based: Zustand Store (real useAppStore)', () => {
  const catAr: MemoryCategory[] = ['tech_stack', 'edge_cases', 'custom'];
  const makeEntry = (id: number): MemoryEntry => ({
    id, project_id: 1, category: catAr[id % 3]!, key: `k${id}`, value: `v${id}`,
    confidence: 0.8, created_at: '2024-01-01', updated_at: '2024-01-01',
  });

  beforeEach(() => {
    useAppStore.setState({
      sessions: [], memoryEntries: [], agentSteps: [], output: '',
      context: '', screenshotBase64: null, error: null,
    });
  });

  it('addSession: never exceeds 50 entries', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ task_type: fc.string(), context: fc.string(), output: fc.string(), created_at: fc.constant('2024-01-01') }), { minLength: 1, maxLength: 200 }),
        (sessions) => {
          useAppStore.setState({ sessions: [] });
          sessions.forEach((s) => useAppStore.getState().addSession(s));
          expect(useAppStore.getState().sessions.length).toBeLessThanOrEqual(50);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('addSession: prepends newest first', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ task_type: fc.string(), context: fc.string(), output: fc.string(), created_at: fc.string() }), { minLength: 2, maxLength: 10 }),
        (sessions) => {
          useAppStore.setState({ sessions: [] });
          sessions.forEach((s) => useAppStore.getState().addSession(s));
          expect(useAppStore.getState().sessions[0]).toEqual(sessions[sessions.length - 1]!);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('setOutput: handles string and function updater', () => {
    fc.assert(
      fc.property(fc.string(), (initial) => {
        useAppStore.setState({ output: '' });
        useAppStore.getState().setOutput(initial);
        expect(useAppStore.getState().output).toBe(initial);
        useAppStore.getState().setOutput((prev) => prev + '_ext');
        expect(useAppStore.getState().output).toBe(initial + '_ext');
      }),
      { numRuns: 1_000 },
    );
  });

  it('resetTask: clears exactly the right fields, preserves the rest', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (ctx, out) => {
        useAppStore.setState({
          context: ctx, output: out, screenshotBase64: 'data:img',
          error: 'err', agentSteps: [{ id: '1', type: 'thinking', content: 'x', timestamp: 0 }],
          selectedTask: 'task_x', apiKey: 'secret', mode: 'agent',
        });
        useAppStore.getState().resetTask();
        const s = useAppStore.getState();
        expect(s.context).toBe('');
        expect(s.output).toBe('');
        expect(s.screenshotBase64).toBeNull();
        expect(s.error).toBeNull();
        expect(s.agentSteps).toEqual([]);
        expect(s.selectedTask).toBe('task_x');
        expect(s.apiKey).toBe('secret');
        expect(s.mode).toBe('agent');
      }),
      { numRuns: 500 },
    );
  });

  it('removeMemoryEntry: removes exactly the targeted entry', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 20 }),
        (targetId, otherIds) => {
          const ids = [...new Set([targetId, ...otherIds])];
          useAppStore.setState({ memoryEntries: ids.map(makeEntry) });
          useAppStore.getState().removeMemoryEntry(targetId);
          const remaining = useAppStore.getState().memoryEntries;
          expect(remaining.find((e) => e.id === targetId)).toBeUndefined();
          expect(remaining.length).toBe(ids.length - 1);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('addAgentStep: always appends', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string(), content: fc.string() }), { minLength: 1, maxLength: 50 }),
        (steps) => {
          useAppStore.setState({ agentSteps: [] });
          steps.forEach((st) => useAppStore.getState().addAgentStep({ ...st, type: 'thinking' as const, timestamp: 0 }));
          const stored = useAppStore.getState().agentSteps;
          expect(stored.length).toBe(steps.length);
          steps.forEach((st, i) => { expect(stored[i]!.id).toBe(st.id); });
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('Property-Based: CircuitBreaker (real state machine)', () => {
  vi.useFakeTimers();

  const driveFailures = async (cb: CircuitBreaker, n: number) => {
    const failing = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < n; i++) {
      await cb.execute(failing).catch(() => {});
    }
  };

  it('CLOSED -> OPEN after exactly N sequential failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }),
        async (threshold) => {
          const cb = new CircuitBreaker({ failureThreshold: threshold, resetTimeout: 60_000 });

          await driveFailures(cb, threshold - 1);
          expect(cb.getState()).toBe('closed');

          await driveFailures(cb, 1);
          expect(cb.getState()).toBe('open');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('reset() returns to CLOSED from OPEN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (threshold) => {
          const cb = new CircuitBreaker({ failureThreshold: threshold, resetTimeout: 60_000 });

          await driveFailures(cb, threshold);
          expect(cb.getState()).toBe('open');

          cb.reset();
          expect(cb.getState()).toBe('closed');
          expect(cb.getStats().failureCount).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('OPEN state always rejects without calling the wrapped function', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (threshold) => {
          const cb = new CircuitBreaker({ failureThreshold: threshold, resetTimeout: 60_000 });

          await driveFailures(cb, threshold);

          let fnCalled = false;
          let threw = false;
          try {
            await cb.execute(async () => { fnCalled = true; return 'ok'; });
          } catch (e) {
            threw = true;
            expect(e).toBeInstanceOf(CircuitBreakerOpenError);
          }
          expect(fnCalled).toBe(false);
          expect(threw).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('onStateChange callback fires on transitions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (threshold) => {
          const transitions: Array<[string, string]> = [];
          const cb = new CircuitBreaker({
            failureThreshold: threshold,
            resetTimeout: 60_000,
            onStateChange: (from, to) => transitions.push([from, to]),
          });

          await driveFailures(cb, threshold);
          expect(transitions.some(([, to]) => to === 'open')).toBe(true);

          cb.reset();
          expect(transitions.some(([, to]) => to === 'closed')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('success resets failure count in CLOSED state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }),
        async (threshold) => {
          const cb = new CircuitBreaker({ failureThreshold: threshold, resetTimeout: 60_000 });

          await driveFailures(cb, threshold - 1);
          await cb.execute(() => Promise.resolve('ok'));
          expect(cb.getState()).toBe('closed');
          expect(cb.getStats().failureCount).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property-Based: validateApiKey', () => {
  const providers: AiProvider[] = ['claude', 'groq', 'openai', 'gemini', 'openrouter', 'deepseek', 'together', 'novita', 'lepton'];

  it('never throws on any string for any provider', () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom(...providers), (key, provider) => {
        expect(() => validateApiKey(key, provider)).not.toThrow();
      }),
      { numRuns: 5_000 },
    );
  });

  it('always returns {valid: boolean}', () => {
    fc.assert(
      fc.property(fc.string(), (key) => {
        const r = validateApiKey(key);
        expect(typeof r.valid).toBe('boolean');
        if (!r.valid) expect(typeof r.error).toBe('string');
      }),
      { numRuns: 2_000 },
    );
  });
});

describe('Property-Based: sanitizeInput', () => {
  it('never throws', () => {
    fc.assert(fc.property(fc.string(), (s) => { expect(() => sanitizeInput(s)).not.toThrow(); }), { numRuns: 3_000 });
  });

  it('always returns a string with no raw HTML specials', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const r = sanitizeInput(s);
        expect(typeof r).toBe('string');
        expect(r).not.toContain('<');
        expect(r).not.toContain('>');
        expect(r).not.toContain('"');
      }),
      { numRuns: 2_000 },
    );
  });

  it('respects maxLength', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.integer({ min: 1, max: 100 }), (s, max) => {
        expect(sanitizeInput(s, max).length).toBeLessThanOrEqual(max);
      }),
      { numRuns: 1_000 },
    );
  });
});

describe('Property-Based: truncateText', () => {
  it('never exceeds maxLength + 3', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 1, max: 1000 }), (s, max) => {
        expect(truncateText(s, max).length).toBeLessThanOrEqual(max + 3);
      }),
      { numRuns: 2_000 },
    );
  });

  it('preserves original when within limit', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 50 }), fc.integer({ min: 50, max: 500 }), (s, max) => {
        expect(truncateText(s, max)).toBe(s);
      }),
      { numRuns: 1_000 },
    );
  });
});

describe('Property-Based: formatFileSize', () => {
  it('never throws on any non-negative integer', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (b) => {
        expect(() => formatFileSize(b)).not.toThrow();
      }),
      { numRuns: 2_000 },
    );
  });

  it('always returns valid unit string', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (b) => {
        expect(formatFileSize(b)).toMatch(/\d+ (Bytes|KB|MB|GB|TB|PB)/);
      }),
      { numRuns: 2_000 },
    );
  });
});

describe('Property-Based: slugify', () => {
  it('output: lowercase, no spaces, no special chars, no leading/trailing hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const r = slugify(s);
        expect(r).toBe(r.toLowerCase());
        expect(r).not.toMatch(/\s/);
        expect(r).not.toMatch(/[^\w-]/);
        expect(r).not.toMatch(/^-|-$/);
      }),
      { numRuns: 3_000 },
    );
  });
});

describe('Property-Based: escapeRegex', () => {
  it('output always compiles as a valid RegExp', () => {
    fc.assert(
      fc.property(fc.string(), (s) => { expect(() => new RegExp(escapeRegex(s))).not.toThrow(); }),
      { numRuns: 2_000 },
    );
  });

  it('escaped pattern always matches the original string', () => {
    fc.assert(
      fc.property(fc.string(), (s) => { expect(new RegExp(escapeRegex(s)).test(s)).toBe(true); }),
      { numRuns: 2_000 },
    );
  });
});

describe('Property-Based: clamp', () => {
  it('result always in [min, max]', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true }), fc.double({ noNaN: true }), fc.double({ noNaN: true }), (v, a, b) => {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        const r = clamp(v, lo, hi);
        expect(r).toBeGreaterThanOrEqual(lo);
        expect(r).toBeLessThanOrEqual(hi);
      }),
      { numRuns: 3_000 },
    );
  });
});

describe('Property-Based: parseJSON', () => {
  it('never throws, returns fallback on invalid', () => {
    fc.assert(
      fc.property(fc.string(), fc.jsonValue(), (s, fb) => { expect(() => parseJSON(s, fb)).not.toThrow(); }),
      { numRuns: 2_000 },
    );
  });

  it('round-trips valid JSON', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (v) => {
        const norm = JSON.parse(JSON.stringify(v));
        expect(parseJSON(JSON.stringify(v), null)).toEqual(norm);
      }),
      { numRuns: 1_000 },
    );
  });
});

describe('Property-Based: chunk / unique / groupBy', () => {
  it('chunk: total items preserved', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), fc.integer({ min: 1, max: 50 }), (arr, size) => {
        expect(chunk(arr, size).reduce((s, c) => s + c.length, 0)).toBe(arr.length);
      }),
      { numRuns: 1_000 },
    );
  });

  it('unique: no duplicates, subset of input', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const r = unique(arr);
        expect(new Set(r).size).toBe(r.length);
        const s = new Set(arr);
        r.forEach((item) => { expect(s.has(item)).toBe(true); });
      }),
      { numRuns: 1_000 },
    );
  });

  it('groupBy: every group is non-empty', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.integer(), cat: fc.constantFrom('a', 'b', 'c') })),
        (arr) => { Object.values(groupBy(arr, (i) => i.cat)).forEach((g) => { expect(g.length).toBeGreaterThan(0); }); },
      ),
      { numRuns: 1_000 },
    );
  });
});
