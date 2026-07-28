/**
 * Generic OpenAI-compatible API service with retry logic
 * @module GenericApiService
 * @author ssrjkk
 */

import type { ApiResult } from './types';
import { metricsCollector } from '../../lib/metrics';
import { LIMITS } from '../../lib/constants';

function isRetryableError(error: string): boolean {
  const lower = error.toLowerCase();
  return /\b(429|5\d{2})\b/.test(lower) || ['network', 'timeout', 'econnreset', 'econnrefused'].some(e => lower.includes(e));
}

interface GenericApiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  apiUrl: string;
  providerName: string;
  extraHeaders?: Record<string, string>;
  temperature?: number;
}

export class GenericApiService {
  private config: GenericApiConfig;
  private abortController: AbortController | null = null;

  constructor(config: GenericApiConfig) {
    this.config = config;
  }

  setModel(model: string): void {
    this.config.model = model;
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async execute(options: {
    systemPrompt: string;
    userMessage: string;
    signal?: AbortSignal;
  }): Promise<ApiResult> {
    return this.executeWithRetry(options);
  }

  async executeWithRetry(options: {
    systemPrompt: string;
    userMessage: string;
    signal?: AbortSignal;
    maxRetries?: number;
    taskType?: string;
    onRetryAttempt?: (attempt: number, delay: number, error: string) => void;
  }): Promise<ApiResult> {
    const { systemPrompt, userMessage, signal, maxRetries = 3, taskType } = options;
    const startTime = Date.now();

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const currentController = this.abortController;
    let combinedSignal = currentController.signal;
    if (signal) {
      const mergedController = new AbortController();
      signal.addEventListener('abort', () => mergedController.abort(signal.reason), { once: true });
      currentController.signal.addEventListener('abort', () => mergedController.abort(currentController.signal.reason), { once: true });
      combinedSignal = mergedController.signal;
    }

    let lastError = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (!this.config.apiKey) {
          return { success: false, error: 'API key is required' };
        }
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return { success: false, error: 'No internet connection' };
        }

        const body: Record<string, unknown> = {
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: this.config.maxTokens,
          stream: false,
        };
        if (this.config.temperature !== undefined) {
          body.temperature = this.config.temperature;
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...this.config.extraHeaders,
        };

        const response = await fetch(this.config.apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: combinedSignal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.error?.message || `${this.config.providerName} API error: ${response.status}`;
          throw Object.assign(new Error(msg), { status: response.status });
        }

        const data = await response.json();

        if (data.choices?.[0]) {
          const responseTime = Date.now() - startTime;
          const outputTokens = data.usage?.completion_tokens;
          metricsCollector.recordRequest(taskType || this.config.providerName, true, outputTokens, responseTime);
          return {
            success: true,
            output: data.choices[0].message.content,
            usage: {
              outputTokens: data.usage?.completion_tokens,
              inputTokens: data.usage?.prompt_tokens,
            },
          };
        }

        return { success: false, error: 'No response from model' };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error.message;

        if (error.name === 'AbortError') {
          return { success: false, error: 'Request aborted' };
        }

        if (attempt < maxRetries && isRetryableError(error.message)) {
          const baseDelay = Math.min(Math.pow(2, attempt) * LIMITS.retryBaseDelayMs, LIMITS.retryMaxDelayMs);
          const jitterArray = new Uint32Array(1);
          crypto.getRandomValues(jitterArray);
          const jitter = baseDelay * LIMITS.retryJitterFactor * ((jitterArray[0]! / 0xFFFFFFFF) * 2 - 1);
          const delay = Math.round(baseDelay + jitter);
          options.onRetryAttempt?.(attempt + 1, delay, error.message);
          await new Promise<void>((resolve, reject) => {
            const onAbort = () => {
              clearTimeout(timer);
              reject(new DOMException('Aborted', 'AbortError'));
            };
            combinedSignal.addEventListener('abort', onAbort, { once: true });
            const timer = setTimeout(() => {
              combinedSignal.removeEventListener('abort', onAbort);
              resolve();
            }, delay);
          });
          continue;
        }

        const responseTime = Date.now() - startTime;
        metricsCollector.recordRequest(taskType || this.config.providerName, false, undefined, responseTime);
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: `Max retries exceeded. Last error: ${lastError}` };
  }
}
