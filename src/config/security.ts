export const SECURITY_CONFIG = {
  maxInputLength: 50000,
  maxContextLength: 10000,
  maxMemoryLength: 5000,
  maxScreenshotSize: 5 * 1024 * 1024,
  rateLimitWindow: 60000,
  maxRequestsPerWindow: 10,
} as const;

export type SecurityConfig = typeof SECURITY_CONFIG;

export type AiProvider =
  | 'claude' | 'groq' | 'openai' | 'gemini'
  | 'openrouter' | 'deepseek' | 'together'
  | 'novita' | 'lepton';

export const PROVIDER_KEY_PATTERNS: Record<AiProvider, { prefix?: string[]; minLength: number }> = {
  claude:     { prefix: ['sk-ant-'],      minLength: 20 },
  groq:       { prefix: ['gsk_'],          minLength: 20 },
  openai:     { prefix: ['sk-'],           minLength: 20 },
  gemini:     { prefix: ['AIza'],          minLength: 20 },
  openrouter: { prefix: ['sk-or-'],       minLength: 20 },
  deepseek:   { prefix: ['sk-'],           minLength: 20 },
  together:   {                           minLength: 20 },
  novita:     {                           minLength: 20 },
  lepton:     {                           minLength: 20 },
};
