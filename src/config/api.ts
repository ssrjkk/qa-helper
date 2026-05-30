export const QA_SYSTEM_PROMPT = `You are a world-class Senior QA Engineer and Test Architect with 15+ years of experience. Provide production-ready outputs with complete, actionable code and strategies.`;

export const SCREENSHOT_SYSTEM_PROMPT = `You are an expert QA Engineer analyzing UI screenshots. Identify defects, accessibility issues, and provide structured recommendations.`;

const ENV = import.meta.env as Record<string, string | undefined>;

export const API_CONFIG = {
  baseUrl: ENV.VITE_API_URL || "https://api.anthropic.com/v1/messages",
  model: ENV.VITE_MODEL || "claude-sonnet-4-20250514",
  maxTokens: parseInt(ENV.VITE_MAX_TOKENS || '8192', 10),
  anthropicVersion: "2023-06-01",
  provider: 'claude',
} as const;
