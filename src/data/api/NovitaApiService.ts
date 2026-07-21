import { GenericApiService } from './GenericApiService';

interface NovitaConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export class NovitaApiService extends GenericApiService {
  constructor(config: NovitaConfig) {
    super({ ...config, apiUrl: 'https://api.novita.ai/v3/openai/chat/completions', providerName: 'Novita AI', temperature: 0.7 });
  }
}
