import { GenericApiService } from './GenericApiService';

interface DeepSeekConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export class DeepSeekApiService extends GenericApiService {
  constructor(config: DeepSeekConfig) {
    super({ ...config, apiUrl: 'https://api.deepseek.com/v1/chat/completions', providerName: 'DeepSeek' });
  }
}
