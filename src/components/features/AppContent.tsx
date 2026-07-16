import { useEffect, useCallback, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { MainLayout } from '../layout/MainLayout';
import { useTheme, useKeyboardShortcuts } from '../../hooks';
import { useDatabase } from '../../lib/useDatabase';
import { validateApiKey, sanitizeInput } from '../../lib';
import { cloudSync } from '../../lib/cloudSync';
import { QA_SYSTEM_PROMPT, SCREENSHOT_SYSTEM_PROMPT, buildPrompt, SECURITY_CONFIG } from '../../config';
import { useClaudeApi, useUseCases } from '../../presentation';
import { useAppStore } from '../../store/useAppStore';
import { QaAgent } from '../../data/agent';
import type { CodebaseProvider } from '../../data/codebase/CodebaseProvider';
import type { Project } from '../../types';
import type { MemoryEntry } from '../../types/memory';

type UseDatabaseReturn = ReturnType<typeof useDatabase>;

interface AppContentProps {
  db: UseDatabaseReturn;
}

export function AppContent({ db }: AppContentProps) {
  const store = useAppStore();
  const outputRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [contextError, setContextError] = useState<string | null>(null);
  const [codebaseProvider, setCodebaseProvider] = useState<CodebaseProvider | null>(null);
  const agentRef = useRef<QaAgent | null>(null);

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
    deleteMemoryEntry,
  } = db;

  const { execute: executeApi, abort: abortApi, rateLimitInfo } = useClaudeApi();
  const { aiService } = useUseCases();

  const handleExecuteRef = useRef<(() => Promise<void>) | null>(null);

  useKeyboardShortcuts(
    [
      {
        key: 'Enter',
        modifiers: ['meta', 'ctrl'],
        action: () => handleExecuteRef.current?.(),
        description: 'Execute',
      },
      {
        key: 'c',
        modifiers: ['meta', 'ctrl', 'shift'],
        action: () => navigator.clipboard.writeText(store.output),
        description: 'Copy output',
      },
      {
        key: 'Escape',
        action: () => store.setShowApiKeyInput(false),
        description: 'Close modal',
      },
      {
        key: 't',
        modifiers: ['meta', 'ctrl'],
        action: toggleTheme,
        description: 'Toggle theme',
      },
    ],
    !store.isLoading,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      store.setError('No internet connection');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [store]);

  useEffect(() => {
    const validation = validateApiKey(store.apiKey);
    store.setApiKeyValid(validation.valid);
    if (!validation.valid && validation.error && !store.showApiKeyInput) {
      store.setError(validation.error);
    }
  }, [store.apiKey, store.showApiKeyInput, store]);

  useEffect(() => {
    if (!selectedProject) {
      store.setCurrentMemory('');
      return;
    }
    const project = getProject(selectedProject);
    store.setCurrentMemory(project?.memory || '');
  }, [selectedProject, getProject, store]);

  useEffect(() => {
    if (!selectedProject) {
      store.setSessions([]);
      return;
    }
    const recentSessions = getRecentSessions(selectedProject, 50);
    store.setSessions(recentSessions);
  }, [selectedProject, store.output, getRecentSessions, store]);

  useEffect(() => {
    if (!selectedProject) {
      store.setMemoryEntries([]);
      return;
    }
    const entries = getMemoryEntries(selectedProject);
    store.setMemoryEntries(entries);
  }, [selectedProject, getMemoryEntries, store]);

  const handleLoadSession = useCallback(
    (session: { task_type: string; context: string; output: string }) => {
      store.setSelectedTask(session.task_type);
      store.setContext(session.context);
      store.setOutput(session.output);
    },
    [store],
  );

  const debouncedSaveRef = useRef<((projectId: number, memory: string) => void) | null>(null);
  if (!debouncedSaveRef.current) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    debouncedSaveRef.current = (projectId: number, memory: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        updateProjectMemory(projectId, memory);
      }, 1000);
    };
  }

  const handleSaveMemory = useCallback(
    (memory: string) => {
      if (!selectedProject) return;
      store.setCurrentMemory(memory);
      debouncedSaveRef.current?.(selectedProject, memory);
    },
    [selectedProject, store],
  );

  const handleCreateProject = useCallback(
    (name: string) => {
      const id = createProject(sanitizeInput(name));
      if (id !== undefined && id > 0) {
        store.setSelectedProject(id);
      }
    },
    [createProject, store],
  );

  const handleCodebaseConnect = useCallback((provider: CodebaseProvider) => {
    setCodebaseProvider(provider);
    store.setCodebaseLoaded(true);
  }, [store]);

  const handleCodebaseDisconnect = useCallback(() => {
    setCodebaseProvider(null);
    store.setCodebaseLoaded(false);
    agentRef.current = null;
  }, [store]);

  const handleExecute = useCallback(async () => {
    if (!store.selectedTask || !store.apiKey) return;

    if (store.mode === 'agent' && codebaseProvider) {
      store.setIsLoading(true);
      store.setError(null);
      store.setOutput('');
      store.setAgentSteps([]);

      const agent = new QaAgent(codebaseProvider, aiService);
      agentRef.current = agent;

      try {
        const result = await agent.run(store.context, {
          onChunk: (chunk) => {
            store.setOutput((prev) => prev + chunk);
          },
          onStep: (step) => {
            store.addAgentStep(step);
          },
        });

        if (result.output) {
          store.setOutput(result.output);
          if (selectedProject && store.selectedTask) {
            createTask({
              projectId: selectedProject,
              taskType: store.selectedTask,
              context: store.context,
              output: result.output,
            });
            store.addSession({
              task_type: store.selectedTask,
              context: store.context,
              output: result.output,
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        store.setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        store.setIsLoading(false);
        agentRef.current = null;
      }
      return;
    }

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
        screenshotBase64: store.screenshotBase64,
        onChunk: (chunk) => {
          store.setOutput((prev) => prev + chunk);
        },
      });

      if (result.success && result.output) {
        store.setOutput(result.output);
        if (selectedProject && store.selectedTask) {
          createTask({
            projectId: selectedProject,
            taskType: store.selectedTask,
            context: store.context,
            output: result.output,
          });
          store.addSession({
            task_type: store.selectedTask,
            context: store.context,
            output: result.output,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      store.setIsLoading(false);
    }
  }, [store, selectedProject, executeApi, getProject, createTask, codebaseProvider, aiService]);

  useEffect(() => {
    handleExecuteRef.current = handleExecute;
  }, [handleExecute]);

  const handleReset = useCallback(() => {
    agentRef.current?.abort();
    abortApi();
    store.resetTask();
    setContextError(null);
  }, [abortApi, store]);

  const handleSync = useCallback(async () => {
    await cloudSync.syncToCloud(projects, store.memoryEntries);
  }, [projects, store.memoryEntries]);

  const handleExportProject = useCallback(
    (project: Project) => {
      return JSON.stringify({ project, memoryEntries: store.memoryEntries }, null, 2);
    },
    [store.memoryEntries],
  );

  const handleImportProject = useCallback(async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      console.log('Importing project:', parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleAddMemoryEntry = useCallback(
    (entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>) => {
      if (!selectedProject) return;
      const id = createMemoryEntry(entry);
      if (id > 0) {
        const entries = getMemoryEntries(selectedProject);
        store.setMemoryEntries(entries);
      }
    },
    [createMemoryEntry, getMemoryEntries, selectedProject, store],
  );

  const handleDeleteMemoryEntry = useCallback(
    (id: number) => {
      deleteMemoryEntry(id);
      store.removeMemoryEntry(id);
    },
    [deleteMemoryEntry, store],
  );

  const handleUpdateMemoryEntry = useCallback(
    (id: number, updates: Partial<MemoryEntry>) => {
      updateMemoryEntry(id, updates);
      store.updateMemoryEntry(id, updates);
    },
    [updateMemoryEntry, store],
  );

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
      onImportSync={(data) => {
        if (data?.projects) {
          console.log('Importing synced projects:', data.projects.length);
        }
      }}
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
      agentSteps={store.agentSteps}
      agentMode={store.mode === 'agent'}
      codebaseConnected={!!codebaseProvider}
      onModeChange={store.setMode}
      codebaseProvider={codebaseProvider}
      onCodebaseConnect={handleCodebaseConnect}
      onCodebaseDisconnect={handleCodebaseDisconnect}
    />
  );

  return <MainLayout sidebar={sidebar} main={main} />;
}
