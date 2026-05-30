import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cloudSync, type SyncStatus, type CloudConfig } from '../../lib/cloudSync';
import { GlassCard } from '../ui';

interface CloudSyncProps {
  onSync: () => Promise<void>;
  onImport: (data: { projects: any[]; memoryEntries: any[] }) => void;
  projectsCount: number;
  canSync: boolean;
}

export function CloudSync({ onSync, onImport, projectsCount, canSync }: CloudSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SyncStatus>(cloudSync.getStatus());
  const [config, setConfig] = useState<CloudConfig>(cloudSync.getConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    const unsubscribe = cloudSync.onStatusChange(setStatus);
    return () => { unsubscribe(); };
  }, []);

  const handleSaveConfig = async () => {
    await cloudSync.configure(config);
    setShowConfig(false);
  };

  const handleSync = async () => {
    await onSync();
  };

  const handleGenerateLink = async () => {
    const link = cloudSync.generateShareLink([], []);
    setShareLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  const handleImport = () => {
    try {
      const data = cloudSync.parseShareLink(importData);
      if (data) {
        onImport(data);
        setImportData('');
        setImportError('');
      } else {
        setImportError('Invalid share link');
      }
    } catch {
      setImportError('Invalid format');
    }
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">☁️</span>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-200">Cloud Sync</p>
            <p className="text-xs text-gray-500">
              {status.status === 'synced' && `Last: ${formatLastSync(status.lastSync)}`}
              {status.status === 'syncing' && 'Syncing...'}
              {status.status === 'error' && status.error}
              {status.status === 'idle' && 'Not synced'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status.status === 'synced' && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          )}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="text-gray-400"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Provider: <span className="text-indigo-400">{config.provider}</span></p>
                  <p className="text-xs text-gray-500">{projectsCount} projects</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="px-3 py-1.5 text-xs bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={!canSync || status.status === 'syncing'}
                    className="px-3 py-1.5 text-xs bg-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/50 transition-colors disabled:opacity-50"
                  >
                    {status.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showConfig && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-3 border-t border-white/10"
                  >
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Provider</label>
                      <select
                        value={config.provider}
                        onChange={e => setConfig({ ...config, provider: e.target.value as CloudConfig['provider'] })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 outline-none"
                      >
                        <option value="local">Local Storage (Free)</option>
                        <option value="firebase">Firebase</option>
                        <option value="supabase">Supabase</option>
                      </select>
                    </div>

                    {config.provider !== 'local' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">API URL</label>
                          <input
                            type="text"
                            value={config.url || ''}
                            onChange={e => setConfig({ ...config, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">API Key</label>
                          <input
                            type="password"
                            value={config.apiKey || ''}
                            onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                            placeholder="..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={handleSaveConfig}
                      className="w-full px-4 py-2 bg-indigo-500/30 text-indigo-300 rounded-lg text-sm hover:bg-indigo-500/50 transition-colors"
                    >
                      Save Configuration
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-400 mb-2">Share Project</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateLink}
                    className="px-3 py-2 text-xs bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Generate Link
                  </button>
                </div>
                {shareLink && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 text-xs bg-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/50"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-400 mb-2">Import from Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importData}
                    onChange={e => { setImportData(e.target.value); setImportError(''); }}
                    placeholder="Paste shared link..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    className="px-4 py-2 bg-emerald-500/30 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/50 transition-colors disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
                {importError && (
                  <p className="text-xs text-red-400 mt-1">{importError}</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
