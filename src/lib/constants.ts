/**
 * Application constants
 * @module constants
 * @author ssrjkk
 */

export const APP_NAME = 'QA Copilot';
export const APP_AUTHOR = 'ssrjkk';
export const APP_VERSION = '1.0.0';
export const APP_GITHUB = 'https://github.com/ssrjkk/qa-helper';
export const APP_WEBSITE = 'https://qa-copilot.ssrjkk.dev';
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

export const ErrorCode = {
  DB_INIT: 'DB_INIT',
  DB_SAVE: 'DB_SAVE',
  DB_QUERY: 'DB_QUERY',
  DB_INSERT: 'DB_INSERT',
  DB_TRANSACTION: 'DB_TRANSACTION',
  STORAGE_LOAD: 'STORAGE_LOAD',
  STORAGE_SAVE: 'STORAGE_SAVE',
  STORAGE_CLEAR: 'STORAGE_CLEAR',
  ENCRYPT: 'ENCRYPT',
  DECRYPT: 'DECRYPT',
  KEY_MGR_INIT: 'KEY_MGR_INIT',
  KEY_MGR_PASSWORD: 'KEY_MGR_PASSWORD',
  KEY_MGR_CORRUPTED: 'KEY_MGR_CORRUPTED',
  CLOUD_SYNC: 'CLOUD_SYNC',
  CLOUD_CONFIG: 'CLOUD_CONFIG',
  CLOUD_IMPORT: 'CLOUD_IMPORT',
  EXPORT: 'EXPORT',
  API_REQUEST: 'API_REQUEST',
  API_KEY_INVALID: 'API_KEY_INVALID',
  AGENT_EXECUTION: 'AGENT_EXECUTION',
  REACT_CRASH: 'REACT_CRASH',
  METRICS_LOAD: 'METRICS_LOAD',
  METRICS_SAVE: 'METRICS_SAVE',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
