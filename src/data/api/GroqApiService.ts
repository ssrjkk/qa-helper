import type { ApiResult } from './types';
import { metricsCollector } from '../../lib/metrics';

export interface GroqApiServiceOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  maxTokens?: number;
}

export interface GroqStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqApiService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private maxTokens: number;
  private requestId = 0;

  constructor(options: GroqApiServiceOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'llama-3.3-70b-versatile';
    this.baseUrl = options.baseUrl || 'https://api.groq.com/openai/v1/chat/completions';
    this.maxTokens = options.maxTokens || 8192;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setModel(model: string): void {
    this.model = model;
  }

  private getRetryableError(error: Error, status?: number): { type: string; retryAfter?: number } {
    if (!navigator.onLine) {
      return { type: 'network' };
    }

    if (status === 429) {
      return { type: 'rate_limit', retryAfter: 5 };
    }

    if (status === 500 || status === 502 || status === 503) {
      return { type: 'server_error' };
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return { type: 'network' };
    }

    return { type: 'unknown' };
  }

  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  async execute(options: {
    systemPrompt: string;
    userMessage: string;
    signal?: AbortSignal;
    taskType?: string;
  }): Promise<ApiResult> {
    const { systemPrompt, userMessage, signal, taskType } = options;
    const startTime = Date.now();

    if (!this.apiKey) {
      return { success: false, error: 'API key is required' };
    }

    if (!navigator.onLine) {
      return { success: false, error: 'No internet connection' };
    }

    const currentRequestId = ++this.requestId;
    let fullResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const messages: Array<{ role: string; content: string | Array<unknown> }> = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const requestBody: Record<string, unknown> = {
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        stream: true,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal,
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
              const parsed: GroqStreamChunk = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                fullResponse += parsed.choices[0].delta.content;
              }
              if (parsed.usage) {
                inputTokens = parsed.usage.prompt_tokens;
                outputTokens = parsed.usage.completion_tokens;
              }
            } catch { /* malformed SSE chunk, skip */ }
          }
        }
      }

      const responseTime = Date.now() - startTime;
      metricsCollector.recordRequest(taskType || 'groq', true, outputTokens, responseTime);

      return {
        success: true,
        output: fullResponse,
        usage: { outputTokens, inputTokens },
      };

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const responseTime = Date.now() - startTime;

      if (error.name === 'AbortError') {
        metricsCollector.recordRequest(taskType || 'groq', false, 0, responseTime);
        return { success: false, error: 'Request aborted' };
      }

      metricsCollector.recordRequest(taskType || 'groq', false, 0, responseTime);
      return { success: false, error: error.message || 'An error occurred' };
    }
  }

  async executeWithRetry(options: {
    systemPrompt: string;
    userMessage: string;
    taskType?: string;
    maxRetries?: number;
    onRetryAttempt?: (attempt: number, delay: number, error: string) => void;
  }): Promise<ApiResult> {
    const maxRetries = options.maxRetries ?? 3;
    let lastError = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.execute({
        ...options,
        taskType: options.taskType || 'groq',
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
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: `Max retries exceeded. Last error: ${lastError}` };
  }

  abort(): void {
    this.requestId++;
  }
}
