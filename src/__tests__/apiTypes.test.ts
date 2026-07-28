import { describe, it, expect } from 'vitest';
import { PROVIDER_MODELS, PROVIDER_INFO, getDefaultModelForProvider, getVisionProviders } from '../data/api/types';
import type { AiProvider } from '../data/api/types';

describe('PROVIDER_MODELS', () => {
  it('contains all expected providers', () => {
    const providers = Object.keys(PROVIDER_MODELS) as AiProvider[];
    expect(providers).toContain('claude');
    expect(providers).toContain('groq');
    expect(providers).toContain('openai');
    expect(providers).toContain('gemini');
    expect(providers).toContain('openrouter');
    expect(providers).toContain('deepseek');
    expect(providers).toContain('together');
    expect(providers).toContain('novita');
    expect(providers).toContain('lepton');
  });

  it('each provider has at least one model', () => {
    for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
      expect(models.length, `${provider} should have models`).toBeGreaterThan(0);
    }
  });

  it('each model has required fields', () => {
    for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
      for (const model of models) {
        expect(model.id, `${provider}/${model.id} needs id`).toBeTruthy();
        expect(model.name, `${provider}/${model.id} needs name`).toBeTruthy();
        expect(model.provider, `${provider}/${model.id} provider mismatch`).toBe(provider);
        expect(model.maxTokens, `${provider}/${model.id} needs maxTokens`).toBeGreaterThan(0);
        expect(typeof model.supportsVision, `${provider}/${model.id} needs supportsVision`).toBe('boolean');
      }
    }
  });

  it('exactly one model per provider is marked default', () => {
    for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
      const defaults = models.filter(m => m.default);
      expect(defaults.length, `${provider} should have exactly 1 default model`).toBe(1);
    }
  });
});

describe('getDefaultModelForProvider', () => {
  it('returns default model for each provider', () => {
    const providers = Object.keys(PROVIDER_MODELS) as AiProvider[];
    for (const provider of providers) {
      const model = getDefaultModelForProvider(provider);
      expect(model.default).toBe(true);
      expect(model.provider).toBe(provider);
    }
  });

  it('returns first model if none marked default', () => {
    const model = getDefaultModelForProvider('claude');
    expect(model.id).toBe('claude-sonnet-4-20250514');
  });

  it('throws for unknown provider', () => {
    expect(() => getDefaultModelForProvider('unknown' as AiProvider)).toThrow('No models defined');
  });
});

describe('getVisionProviders', () => {
  it('includes claude', () => {
    expect(getVisionProviders()).toContain('claude');
  });

  it('includes gemini', () => {
    expect(getVisionProviders()).toContain('gemini');
  });

  it('does not include groq (no vision models)', () => {
    expect(getVisionProviders()).not.toContain('groq');
  });

  it('does not include deepseek (no vision models)', () => {
    expect(getVisionProviders()).not.toContain('deepseek');
  });
});

describe('PROVIDER_INFO', () => {
  it('has entries for all providers', () => {
    const providers = Object.keys(PROVIDER_MODELS) as AiProvider[];
    for (const provider of providers) {
      const info = PROVIDER_INFO[provider];
      expect(info, `${provider} should have info`).toBeDefined();
      expect(info.name).toBeTruthy();
      expect(info.apiUrl).toBeTruthy();
      expect(info.docsUrl).toBeTruthy();
      expect(typeof info.free).toBe('boolean');
      expect(info.authType).toBeTruthy();
    }
  });
});
