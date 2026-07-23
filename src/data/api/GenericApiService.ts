import type { ApiResult } from './types';

const RETRYABLE_ERRORS = ['network', 'timeout', '429', '500', '502', '503', '504'];

export function isRetryableError(error: string): boolean {
  const lower = error.toLowerCase();
  return RETRYABLE_ERRORS.some((e) => lower.includes(e));
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
    onRetryAttempt?: (attempt: number, delay: number, error: string) => void;
  }): Promise<ApiResult> {
    const { systemPrompt, userMessage, signal, maxRetries = 3 } = options;

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    let combinedSignal = this.abortController.signal;
    if (signal) {
      const mergedController = new AbortController();
      signal.addEventListener('abort', () => mergedController.abort(signal.reason), { once: true });
      this.abortController.signal.addEventListener('abort', () => mergedController.abort(this.abortController!.signal.reason), { once: true });
      combinedSignal = mergedController.signal;
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
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
          throw new Error(
            errorData.error?.message || `${this.config.providerName} API error: ${response.status}`,
          );
        }

        const data = await response.json();

        if (data.choices?.[0]) {
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

        if (error.name === 'AbortError') {
          return { success: false, error: 'Request aborted' };
        }

        if (attempt < maxRetries && isRetryableError(error.message)) {
          const delay = Math.pow(2, attempt) * 1000;
          options.onRetryAttempt?.(attempt + 1, delay, error.message);
          await new Promise<void>((r, reject) => {
            const timer = setTimeout(r, delay);
            const onAbort = () => {
              clearTimeout(timer);
              reject(new DOMException('Aborted', 'AbortError'));
            };
            combinedSignal.addEventListener('abort', onAbort, { once: true });
            const cleanup = () => combinedSignal.removeEventListener('abort', onAbort);
            const origR = r;
            r = (() => { cleanup(); origR(); }) as () => void;
          });
          continue;
        }

        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }
}
