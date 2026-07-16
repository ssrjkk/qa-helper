import type { AiProvider, ApiResult } from './types';
import { PROVIDER_MODELS, getDefaultModelForProvider, getVisionProviders } from './types';
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

const VISION_PROVIDERS = getVisionProviders();

function makeDefaultModels(): Map<AiProvider, string> {
  const map = new Map<AiProvider, string>();
  for (const p of Object.keys(PROVIDER_MODELS) as AiProvider[]) {
    map.set(p, getDefaultModelForProvider(p).id);
  }
  return map;
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
    const d = makeDefaultModels();

    this.claudeService = new ClaudeApiService({
      baseUrl: 'https://api.anthropic.com/v1/messages',
      model: d.get('claude')!,
      maxTokens: 8192,
      anthropicVersion: '2023-06-01',
      provider: 'claude',
    });
    this.groqService = new GroqApiService({ apiKey: '', model: d.get('groq')!, maxTokens: 8192 });
    this.openRouterService = new OpenRouterApiService({ apiKey: '', model: d.get('openrouter')!, maxTokens: 8192 });
    this.deepSeekService = new DeepSeekApiService({ apiKey: '', model: d.get('deepseek')!, maxTokens: 8192 });
    this.togetherService = new TogetherApiService({ apiKey: '', model: d.get('together')!, maxTokens: 32768 });
    this.novitaService = new NovitaApiService({ apiKey: '', model: d.get('novita')!, maxTokens: 8192 });

    for (const p of Object.keys(PROVIDER_MODELS) as AiProvider[]) {
      this.circuitBreakers.set(p, new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 60000,
        monitoringWindow: 30000,
      }));
    }
  }

  getCircuitBreaker(provider: AiProvider): CircuitBreaker | undefined {
    return this.circuitBreakers.get(provider);
  }

  private setServiceModel(provider: AiProvider, model: string): void {
    switch (provider) {
      case 'groq': this.groqService.setModel(model); break;
      case 'openrouter': this.openRouterService.setModel(model); break;
      case 'deepseek': this.deepSeekService.setModel(model); break;
      case 'together': this.togetherService.setModel(model); break;
      case 'novita': this.novitaService.setModel(model); break;
    }
  }

  setProvider(provider: AiProvider, apiKey?: string, model?: string): void {
    this.currentProvider = provider;
    if (apiKey) this.currentApiKey = apiKey;
    this.setServiceModel(provider, model ?? getDefaultModelForProvider(provider).id);
  }

  getProvider(): AiProvider {
    return this.currentProvider;
  }

  setApiKey(apiKey: string): void {
    this.currentApiKey = apiKey;
  }

  setModel(model: string): void {
    this.setServiceModel(this.currentProvider, model);
  }

  supportsVision(): boolean {
    return VISION_PROVIDERS.includes(this.currentProvider);
  }

  private checkCircuitBreaker(): ApiResult | null {
    const cb = this.circuitBreakers.get(this.currentProvider);
    if (cb && cb.getState() === 'open') {
      const stats = cb.getStats();
      const remainingMs = 60000 - (Date.now() - stats.lastStateChangeTime);
      return {
        success: false,
        error: `Service temporarily unavailable (circuit breaker open). Retry in ${Math.ceil(remainingMs / 1000)}s.`,
      };
    }
    return null;
  }

  private recordCircuitBreakerResult(result: ApiResult, cb: CircuitBreaker | undefined): void {
    if (!cb) return;
    if (result.success) {
      cb.execute(() => Promise.resolve()).catch(() => {});
    } else if (result.error && !result.error.includes('API key') && !result.error.includes('circuit breaker')) {
      cb.execute(() => Promise.reject(new Error(result.error))).catch(() => {});
    }
  }

  private getApiKeyError(): string | null {
    if (this.currentProvider === 'claude' || this.currentApiKey) return null;
    return `${this.currentProvider} API key is required.`;
  }

  private ensureApiKey(): ApiResult | null {
    const err = this.getApiKeyError();
    return err ? { success: false, error: err } : null;
  }

  private setProviderApiKey(): void {
    if (this.currentProvider === 'claude') return;
    switch (this.currentProvider) {
      case 'groq': this.groqService.setApiKey(this.currentApiKey); break;
      case 'openrouter': this.openRouterService.setApiKey(this.currentApiKey); break;
      case 'deepseek': this.deepSeekService.setApiKey(this.currentApiKey); break;
      case 'together': this.togetherService.setApiKey(this.currentApiKey); break;
      case 'novita': this.novitaService.setApiKey(this.currentApiKey); break;
    }
  }

  private buildExecuteOpts(options: {
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    signal?: AbortSignal;
    taskType?: string;
    onChunk?: (text: string) => void;
  }): Record<string, unknown> {
    return this.currentProvider === 'claude'
      ? { apiKey: this.currentApiKey, ...options }
      : { ...options };
  }

  async execute(options: {
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    signal?: AbortSignal;
    taskType?: string;
    onChunk?: (text: string) => void;
  }): Promise<ApiResult> {
    const cbCheck = this.checkCircuitBreaker();
    if (cbCheck) return cbCheck;

    const keyErr = this.ensureApiKey();
    if (keyErr) return keyErr;

    this.setProviderApiKey();
    const cb = this.circuitBreakers.get(this.currentProvider);
    const opts = this.buildExecuteOpts(options);

    let result: ApiResult;
    try {
      switch (this.currentProvider) {
        case 'claude': result = await this.claudeService.execute(opts as Parameters<ClaudeApiService['execute']>[0]); break;
        case 'groq': result = await this.groqService.execute(opts as Parameters<GroqApiService['execute']>[0]); break;
        case 'openrouter': result = await this.openRouterService.execute(opts as Parameters<OpenRouterApiService['execute']>[0]); break;
        case 'deepseek': result = await this.deepSeekService.execute(opts as Parameters<DeepSeekApiService['execute']>[0]); break;
        case 'together': result = await this.togetherService.execute(opts as Parameters<TogetherApiService['execute']>[0]); break;
        case 'novita': result = await this.novitaService.execute(opts as Parameters<NovitaApiService['execute']>[0]); break;
        default: result = { success: false, error: `Provider ${this.currentProvider} not implemented` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      cb?.execute(() => Promise.reject(new Error(msg))).catch(() => {});
      return { success: false, error: msg };
    }

    this.recordCircuitBreakerResult(result, cb);
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
    const cbCheck = this.checkCircuitBreaker();
    if (cbCheck) return cbCheck;

    const keyErr = this.ensureApiKey();
    if (keyErr) return keyErr;

    this.setProviderApiKey();
    const cb = this.circuitBreakers.get(this.currentProvider);
    const opts = this.buildExecuteOpts(options);

    let result: ApiResult;
    try {
      switch (this.currentProvider) {
        case 'claude': result = await this.claudeService.executeWithRetry(opts as Parameters<ClaudeApiService['executeWithRetry']>[0]); break;
        case 'groq': result = await this.groqService.executeWithRetry(opts as Parameters<GroqApiService['executeWithRetry']>[0]); break;
        case 'openrouter': result = await this.openRouterService.executeWithRetry(opts as Parameters<OpenRouterApiService['executeWithRetry']>[0]); break;
        case 'deepseek': result = await this.deepSeekService.executeWithRetry(opts as Parameters<DeepSeekApiService['executeWithRetry']>[0]); break;
        case 'together': result = await this.togetherService.executeWithRetry(opts as Parameters<TogetherApiService['executeWithRetry']>[0]); break;
        case 'novita': result = await this.novitaService.executeWithRetry(opts as Parameters<NovitaApiService['executeWithRetry']>[0]); break;
        default: result = { success: false, error: `Provider ${this.currentProvider} not implemented` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      cb?.execute(() => Promise.reject(new Error(msg))).catch(() => {});
      return { success: false, error: msg };
    }

    this.recordCircuitBreakerResult(result, cb);
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
