/**
 * Brute force protection for master password attempts
 * @module attemptsLimiter
 * @author ssrjkk
 */

import { STORAGE_KEYS, ErrorCode } from './constants';
import { ErrorService } from './errorService';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

interface AttemptState {
  failures: number[];
  lockedUntil: number | null;
}

function loadState(): AttemptState {
  if (typeof localStorage === 'undefined') {
    return { failures: [], lockedUntil: null };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.attempts);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const now = Date.now();
        const validFailures = Array.isArray(parsed.failures)
          ? parsed.failures.filter((t: number) => now - t < LOCKOUT_MS)
          : [];
        const lockedUntil = typeof parsed.lockedUntil === 'number' && parsed.lockedUntil > now
          ? parsed.lockedUntil
          : null;
        return { failures: validFailures, lockedUntil };
      }
    }
  } catch {
    if (import.meta.env.DEV) console.warn('[attemptsLimiter] Failed to load state');
    ErrorService.reportAsync(ErrorCode.AUTH, new Error('Failed to load attempts state'));
  }
  return { failures: [], lockedUntil: null };
}

function saveState(state: AttemptState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(state));
  } catch {
    if (import.meta.env.DEV) console.warn('[attemptsLimiter] Failed to save state');
  }
}

let state = loadState();

function cleanOldFailures(): void {
  const now = Date.now();
  state.failures = state.failures.filter(t => now - t < LOCKOUT_MS);
  if (state.lockedUntil && state.lockedUntil <= now) {
    state.lockedUntil = null;
    state.failures = [];
  }
}

export const AttemptsLimiter = {
  isLocked(): boolean {
    cleanOldFailures();
    if (state.lockedUntil && state.lockedUntil > Date.now()) {
      return true;
    }
    return false;
  },

  getRemainingLockoutMs(): number {
    cleanOldFailures();
    if (!state.lockedUntil) return 0;
    return Math.max(0, state.lockedUntil - Date.now());
  },

  getRemainingAttempts(): number {
    cleanOldFailures();
    return Math.max(0, MAX_ATTEMPTS - state.failures.length);
  },

  recordFailure(): void {
    cleanOldFailures();
    state.failures.push(Date.now());
    if (state.failures.length >= MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + LOCKOUT_MS;
      ErrorService.report(ErrorCode.AUTH, 'Too many failed password attempts — locked out', {
        attempts: state.failures.length,
        lockoutMs: LOCKOUT_MS,
      }, false);
    }
    saveState(state);
  },

  reset(): void {
    state = { failures: [], lockedUntil: null };
    saveState(state);
  },

  getMaxAttempts(): number {
    return MAX_ATTEMPTS;
  },

  getLockoutMs(): number {
    return LOCKOUT_MS;
  },
};
