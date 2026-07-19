import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cloudSync, type SyncStatus, type CloudConfig } from '../../lib/cloudSync';
import { GlassCard, Accordion, Input, Select, useToast } from '../ui';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { HEIGHT, SPRING } from '../../lib/animations';
import type { Project } from '../../types';
import type { MemoryEntry } from '../../types/memory';

interface CloudSyncProps {
  onSync: () => Promise<void>;
  onImport?: (data: { projects: Project[]; memoryEntries: MemoryEntry[] }) => void;
  projectsCount: number;
  canSync: boolean;
  projects: Project[];
  memoryEntries: MemoryEntry[];
}

export function CloudSync({ onSync, onImport, projectsCount, canSync, projects, memoryEntries }: CloudSyncProps) {
  const [status, setStatus] = useState<SyncStatus>(cloudSync.getStatus());
  const [config, setConfig] = useState<CloudConfig>(cloudSync.getConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  const { addToast } = useToast();
  const reduced = useReducedMotion();

  useEffect(() => {
    const unsubscribe = cloudSync.onStatusChange(setStatus);
    return () => { unsubscribe(); };
  }, []);

  const handleSaveConfig = async () => {
    await cloudSync.configure(config);
    setShowConfig(false);
    addToast('Cloud configuration saved', 'success');
  };

  const handleGenerateLink = async () => {
    const link = cloudSync.generateShareLink(projects, memoryEntries);
    setShareLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    addToast('Link copied to clipboard', 'success');
  };

  const handleImport = () => {
    try {
      const data = cloudSync.parseShareLink(importData);
      if (data && onImport) {
        onImport(data);
        setImportData('');
        setImportError('');
        addToast('Project imported successfully', 'success');
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

  const statusText =
    status.status === 'synced' ? `Last: ${formatLastSync(status.lastSync)}` :
    status.status === 'syncing' ? 'Syncing...' :
    status.status === 'error' ? status.error :
    'Not synced';

  return (
    <Accordion
      icon="☁️"
      title="Cloud Sync"
      subtitle={statusText}
      badge={status.status === 'synced' ? '✓' : undefined}
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
              aria-expanded={showConfig}
              className="px-3 py-1.5 text-xs bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Settings
            </button>
            <button
              onClick={onSync}
              disabled={!canSync || status.status === 'syncing'}
              className="px-3 py-1.5 text-xs bg-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/50 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              {status.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={reduced ? undefined : HEIGHT.initial}
              animate={reduced ? {} : HEIGHT.animate}
              exit={reduced ? {} : HEIGHT.exit}
              transition={SPRING.gentle}
              className="space-y-3 pt-3 border-t border-white/10 overflow-hidden"
            >
              <Select
                label="Provider"
                value={config.provider}
                onChange={e => setConfig({ ...config, provider: e.target.value as CloudConfig['provider'] })}
              >
                <option value="local">Local Storage (Free)</option>
                <option value="firebase">Firebase</option>
                <option value="supabase">Supabase</option>
              </Select>

              {config.provider !== 'local' && (
                <>
                  <Input
                    label="API URL"
                    type="text"
                    value={config.url || ''}
                    onChange={e => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://..."
                  />
                  <Input
                    label="API Key"
                    type="password"
                    value={config.apiKey || ''}
                    onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="..."
                  />
                </>
              )}

              <button
                onClick={handleSaveConfig}
                className="w-full px-4 py-2 bg-indigo-500/30 text-indigo-300 rounded-lg text-sm hover:bg-indigo-500/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
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
              className="px-3 py-2 text-xs bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Generate Link
            </button>
          </div>
          {shareLink && (
            <div className="mt-2 flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="text-xs text-gray-400 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 text-xs bg-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-gray-400 mb-2">Import from Link</p>
          <div className="flex gap-2">
            <Input
              value={importData}
              onChange={e => { setImportData(e.target.value); setImportError(''); }}
              placeholder="Paste shared link..."
              className="flex-1"
            />
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="px-4 py-2 bg-emerald-500/30 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/50 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Import
            </button>
          </div>
          {importError && (
            <p className="text-xs text-red-400 mt-1" role="alert">{importError}</p>
          )}
        </div>
      </GlassCard>
    </Accordion>
  );
}
