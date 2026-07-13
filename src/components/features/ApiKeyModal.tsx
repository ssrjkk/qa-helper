import { useState } from 'react';
import { motion } from 'framer-motion';
import { saveApiKey } from '../../lib';
import { useAppStore } from '../../store/useAppStore';
import { PROVIDER_INFO, type AiProvider } from '../../data/api/types';

interface ApiKeyModalProps {
  onClose: () => void;
  provider?: AiProvider;
}

export function ApiKeyModal({ onClose, provider = 'claude' }: ApiKeyModalProps) {
  const store = useAppStore();
  const [key, setKey] = useState(store.apiKey || '');
  const [saving, setSaving] = useState(false);
  const providerInfo = PROVIDER_INFO[provider];

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      store.setApiKey(key);
      await saveApiKey(key);
      store.setShowApiKeyInput(false);
    } catch (err) {
      console.error('Failed to save API key:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-2">
          API Key — {providerInfo.name}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {providerInfo.free ? 'Free tier available' : 'Paid'} · Get your key at{' '}
          <a
            href={providerInfo.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            {new URL(providerInfo.docsUrl).hostname}
          </a>
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Paste your API key..."
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !key.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
