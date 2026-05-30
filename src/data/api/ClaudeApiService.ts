import { ApiConfig, ApiResult, ClaudeContentBlock } from './types';
import { RateLimiter } from '../../lib/rateLimiter';
import { metricsCollector } from '../../lib/metrics';

export interface ClaudeApiServiceOptions {
  config: ApiConfig;
  onChunk?: (text: string) => void;
  onComplete?: (output: string, usage?: { outputTokens: number }) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

interface RetryableError {
  type: 'network' | 'rate_limit' | 'server_error' | 'unknown';
  message: string;
  retryAfter?: number;
}

export class ClaudeApiService {
  private config: ApiConfig;
  private requestId = 0;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private getRetryableError(error: Error, status?: number): RetryableError {
    if (!navigator.onLine) {
      return { type: 'network', message: 'No internet connection' };
    }

    if (status === 429) {
      const resetAfter = error.message.match(/retry-after:\s*(\d+)/i)?.[1];
      return {
        type: 'rate_limit',
        message: 'API rate limit exceeded',
        retryAfter: resetAfter ? parseInt(resetAfter) : 5
      };
    }

    if (status === 500 || status === 502 || status === 503 || status === 504) {
      return { type: 'server_error', message: `Server error: ${status}` };
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return { type: 'network', message: error.message };
    }

    return { type: 'unknown', message: error.message };
  }

  private calculateBackoff(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  async execute(options: {
    apiKey: string;
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    signal?: AbortSignal;
    taskType?: string;
  }): Promise<ApiResult> {
    const { apiKey, systemPrompt, userMessage, screenshotBase64, signal, taskType } = options;
    const startTime = Date.now();

    if (!apiKey) {
      return { success: false, error: 'API key is required' };
    }

    if (!navigator.onLine) {
      return { success: false, error: 'No internet connection' };
    }

    if (!RateLimiter.isAllowed()) {
      const resetIn = RateLimiter.getResetTime();
      return { success: false, error: `Rate limit exceeded. Please wait ${resetIn} seconds.` };
    }

    const currentRequestId = ++this.requestId;
    RateLimiter.recordRequest();

    let fullResponse = '';
    let outputTokens = 0;

    try {
      let messages: { role: 'user' | 'assistant'; content: string | ClaudeContentBlock[] }[] = [
        { role: 'user', content: userMessage }
      ];

      if (screenshotBase64) {
        messages[0].content = [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } },
          { type: 'text', text: userMessage }
        ];
      }

      const requestBody: Record<string, unknown> = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: systemPrompt,
        messages: messages
      };

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': this.config.anthropicVersion || '2023-06-01',
          'content-type': 'application/json'
        } as Record<string, string>,
        body: JSON.stringify(requestBody),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(
          new Error(errorData.error?.message || `API request failed: ${response.status}`),
          { status: response.status }
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done || currentRequestId !== this.requestId) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullResponse += parsed.delta.text;
              }
              if (parsed.type === 'message_delta' && parsed.usage?.output_tokens) {
                outputTokens = parsed.usage.output_tokens;
              }
            } catch { }
          }
        }
      }

      const responseTime = Date.now() - startTime;
      metricsCollector.recordRequest(taskType || 'unknown', true, outputTokens, responseTime);

      return {
        success: true,
        output: fullResponse,
        usage: { outputTokens }
      };

    } catch (err) {
      const error = err as Error & { status?: number };
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        metricsCollector.recordRequest(taskType || 'unknown', false, 0, responseTime);
        return { success: false, error: 'Request aborted' };
      }

      metricsCollector.recordRequest(taskType || 'unknown', false, 0, responseTime);
      return { success: false, error: error.message || 'An error occurred' };
    }
  }

  async executeWithRetry(
    options: {
      apiKey: string;
      systemPrompt: string;
      userMessage: string;
      screenshotBase64?: string | null;
      taskType?: string;
      maxRetries?: number;
      signal?: AbortSignal;
      onRetryAttempt?: (attempt: number, delay: number, error: string) => void;
    }
  ): Promise<ApiResult> {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelay = 1000;
    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.execute({
        ...options,
        taskType: options.taskType,
        signal: options.signal
      });

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';

      if (attempt < maxRetries) {
        const retryableError = this.getRetryableError(new Error(lastError));
        
        if (retryableError.type === 'unknown') {
          return result;
        }

        const delay = retryableError.retryAfter 
          ? retryableError.retryAfter * 1000 
          : this.calculateBackoff(attempt, baseDelay);

        options.onRetryAttempt?.(attempt + 1, delay, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: `Max retries exceeded. Last error: ${lastError}` };
  }

  abort(): void {
    this.requestId++;
  }
}
