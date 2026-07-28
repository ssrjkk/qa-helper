/**
 * Application constants
 * @module constants
 * @author ssrjkk
 */

export const APP_NAME = 'QA Copilot';
export const APP_AUTHOR = 'ssrjkk';
export const APP_WEBSITE = 'https://qa-copilot.ssrjkk.dev';
export const APP_FOOTER = `${APP_NAME} by ${APP_AUTHOR} | MIT License`;
export const APP_HEADER_SUBTITLE = 'AI-Powered QA Assistant';
export const APP_HEADER_BYLINE = `by ${APP_AUTHOR}`;

export const STORAGE_KEYS = {
  onboarding: 'qa-copilot-onboarding-seen',
  apiKey: 'qa-api-key',
  salt: 'qa-helper-salt',
  rateLimit: 'qa-rate-limit',
  legacyKey: 'qa-helper-legacy-key',
  theme: 'qa-copilot-theme',
  locale: 'qa-copilot-locale',
  metrics: 'qa-metrics',
  dbBackup: 'qa-helper-sync-backup',
  dbUnsaved: 'qa-helper-unsaved',
  lsPassphrase: 'qa-helper-ls-key',
  syncStatus: 'qa-helper-sync-status',
  syncConfig: 'qa-helper-sync-config',
  syncBackup: 'qa-helper-sync-backup-data',
  attempts: 'qa-helper-attempts',
  backupIndex: 'qa-helper-backup-index',
  backupPrefix: 'qa-helper-backup-',
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
  toastDurationMs: 4000,
  retryBaseDelayMs: 1000,
  retryMaxDelayMs: 30000,
  retryJitterFactor: 0.1,
  maxAgentSteps: 100,
  maxCacheEntries: 100,
  maxFileContentChars: 100_000,
  crashReportRetentionMs: 30 * 24 * 60 * 60 * 1000,
} as const;

export const PROTOTYPE_POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

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
  AUTH: 'AUTH',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
