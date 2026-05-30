export const SECURITY_CONFIG = {
  maxInputLength: 50000,
  maxContextLength: 10000,
  maxMemoryLength: 5000,
  maxScreenshotSize: 5 * 1024 * 1024,
  rateLimitWindow: 60000,
  maxRequestsPerWindow: 10,
  requireApiKeyPrefix: "sk-ant-",
} as const;

export type SecurityConfig = typeof SECURITY_CONFIG;
