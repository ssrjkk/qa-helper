import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, CircuitBreakerOpenError } from '../lib/circuitBreaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in CLOSED state', () => {
    const cb = new CircuitBreaker();
    expect(cb.getState()).toBe('closed');
  });

  it('stays CLOSED under failure threshold', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});

    expect(cb.getState()).toBe('closed');
    expect(cb.getStats().failureCount).toBe(2);
  });

  it('transitions to OPEN after threshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 60000 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});

    expect(cb.getState()).toBe('open');
  });

  it('rejects immediately when OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 60000 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));
    const successFn = vi.fn().mockResolvedValue('ok');

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});

    await expect(cb.execute(successFn)).rejects.toThrow(CircuitBreakerOpenError);
    expect(successFn).not.toHaveBeenCalled();
  });

  it('transitions to HALF_OPEN after resetTimeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 5000 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});
    expect(cb.getState()).toBe('open');

    vi.advanceTimersByTime(5000);
    expect(cb.getState()).toBe('half_open');
  });

  it('transitions to CLOSED on success from HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 5000 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));
    const successFn = vi.fn().mockResolvedValue('ok');

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});

    vi.advanceTimersByTime(5000);
    const result = await cb.execute(successFn);

    expect(result).toBe('ok');
    expect(cb.getState()).toBe('closed');
    expect(cb.getStats().failureCount).toBe(0);
  });

  it('transitions back to OPEN on failure from HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 5000 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});

    vi.advanceTimersByTime(5000);
    await cb.execute(failingFn).catch(() => {});

    expect(cb.getState()).toBe('open');
  });

  it('resets failure count on success in CLOSED state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));
    const successFn = vi.fn().mockResolvedValue('ok');

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});
    await cb.execute(successFn);

    expect(cb.getStats().failureCount).toBe(0);
  });

  it('manual reset works', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 60000 });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});
    expect(cb.getState()).toBe('open');

    cb.reset();
    expect(cb.getState()).toBe('closed');
    expect(cb.getStats().failureCount).toBe(0);
  });

  it('onStateChange callback is called', async () => {
    const onStateChange = vi.fn();
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 5000, onStateChange });
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    await cb.execute(failingFn).catch(() => {});
    await cb.execute(failingFn).catch(() => {});

    expect(onStateChange).toHaveBeenCalledWith('closed', 'open');

    vi.advanceTimersByTime(5000);
    cb.getState();
    expect(onStateChange).toHaveBeenCalledWith('open', 'half_open');
  });

  it('tracks total requests', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 5 });
    const fn = vi.fn().mockResolvedValue('ok');

    await cb.execute(fn);
    await cb.execute(fn);
    await cb.execute(fn);

    expect(cb.getStats().totalRequests).toBe(3);
    expect(cb.getStats().successCount).toBe(3);
  });

  it('CircuitBreakerOpenError has retryAfterMs', () => {
    const err = new CircuitBreakerOpenError('test', 5000);
    expect(err.name).toBe('CircuitBreakerOpenError');
    expect(err.retryAfterMs).toBe(5000);
  });
});
