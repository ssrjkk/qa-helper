import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, RippleButton } from './index';
import type { AiProvider, AiModel } from '../../data/api/types';
import { PROVIDER_INFO, PROVIDER_MODELS } from '../../data/api/types';

interface ProviderSettingsProps {
  currentProvider: AiProvider;
  apiKeys: Record<AiProvider, string>;
  currentModel: string;
  onProviderChange: (provider: AiProvider) => void;
  onApiKeyChange: (provider: AiProvider, apiKey: string) => void;
  onModelChange: (model: string) => void;
}

export function ProviderSettings({
  currentProvider,
  apiKeys,
  currentModel,
  onProviderChange,
  onApiKeyChange,
  onModelChange,
}: ProviderSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const freeProviders = (Object.entries(PROVIDER_INFO) as [AiProvider, typeof PROVIDER_INFO.claude][])
    .filter(([, info]) => info.free)
    .map(([key]) => key);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      onApiKeyChange(currentProvider, tempApiKey.trim());
      setTempApiKey('');
    }
  };

  const models = PROVIDER_MODELS[currentProvider] || [];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
          currentProvider === 'groq'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : currentProvider === 'gemini'
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        <span className="text-base">
          {currentProvider === 'groq' ? '🚀' : currentProvider === 'gemini' ? '💎' : '🤖'}
        </span>
        <span className="hidden sm:inline">{PROVIDER_INFO[currentProvider].name}</span>
        <span className="text-xs opacity-60">▾</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 z-50"
            >
              <GlassCard className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-200">AI Provider</h4>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(PROVIDER_INFO) as [AiProvider, typeof PROVIDER_INFO.claude][]).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => onProviderChange(key)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        currentProvider === key
                          ? 'bg-indigo-500/30 border border-indigo-500/50'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-200">
                        {info.name}
                        {info.free && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded">
                            Free
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {models.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Model</label>
                    <select
                      value={currentModel}
                      onChange={e => onModelChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 outline-none focus:border-indigo-500/50"
                    >
                      {models.map((model: AiModel) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                          {model.description && ` - ${model.description}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    API Key for {PROVIDER_INFO[currentProvider].name}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={tempApiKey}
                      onChange={e => setTempApiKey(e.target.value)}
                      placeholder={apiKeys[currentProvider] ? '•••••••••' : 'Enter API key...'}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50"
                    />
                    <RippleButton
                      onClick={handleSaveApiKey}
                      disabled={!tempApiKey.trim()}
                      className="!px-3 !py-2 !text-xs"
                    >
                      Save
                    </RippleButton>
                  </div>
                  {apiKeys[currentProvider] && (
                    <p className="mt-1 text-xs text-emerald-400">
                      ✓ API key configured
                    </p>
                  )}
                  {!apiKeys[currentProvider] && (
                    <a
                      href={PROVIDER_INFO[currentProvider].docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 inline-block"
                    >
                      Get API key →
                    </a>
                  )}
                </div>

                {freeProviders.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-gray-500">
                      Free options: {freeProviders.map(k => PROVIDER_INFO[k].name).join(', ')}
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
