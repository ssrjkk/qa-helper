const RATE_LIMIT_KEY = 'qa-rate-limit';
const DEFAULT_WINDOW_MS = 60000;
const DEFAULT_MAX_REQUESTS = 10;

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitState {
  requests: number[];
  config: RateLimitConfig;
}

let config: RateLimitConfig = {
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: DEFAULT_MAX_REQUESTS
};

function loadState(): RateLimitState {
  try {
    const saved = localStorage.getItem(RATE_LIMIT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as RateLimitState;
      const now = Date.now();
      parsed.requests = parsed.requests.filter(t => now - t < config.windowMs);
      return parsed;
    }
  } catch { /* ignore */ }
  return { requests: [], config };
}

function saveState(state: RateLimitState): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

let state = loadState();

function cleanOldRequests(): void {
  const now = Date.now();
  state.requests = state.requests.filter(t => now - t < config.windowMs);
}

export const RateLimiter = {
  init(newConfig?: { rateLimitWindow?: number; maxRequestsPerWindow?: number }): void {
    if (newConfig?.rateLimitWindow) config.windowMs = newConfig.rateLimitWindow;
    if (newConfig?.maxRequestsPerWindow) config.maxRequests = newConfig.maxRequestsPerWindow;
    state.config = config;
    cleanOldRequests();
    saveState(state);
  },

  getConfig(): RateLimitConfig {
    return { ...config };
  },

  isAllowed(): boolean {
    cleanOldRequests();
    if (state.requests.length >= config.maxRequests) return false;
    state.requests.push(Date.now());
    saveState(state);
    return true;
  },

  getResetTime(): number {
    cleanOldRequests();
    if (state.requests.length === 0) return 0;
    const oldest = Math.min(...state.requests);
    return Math.ceil((oldest + config.windowMs - Date.now()) / 1000);
  },

  getRequestCount(): number {
    cleanOldRequests();
    return state.requests.length;
  },

  getRemaining(): number {
    cleanOldRequests();
    return Math.max(0, config.maxRequests - state.requests.length);
  },

  reset(): void {
    state = { requests: [], config };
    saveState(state);
  },

  recordRequest(): void {
    cleanOldRequests();
    state.requests.push(Date.now());
    saveState(state);
  },

  getTimeUntilNextSlot(): number {
    cleanOldRequests();
    if (state.requests.length < config.maxRequests) return 0;
    const oldest = Math.min(...state.requests);
    return Math.max(0, Math.ceil((oldest + config.windowMs - Date.now()) / 1000));
  }
};
