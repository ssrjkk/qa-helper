export const APP_NAME = 'QA Copilot';
export const APP_AUTHOR = 'ssrjkk';
export const APP_FOOTER = `${APP_NAME} by ${APP_AUTHOR} | MIT License`;
export const APP_HEADER_SUBTITLE = 'AI-Powered QA Assistant';
export const APP_HEADER_BYLINE = `by ${APP_AUTHOR}`;

export const DB_TABLES = {
  projects: 'projects',
  tasks: 'tasks',
  screenshots: 'screenshots',
  conversationHistory: 'conversation_history',
  memoryEntries: 'memory_entries',
} as const;

export const STORAGE_KEYS = {
  onboarding: 'qa-copilot-onboarding-seen',
  apiKey: 'qa-api-key',
  salt: 'qa-helper-salt',
  rateLimit: 'qa-rate-limit',
  legacyKey: 'qa-helper-legacy-key',
  theme: 'qa-copilot-theme',
} as const;

export const LIMITS = {
  maxSessions: 50,
  maxMemoryEntries: 200,
  debounceSaveMs: 500,
  debounceContextErrorMs: 300,
  pollIntervalMs: 2000,
  autoSaveIntervalMs: 1000,
  maxToolOutputChars: 2000,
  maxAgentContextMessages: 6,
  maxRetries: 3,
} as const;

export const ANIMATION = {
  fadeIn: 'fadeIn',
  fadeOut: 'fadeOut',
  slideUp: 'slideUp',
  slideDown: 'slideDown',
} as const;

export const KEYBOARD = {
  undo: 'z',
  redo: 'y',
  execute: 'Enter',
  toggleMode: 'm',
  toggleSidebar: 'b',
  escape: 'Escape',
} as const;
