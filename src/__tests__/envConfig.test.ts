import { describe, it, expect } from 'vitest';

describe('envConfig', () => {
  it('returns a valid environment', async () => {
    const { envConfig } = await import('../lib/envConfig');
    expect(['development', 'staging', 'production']).toContain(envConfig.environment);
  });

  it('has all feature flags defined', async () => {
    const { envConfig } = await import('../lib/envConfig');
    expect(typeof envConfig.features.enableCloudSync).toBe('boolean');
    expect(typeof envConfig.features.enableAgentMode).toBe('boolean');
    expect(typeof envConfig.features.enableMetrics).toBe('boolean');
    expect(typeof envConfig.features.enableAutoBackup).toBe('boolean');
    expect(typeof envConfig.features.enableExport).toBe('boolean');
    expect(typeof envConfig.features.enableCodebasePanel).toBe('boolean');
    expect(typeof envConfig.features.enableMemorySystem).toBe('boolean');
  });

  it('isFeatureEnabled returns boolean', async () => {
    const { isFeatureEnabled } = await import('../lib/envConfig');
    expect(typeof isFeatureEnabled('enableCloudSync')).toBe('boolean');
  });

  it('api config has reasonable values', async () => {
    const { envConfig } = await import('../lib/envConfig');
    expect(envConfig.api.timeout).toBeGreaterThan(0);
    expect(envConfig.api.maxRetries).toBeGreaterThanOrEqual(0);
  });

  it('monitoring config has valid sampleRate', async () => {
    const { envConfig } = await import('../lib/envConfig');
    expect(envConfig.monitoring.sampleRate).toBeGreaterThanOrEqual(0);
    expect(envConfig.monitoring.sampleRate).toBeLessThanOrEqual(1);
  });
});
