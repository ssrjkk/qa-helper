import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get store() { return store; },
  };
}

describe('AttemptsLimiter', () => {
  let ls: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    ls = mockLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts unlocked with 5 attempts', async () => {
    const { AttemptsLimiter } = await import('../lib/attemptsLimiter');
    expect(AttemptsLimiter.isLocked()).toBe(false);
    expect(AttemptsLimiter.getRemainingAttempts()).toBe(5);
  });

  it('records failures and decreases attempts', async () => {
    const { AttemptsLimiter } = await import('../lib/attemptsLimiter');
    AttemptsLimiter.recordFailure();
    expect(AttemptsLimiter.getRemainingAttempts()).toBe(4);

    AttemptsLimiter.recordFailure();
    expect(AttemptsLimiter.getRemainingAttempts()).toBe(3);
  });

  it('locks after 5 failures', async () => {
    const { AttemptsLimiter } = await import('../lib/attemptsLimiter');
    for (let i = 0; i < 5; i++) {
      AttemptsLimiter.recordFailure();
    }
    expect(AttemptsLimiter.isLocked()).toBe(true);
    expect(AttemptsLimiter.getRemainingLockoutMs()).toBeGreaterThan(0);
  });

  it('unlocks after lockout expires', async () => {
    const { AttemptsLimiter } = await import('../lib/attemptsLimiter');
    for (let i = 0; i < 5; i++) {
      AttemptsLimiter.recordFailure();
    }
    expect(AttemptsLimiter.isLocked()).toBe(true);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
    expect(AttemptsLimiter.isLocked()).toBe(false);
    expect(AttemptsLimiter.getRemainingAttempts()).toBe(5);
  });

  it('reset clears all state', async () => {
    const { AttemptsLimiter } = await import('../lib/attemptsLimiter');
    AttemptsLimiter.recordFailure();
    AttemptsLimiter.recordFailure();
    AttemptsLimiter.reset();
    expect(AttemptsLimiter.isLocked()).toBe(false);
    expect(AttemptsLimiter.getRemainingAttempts()).toBe(5);
  });

  it('returns correct max attempts and lockout', async () => {
    const { AttemptsLimiter } = await import('../lib/attemptsLimiter');
    expect(AttemptsLimiter.getMaxAttempts()).toBe(5);
    expect(AttemptsLimiter.getLockoutMs()).toBe(5 * 60 * 1000);
  });
});
