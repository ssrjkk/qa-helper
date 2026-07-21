import { GenericApiService } from './GenericApiService';

interface TogetherConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export class TogetherApiService extends GenericApiService {
  constructor(config: TogetherConfig) {
    super({ ...config, apiUrl: 'https://api.together.xyz/v1/chat/completions', providerName: 'Together AI', temperature: 0.7 });
  }
}
