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

  setModel(model: string): void {
    this.config = { ...this.config, model };
  }

  private getRetryableError(error: Error): RetryableError {
    if (!navigator.onLine) {
      return { type: 'network', message: 'No internet connection' };
    }

    const msg = error.message;
    const statusMatch = msg.match(/(?:failed|error).*?:\s*(\d{3})/i) || msg.match(/\b(429|5\d{2})\b/);

    if (statusMatch) {
      const status = parseInt(statusMatch[1]!);
      if (status === 429) {
        const resetAfter = msg.match(/retry-after:\s*(\d+)/i)?.[1];
        return { type: 'rate_limit', message: 'API rate limit exceeded', retryAfter: resetAfter ? parseInt(resetAfter) : 5 };
      }
      if (status >= 500 && status <= 504) {
        return { type: 'server_error', message: `Server error: ${status}` };
      }
    }

    if (msg.includes('fetch') || msg.includes('network')) {
      return { type: 'network', message: msg };
    }

    return { type: 'unknown', message: msg };
  }

  private calculateBackoff(attempt: number): number {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
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
    onChunk?: (text: string) => void;
  }): Promise<ApiResult> {
    const { apiKey, systemPrompt, userMessage, screenshotBase64, signal, taskType, onChunk } = options;
    const startTime = Date.now();

    if (!apiKey) {
      return { success: false, error: 'API key is required' };
    }

    if (!navigator.onLine) {
      return { success: false, error: 'No internet connection' };
    }

    if (!RateLimiter.consumeSlot()) {
      const resetIn = RateLimiter.getResetTime();
      return { success: false, error: `Rate limit exceeded. Please wait ${resetIn} seconds.` };
    }

    const currentRequestId = ++this.requestId;

    let fullResponse = '';
    let outputTokens = 0;

    try {
      const messages: { role: 'user' | 'assistant'; content: string | ClaudeContentBlock[] }[] = [
        { role: 'user', content: userMessage }
      ];

      if (screenshotBase64) {
        const firstMsg = messages[0]!;
        firstMsg.content = [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } },
          { type: 'text', text: userMessage }
        ];
      }

      const requestBody: Record<string, unknown> = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: systemPrompt,
        messages: messages,
        stream: true,
      };

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': this.config.anthropicVersion || '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `API request failed: ${response.status}`;
        throw Object.assign(new Error(msg), { status: response.status });
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let lineBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || currentRequestId !== this.requestId) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullResponse += parsed.delta.text;
              onChunk?.(parsed.delta.text);
            }
            if (parsed.type === 'message_delta' && parsed.usage?.output_tokens) {
              outputTokens = parsed.usage.output_tokens;
            }
          } catch { /* malformed SSE chunk, skip */ }
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
      const error = err instanceof Error ? err : new Error(String(err));
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
      onChunk?: (text: string) => void;
    }
  ): Promise<ApiResult> {
    const maxRetries = options.maxRetries ?? 3;
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
          : this.calculateBackoff(attempt);

        options.onRetryAttempt?.(attempt + 1, delay, lastError);
        await new Promise<void>((resolve, reject) => {
          const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          };
          options.signal?.addEventListener('abort', onAbort, { once: true });
          const timer = setTimeout(() => {
            options.signal?.removeEventListener('abort', onAbort);
            resolve();
          }, delay);
        });
      }
    }

    return { success: false, error: `Max retries exceeded. Last error: ${lastError}` };
  }

  abort(): void {
    this.requestId++;
  }
}
