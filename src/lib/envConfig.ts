/**
 * Environment configuration with feature flags
 * @module envConfig
 * @author ssrjkk
 */

export type Environment = 'development' | 'staging' | 'production';

interface FeatureFlags {
  enableCloudSync: boolean;
  enableAgentMode: boolean;
  enableMetrics: boolean;
  enableAutoBackup: boolean;
  enableExport: boolean;
  enableCodebasePanel: boolean;
  enableMemorySystem: boolean;
}

interface EnvConfig {
  environment: Environment;
  features: FeatureFlags;
  api: {
    timeout: number;
    maxRetries: number;
  };
  monitoring: {
    enabled: boolean;
    sampleRate: number;
  };
}

function getEnvironment(): Environment {
  if (import.meta.env.DEV) return 'development';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('staging') || host.includes('stg')) return 'staging';
  }
  return 'production';
}

const env = getEnvironment();

const configs: Record<Environment, EnvConfig> = {
  development: {
    environment: 'development',
    features: {
      enableCloudSync: true,
      enableAgentMode: true,
      enableMetrics: true,
      enableAutoBackup: false,
      enableExport: true,
      enableCodebasePanel: true,
      enableMemorySystem: true,
    },
    api: { timeout: 60000, maxRetries: 1 },
    monitoring: { enabled: false, sampleRate: 1 },
  },
  staging: {
    environment: 'staging',
    features: {
      enableCloudSync: true,
      enableAgentMode: true,
      enableMetrics: true,
      enableAutoBackup: true,
      enableExport: true,
      enableCodebasePanel: true,
      enableMemorySystem: true,
    },
    api: { timeout: 30000, maxRetries: 2 },
    monitoring: { enabled: true, sampleRate: 0.5 },
  },
  production: {
    environment: 'production',
    features: {
      enableCloudSync: true,
      enableAgentMode: true,
      enableMetrics: true,
      enableAutoBackup: true,
      enableExport: true,
      enableCodebasePanel: true,
      enableMemorySystem: true,
    },
    api: { timeout: 30000, maxRetries: 3 },
    monitoring: { enabled: true, sampleRate: 0.1 },
  },
};

export const envConfig: EnvConfig = configs[env];

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return envConfig.features[flag];
}

export function isDevelopment(): boolean {
  return envConfig.environment === 'development';
}

export function isProduction(): boolean {
  return envConfig.environment === 'production';
}
