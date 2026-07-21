import { GenericApiService } from './GenericApiService';

const DEFAULT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  apiUrl?: string;
}

export class OpenRouterApiService extends GenericApiService {
  constructor(config: OpenRouterConfig) {
    super({
      ...config,
      apiUrl: config.apiUrl || DEFAULT_API_URL,
      providerName: 'OpenRouter',
      extraHeaders: {
        'HTTP-Referer': 'https://qa-copilot.ssrjkk.dev',
        'X-Title': 'QA Copilot BY ssrjkk',
      },
    });
  }
}
