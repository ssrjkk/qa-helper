import type { ApiResult } from './types';

const DEFAULT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  apiUrl?: string;
}

export class OpenRouterApiService {
  private config: OpenRouterConfig;
  private abortController: AbortController | null = null;

  constructor(config: OpenRouterConfig) {
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
    
    this.abortController = new AbortController();
    const combinedSignal = signal 
      ? AbortSignal.any([signal, this.abortController.signal])
      : this.abortController.signal;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.config.apiUrl || DEFAULT_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://qa-copilot.ssrjkk.dev',
            'X-Title': 'QA Copilot BY ssrjkk',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            max_tokens: this.config.maxTokens,
            stream: false,
          }),
          signal: combinedSignal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
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
        if ((err as Error).name === 'AbortError') {
          return { success: false, error: 'Request aborted' };
        }

        const errorMsg = (err as Error).message;
        
        if (attempt < maxRetries && this.isRetryableError(errorMsg)) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          if (options.onRetryAttempt) {
            options.onRetryAttempt(attempt, delay, errorMsg);
          }
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        return { success: false, error: errorMsg };
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  private isRetryableError(error: string): boolean {
    const retryableErrors = ['network', 'timeout', '429', '500', '502', '503', '504'];
    return retryableErrors.some(err => error.toLowerCase().includes(err.toLowerCase()));
  }
}
