import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { MainLayout } from '../layout/MainLayout';
import { useTheme, useKeyboardShortcuts } from '../../hooks';
import { useDatabase } from '../../hooks/useDatabase';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useProjectData } from '../../hooks/useProjectData';
import { useExecution } from '../../hooks/useExecution';
import { useCodebase } from '../../hooks/useCodebase';
import { useMemoryEntries } from '../../hooks/useMemoryEntries';
import { validateApiKey } from '../../lib';
import { SECURITY_CONFIG } from '../../config';
import { useClaudeApi } from '../../presentation';
import { useAppStore } from '../../store/useAppStore';

type UseDatabaseReturn = ReturnType<typeof useDatabase>;

interface AppContentProps {
  db: UseDatabaseReturn;
}

export function AppContent({ db }: AppContentProps) {
  const store = useAppStore();
  const setError = useAppStore((s) => s.setError);
  const setApiKeyValid = useAppStore((s) => s.setApiKeyValid);
  const apiKey = useAppStore((s) => s.apiKey);
  const showApiKeyInput = useAppStore((s) => s.showApiKeyInput);
  const outputRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const [contextError, setContextError] = useState<string | null>(null);

  const {
    projects,
    selectedProject,
    handleSaveMemory,
    handleCreateProject,
    handleLoadSession,
    clearConversationHistory,
  } = useProjectData(db);

  const { codebaseProvider, handleConnect, handleDisconnect } = useCodebase();

  const { handleExecute, handleReset } = useExecution(selectedProject, codebaseProvider, db);

  const {
    handleAddEntry,
    handleDeleteEntry,
    handleUpdateEntry,
    handleSync,
    handleExportProject,
    handleImportProject,
  } = useMemoryEntries(selectedProject, db);

  const { rateLimitInfo } = useClaudeApi();

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
        action: () => navigator.clipboard.writeText(store.output).catch(() => {}),
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
    if (!isOnline) {
      setError('No internet connection');
    }
  }, [isOnline, setError]);

  useEffect(() => {
    const validation = validateApiKey(apiKey);
    setApiKeyValid(validation.valid);
    if (!validation.valid && validation.error && !showApiKeyInput) {
      setError(validation.error);
    }
  }, [apiKey, showApiKeyInput, setApiKeyValid, setError]);

  useEffect(() => {
    handleExecuteRef.current = handleExecute;
  }, [handleExecute]);

  const sidebar = (
    <Sidebar
      projects={projects}
      selectedProject={selectedProject}
      onSelectProject={store.setSelectedProject}
      onCreateProject={handleCreateProject}
      onDeleteProject={db.deleteProject}
      onSaveMemory={handleSaveMemory}
      currentMemory={store.currentMemory}
      rateLimitInfo={rateLimitInfo}
      apiKeyValid={store.apiKeyValid}
      onSetApiKey={() => store.setShowApiKeyInput(true)}
      isOnline={isOnline}
      isDbReady={db.isDbReady}
      memoryEntries={store.memoryEntries}
      onAddMemoryEntry={handleAddEntry}
      onDeleteMemoryEntry={handleDeleteEntry}
      onUpdateMemoryEntry={handleUpdateEntry}
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
      onCopy={() => navigator.clipboard.writeText(store.output).catch(() => {})}
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
      onCodebaseConnect={handleConnect}
      onCodebaseDisconnect={handleDisconnect}
    />
  );

  return <MainLayout sidebar={sidebar} main={main} />;
}
