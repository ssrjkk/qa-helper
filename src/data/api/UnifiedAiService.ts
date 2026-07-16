import type { AiProvider, ApiResult } from './types';
import { ClaudeApiService } from './ClaudeApiService';
import { GroqApiService } from './GroqApiService';
import { OpenRouterApiService } from './OpenRouterApiService';
import { DeepSeekApiService } from './DeepSeekApiService';
import { TogetherApiService } from './TogetherApiService';
import { NovitaApiService } from './NovitaApiService';
import { CircuitBreaker } from '../../lib/circuitBreaker';

export interface UnifiedAiService {
  execute(options: {
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    signal?: AbortSignal;
    taskType?: string;
    onChunk?: (text: string) => void;
  }): Promise<ApiResult>;

  executeWithRetry(options: {
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    signal?: AbortSignal;
    taskType?: string;
    maxRetries?: number;
    onRetryAttempt?: (attempt: number, delay: number, error: string) => void;
    onChunk?: (text: string) => void;
  }): Promise<ApiResult>;

  abort(): void;
  setApiKey(apiKey: string): void;
  setModel(model: string): void;
  setProvider(provider: AiProvider, apiKey?: string, model?: string): void;
  getProvider(): AiProvider;
  supportsVision(): boolean;
}

export class UnifiedAiServiceImpl implements UnifiedAiService {
  private claudeService: ClaudeApiService;
  private groqService: GroqApiService;
  private openRouterService: OpenRouterApiService;
  private deepSeekService: DeepSeekApiService;
  private togetherService: TogetherApiService;
  private novitaService: NovitaApiService;
  private currentProvider: AiProvider = 'claude';
  private currentApiKey = '';
  private circuitBreakers: Map<AiProvider, CircuitBreaker> = new Map();

  constructor() {
    this.claudeService = new ClaudeApiService({
      baseUrl: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 8192,
      anthropicVersion: '2023-06-01',
      provider: 'claude',
    });

    this.groqService = new GroqApiService({
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      maxTokens: 8192,
    });

    this.openRouterService = new OpenRouterApiService({
      apiKey: '',
      model: 'deepseek/deepseek-chat',
      maxTokens: 8192,
    });

    this.deepSeekService = new DeepSeekApiService({
      apiKey: '',
      model: 'deepseek-chat',
      maxTokens: 8192,
    });

    this.togetherService = new TogetherApiService({
      apiKey: '',
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      maxTokens: 32768,
    });

    this.novitaService = new NovitaApiService({
      apiKey: '',
      model: 'deepseek/deepseek-chat',
      maxTokens: 8192,
    });

    const providers: AiProvider[] = ['claude', 'groq', 'openrouter', 'deepseek', 'together', 'novita'];
    for (const p of providers) {
      this.circuitBreakers.set(p, new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 60000,
        monitoringWindow: 30000,
      }));
    }
  }

  /** Get the circuit breaker for a specific provider. */
  getCircuitBreaker(provider: AiProvider): CircuitBreaker | undefined {
    return this.circuitBreakers.get(provider);
  }

  setProvider(provider: AiProvider, apiKey?: string, model?: string): void {
    this.currentProvider = provider;
    if (apiKey) {
      this.currentApiKey = apiKey;
    }
    
    if (model) {
      switch (provider) {
        case 'groq':
          this.groqService.setModel(model);
          break;
        case 'openrouter':
          this.openRouterService.setModel(model);
          break;
        case 'deepseek':
          this.deepSeekService.setModel(model);
          break;
        case 'together':
          this.togetherService.setModel(model);
          break;
        case 'novita':
          this.novitaService.setModel(model);
          break;
      }
    } else {
      const defaultModel = this.getDefaultModel(provider);
      switch (provider) {
        case 'groq':
          this.groqService.setModel(defaultModel);
          break;
        case 'openrouter':
          this.openRouterService.setModel(defaultModel);
          break;
        case 'deepseek':
          this.deepSeekService.setModel(defaultModel);
          break;
        case 'together':
          this.togetherService.setModel(defaultModel);
          break;
        case 'novita':
          this.novitaService.setModel(defaultModel);
          break;
      }
    }
  }

  private getDefaultModel(provider: AiProvider): string {
    const defaults: Record<AiProvider, string> = {
      claude: 'claude-sonnet-4-20250514',
      groq: 'llama-3.3-70b-versatile',
      openai: 'gpt-4o-mini',
      gemini: 'gemini-1.5-flash',
      openrouter: 'deepseek/deepseek-chat',
      deepseek: 'deepseek-chat',
      together: 'meta-llama/Llama-3.3-70B-Instruct',
      novita: 'deepseek/deepseek-chat',
      lepton: 'llama-3.3-70b-instruct',
    };
    return defaults[provider];
  }

  getProvider(): AiProvider {
    return this.currentProvider;
  }

  setApiKey(apiKey: string): void {
    this.currentApiKey = apiKey;
  }

  setModel(model: string): void {
    switch (this.currentProvider) {
      case 'groq':
        this.groqService.setModel(model);
        break;
      case 'openrouter':
        this.openRouterService.setModel(model);
        break;
      case 'deepseek':
        this.deepSeekService.setModel(model);
        break;
      case 'together':
        this.togetherService.setModel(model);
        break;
      case 'novita':
        this.novitaService.setModel(model);
        break;
    }
  }

  supportsVision(): boolean {
    const visionProviders: AiProvider[] = ['claude', 'gemini', 'openai', 'openrouter'];
    return visionProviders.includes(this.currentProvider);
  }

  async execute(options: {
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    signal?: AbortSignal;
    taskType?: string;
    onChunk?: (text: string) => void;
  }): Promise<ApiResult> {
    const cb = this.circuitBreakers.get(this.currentProvider);
    if (cb && cb.getState() === 'open') {
      const stats = cb.getStats();
      const remainingMs = 60000 - (Date.now() - stats.lastStateChangeTime);
      return {
        success: false,
        error: `Service temporarily unavailable (circuit breaker open). Retry in ${Math.ceil(remainingMs / 1000)}s.`,
      };
    }

    let result: ApiResult;
    try {
      switch (this.currentProvider) {
        case 'claude':
          result = await this.claudeService.execute({
            apiKey: this.currentApiKey,
            ...options,
          });
          break;
        case 'groq':
          if (!this.currentApiKey) {
            result = { success: false, error: 'Groq API key is required. Get one free at https://console.groq.com' };
            return result;
          }
          this.groqService.setApiKey(this.currentApiKey);
          result = await this.groqService.execute({ ...options });
          break;
        case 'openrouter':
          if (!this.currentApiKey) {
            result = { success: false, error: 'OpenRouter API key is required. Get one free at https://openrouter.ai/keys' };
            return result;
          }
          this.openRouterService.setApiKey(this.currentApiKey);
          result = await this.openRouterService.execute(options);
          break;
        case 'deepseek':
          if (!this.currentApiKey) {
            result = { success: false, error: 'DeepSeek API key is required. Get one free at https://platform.deepseek.com' };
            return result;
          }
          this.deepSeekService.setApiKey(this.currentApiKey);
          result = await this.deepSeekService.execute(options);
          break;
        case 'together':
          if (!this.currentApiKey) {
            result = { success: false, error: 'Together AI API key is required. Get one free at https://api.together.ai' };
            return result;
          }
          this.togetherService.setApiKey(this.currentApiKey);
          result = await this.togetherService.execute(options);
          break;
        case 'novita':
          if (!this.currentApiKey) {
            result = { success: false, error: 'Novita AI API key is required. Get one free at https://novita.ai' };
            return result;
          }
          this.novitaService.setApiKey(this.currentApiKey);
          result = await this.novitaService.execute(options);
          break;
        default:
          result = { success: false, error: `Provider ${this.currentProvider} not implemented` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      cb?.execute(() => Promise.reject(new Error(msg))).catch(() => {});
      return { success: false, error: msg };
    }

    if (cb) {
      if (result.success) {
        cb.execute(() => Promise.resolve()).catch(() => {});
      } else if (result.error && !result.error.includes('API key')) {
        cb.execute(() => Promise.reject(new Error(result.error))).catch(() => {});
      }
    }

    return result;
  }

  async executeWithRetry(options: {
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    taskType?: string;
    maxRetries?: number;
    onRetryAttempt?: (attempt: number, delay: number, error: string) => void;
    onChunk?: (text: string) => void;
  }): Promise<ApiResult> {
    const cb = this.circuitBreakers.get(this.currentProvider);
    if (cb && cb.getState() === 'open') {
      const stats = cb.getStats();
      const remainingMs = 60000 - (Date.now() - stats.lastStateChangeTime);
      return {
        success: false,
        error: `Service temporarily unavailable (circuit breaker open). Retry in ${Math.ceil(remainingMs / 1000)}s.`,
      };
    }

    let result: ApiResult;
    try {
      switch (this.currentProvider) {
        case 'claude':
          result = await this.claudeService.executeWithRetry({
            apiKey: this.currentApiKey,
            ...options,
          });
          break;
        case 'groq':
          if (!this.currentApiKey) {
            return { success: false, error: 'Groq API key is required. Get one free at https://console.groq.com' };
          }
          this.groqService.setApiKey(this.currentApiKey);
          result = await this.groqService.executeWithRetry(options);
          break;
        case 'openrouter':
          if (!this.currentApiKey) {
            return { success: false, error: 'OpenRouter API key is required. Get one free at https://openrouter.ai/keys' };
          }
          this.openRouterService.setApiKey(this.currentApiKey);
          result = await this.openRouterService.executeWithRetry(options);
          break;
        case 'deepseek':
          if (!this.currentApiKey) {
            return { success: false, error: 'DeepSeek API key is required. Get one free at https://platform.deepseek.com' };
          }
          this.deepSeekService.setApiKey(this.currentApiKey);
          result = await this.deepSeekService.executeWithRetry(options);
          break;
        case 'together':
          if (!this.currentApiKey) {
            return { success: false, error: 'Together AI API key is required. Get one free at https://api.together.ai' };
          }
          this.togetherService.setApiKey(this.currentApiKey);
          result = await this.togetherService.executeWithRetry(options);
          break;
        case 'novita':
          if (!this.currentApiKey) {
            return { success: false, error: 'Novita AI API key is required. Get one free at https://novita.ai' };
          }
          this.novitaService.setApiKey(this.currentApiKey);
          result = await this.novitaService.executeWithRetry(options);
          break;
        default:
          result = { success: false, error: `Provider ${this.currentProvider} not implemented` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      cb?.execute(() => Promise.reject(new Error(msg))).catch(() => {});
      return { success: false, error: msg };
    }

    if (cb) {
      if (result.success) {
        cb.execute(() => Promise.resolve()).catch(() => {});
      } else if (result.error && !result.error.includes('API key') && !result.error.includes('circuit breaker')) {
        cb.execute(() => Promise.reject(new Error(result.error))).catch(() => {});
      }
    }

    return result;
  }

  abort(): void {
    this.claudeService.abort();
    this.groqService.abort();
    this.openRouterService.abort();
    this.deepSeekService.abort();
    this.togetherService.abort();
    this.novitaService.abort();
  }
}

export function createUnifiedAiService(): UnifiedAiService {
  return new UnifiedAiServiceImpl();
}
