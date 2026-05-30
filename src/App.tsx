import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/features/Sidebar';
import { MainContent } from './components/features/MainContent';
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useTheme, useKeyboardShortcuts } from './hooks';
import { useDatabase } from './lib/useDatabase';
import { validateApiKey, sanitizeInput, debounce, saveApiKey, loadApiKey } from './lib';
import { cloudSync } from './lib/cloudSync';
import { QA_SYSTEM_PROMPT, SCREENSHOT_SYSTEM_PROMPT, buildPrompt, SECURITY_CONFIG } from './config';
import { UseCasesProvider, useClaudeApi } from './presentation';
import { useAppStore } from './store/useAppStore';
import type { Project } from './types';
import type { MemoryEntry } from './types/memory';

function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const store = useAppStore();
  const [key, setKey] = useState(store.apiKey || '');
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
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
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Enter Anthropic API Key</h3>
        <p className="text-sm text-gray-400 mb-4">
          Get your API key from{' '}
          <a href="https://console.anthropic.com/" target="_blank" rel="noopener" className="text-purple-400 hover:underline">
            console.anthropic.com
          </a>
        </p>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-500"
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
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AppContent({ db }: { db: ReturnType<typeof useDatabase> }) {
  const store = useAppStore();
  const outputRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useTheme();
  const handleExecuteRef = useRef<(() => Promise<void>) | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [contextError, setContextError] = useState<string | null>(null);

  const {
    projects,
    selectedProject,
    createProject,
    deleteProject,
    updateProjectMemory,
    getProject,
    createTask,
    getRecentSessions,
    clearConversationHistory,
    getMemoryEntries,
    createMemoryEntry,
    updateMemoryEntry,
    deleteMemoryEntry
  } = db;

  const { execute: executeApi, abort: abortApi, rateLimitInfo } = useClaudeApi();

  useKeyboardShortcuts([
    {
      key: 'Enter',
      modifiers: ['meta', 'ctrl'],
      action: () => handleExecuteRef.current?.(),
      description: 'Execute'
    },
    {
      key: 'c',
      modifiers: ['meta', 'ctrl', 'shift'],
      action: () => navigator.clipboard.writeText(store.output),
      description: 'Copy output'
    },
    {
      key: 'Escape',
      action: () => store.setShowApiKeyInput(false),
      description: 'Close modal'
    },
    {
      key: 't',
      modifiers: ['meta', 'ctrl'],
      action: toggleTheme,
      description: 'Toggle theme'
    }
  ], !store.isLoading);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => { setIsOnline(false); store.setError('No internet connection'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const validation = validateApiKey(store.apiKey);
    store.setApiKeyValid(validation.valid);
    if (!validation.valid && validation.error && !store.showApiKeyInput) {
      store.setError(validation.error);
    }
  }, [store.apiKey, store.showApiKeyInput]);

  useEffect(() => {
    if (!selectedProject) {
      store.setCurrentMemory('');
      return;
    }
    const project = getProject(selectedProject);
    store.setCurrentMemory(project?.memory || '');
  }, [selectedProject, getProject]);

  useEffect(() => {
    if (!selectedProject) {
      store.setSessions([]);
      return;
    }
    const recentSessions = getRecentSessions(selectedProject, 50);
    store.setSessions(recentSessions);
  }, [selectedProject, store.output]);

  useEffect(() => {
    if (!selectedProject) {
      store.setMemoryEntries([]);
      return;
    }
    const entries = getMemoryEntries(selectedProject);
    store.setMemoryEntries(entries);
  }, [selectedProject]);

  const handleLoadSession = useCallback((session: { taskType: string; context: string; output: string }) => {
    store.setSelectedTask(session.taskType);
    store.setContext(session.context);
    store.setOutput(session.output);
  }, []);

  const debouncedSaveMemory = useCallback(
    debounce((projectId: number, memory: string) => {
      updateProjectMemory(projectId, memory);
    }, 1000),
    [updateProjectMemory]
  );

  const handleSaveMemory = useCallback((memory: string) => {
    if (!selectedProject) return;
    store.setCurrentMemory(memory);
    debouncedSaveMemory(selectedProject, memory);
  }, [selectedProject, debouncedSaveMemory]);

  const handleCreateProject = useCallback((name: string) => {
    const id = createProject(sanitizeInput(name));
    if (id !== undefined && id > 0) {
      store.setSelectedProject(id);
    }
  }, [createProject]);

  const handleExecute = useCallback(async () => {
    if (!store.selectedTask || !store.apiKey) return;
    handleExecuteRef.current = handleExecute;
    store.setIsLoading(true);
    store.setError(null);

    let systemPrompt = QA_SYSTEM_PROMPT;
    let userPrompt = store.context;
    
    if (store.selectedTask === 'screenshot_analysis' && store.screenshotBase64) {
      systemPrompt = SCREENSHOT_SYSTEM_PROMPT;
    } else {
      const project = selectedProject ? getProject(selectedProject) : undefined;
      const { system, user } = buildPrompt(store.selectedTask, store.context, project?.memory);
      systemPrompt = system;
      userPrompt = user;
    }

    try {
      const result = await executeApi({
        apiKey: store.apiKey,
        systemPrompt,
        userMessage: userPrompt,
        screenshotBase64: store.screenshotBase64
      });

      if (result.success && result.output) {
        store.setOutput(result.output);
        if (selectedProject && store.selectedTask) {
          createTask({ 
            projectId: selectedProject, 
            taskType: store.selectedTask as any, 
            context: store.context, 
            output: result.output 
          });
          store.addSession({
            taskType: store.selectedTask,
            context: store.context,
            output: result.output,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      store.setError((err as Error).message);
    } finally {
      store.setIsLoading(false);
    }
  }, [store.apiKey, store.selectedTask, store.context, store.screenshotBase64, selectedProject, executeApi, getProject, createTask]);

  const handleReset = useCallback(() => {
    abortApi();
    store.resetTask();
    setContextError(null);
  }, [abortApi]);

  const handleSync = useCallback(async () => {
    await cloudSync.syncToCloud(projects, store.memoryEntries);
  }, [projects, store.memoryEntries]);

  const handleExportProject = useCallback((project: Project) => {
    return JSON.stringify({ project, memoryEntries: store.memoryEntries }, null, 2);
  }, [store.memoryEntries]);

  const handleImportProject = async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      console.log('Importing project:', parsed);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddMemoryEntry = useCallback((entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const id = createMemoryEntry(entry);
    if (id > 0) {
      const entries = getMemoryEntries(selectedProject!);
      store.setMemoryEntries(entries);
    }
  }, [createMemoryEntry, getMemoryEntries, selectedProject]);

  const handleDeleteMemoryEntry = useCallback((id: number) => {
    deleteMemoryEntry(id);
    store.removeMemoryEntry(id);
  }, [deleteMemoryEntry]);

  const handleUpdateMemoryEntry = useCallback((id: number, updates: Partial<MemoryEntry>) => {
    updateMemoryEntry(id, updates);
    store.updateMemoryEntry(id, updates);
  }, [updateMemoryEntry]);

  const sidebar = (
    <Sidebar
      projects={projects}
      selectedProject={selectedProject}
      onSelectProject={store.setSelectedProject}
      onCreateProject={handleCreateProject}
      onDeleteProject={deleteProject}
      onSaveMemory={handleSaveMemory}
      currentMemory={store.currentMemory}
      rateLimitInfo={rateLimitInfo}
      apiKeyValid={store.apiKeyValid}
      onSetApiKey={() => store.setShowApiKeyInput(true)}
      isOnline={isOnline}
      isDbReady={db.isDbReady}
      memoryEntries={store.memoryEntries}
      onAddMemoryEntry={handleAddMemoryEntry}
      onDeleteMemoryEntry={handleDeleteMemoryEntry}
      onUpdateMemoryEntry={handleUpdateMemoryEntry}
      onSync={handleSync}
      onImportSync={() => {}}
      onExportProject={handleExportProject}
      onImportProject={handleImportProject}
      onShareProject={async () => {}}
    />
  );

  const main = (
    <MainContent
      selectedTask={store.selectedTask}
      onSelectTask={store.setSelectedTask}
      context={store.context}
      onContextChange={store.setContext}
      output={store.output}
      loading={store.isLoading}
      error={store.error || db.error}
      maxContextLength={SECURITY_CONFIG.maxContextLength}
      apiKeyValid={store.apiKeyValid}
      onExecute={handleExecute}
      onReset={handleReset}
      onCopy={() => navigator.clipboard.writeText(store.output)}
      contextError={contextError}
      onContextError={setContextError}
      outputRef={outputRef}
      sessions={store.sessions}
      onLoadSession={handleLoadSession}
      onClearHistory={() => selectedProject && clearConversationHistory(selectedProject)}
    />
  );

  return (
    <>
      <MainLayout sidebar={sidebar} main={main} />
      <AnimatePresence>
        {store.showApiKeyInput && (
          <ApiKeyModal onClose={() => store.setShowApiKeyInput(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const store = useAppStore();
  const db = useDatabase();

  useEffect(() => {
    loadApiKey().then(decrypted => {
      if (decrypted) {
        store.setApiKey(decrypted);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:bg-gradient-to-br dark:from-slate-100 dark:via-purple-100 dark:to-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900 dark:from-purple-200/20 dark:via-slate-200/40 dark:to-slate-200" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              QA Copilot BY ssrjkk
            </h1>
            <p className="text-gray-400">AI-Powered QA Assistant</p>
          </motion.header>
          
          {db.isDbReady ? (
            <UseCasesProvider db={db.db} saveDb={db.saveDb}>
              <AppContent db={db} />
            </UseCasesProvider>
          ) : (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
              />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
