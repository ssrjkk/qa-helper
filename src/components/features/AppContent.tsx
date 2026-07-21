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
import { validateApiKey, copyToClipboard } from '../../lib';
import { SECURITY_CONFIG } from '../../config';
import { useClaudeApi } from '../../presentation';
import { useAppStore } from '../../store/useAppStore';

type UseDatabaseReturn = ReturnType<typeof useDatabase>;

interface AppContentProps {
  db: UseDatabaseReturn;
}

export function AppContent({ db }: AppContentProps) {
  const output = useAppStore((s) => s.output);
  const setError = useAppStore((s) => s.setError);
  const setApiKeyValid = useAppStore((s) => s.setApiKeyValid);
  const apiKey = useAppStore((s) => s.apiKey);
  const showApiKeyInput = useAppStore((s) => s.showApiKeyInput);
  const setShowApiKeyInput = useAppStore((s) => s.setShowApiKeyInput);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const currentMemory = useAppStore((s) => s.currentMemory);
  const apiKeyValid = useAppStore((s) => s.apiKeyValid);
  const memoryEntries = useAppStore((s) => s.memoryEntries);
  const selectedTask = useAppStore((s) => s.selectedTask);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const context = useAppStore((s) => s.context);
  const setContext = useAppStore((s) => s.setContext);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.error);
  const sessions = useAppStore((s) => s.sessions);
  const agentSteps = useAppStore((s) => s.agentSteps);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
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
        action: () => copyToClipboard(output),
        description: 'Copy output',
      },
      {
        key: 'Escape',
        action: () => setShowApiKeyInput(false),
        description: 'Close modal',
      },
      {
        key: 't',
        modifiers: ['meta', 'ctrl'],
        action: toggleTheme,
        description: 'Toggle theme',
      },
    ],
    !isLoading,
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
      onSelectProject={setSelectedProject}
      onCreateProject={handleCreateProject}
      onDeleteProject={db.deleteProject}
      onSaveMemory={handleSaveMemory}
      currentMemory={currentMemory}
      rateLimitInfo={rateLimitInfo}
      apiKeyValid={apiKeyValid}
      onSetApiKey={() => setShowApiKeyInput(true)}
      isOnline={isOnline}
      isDbReady={db.isDbReady}
      memoryEntries={memoryEntries}
      onAddMemoryEntry={handleAddEntry}
      onDeleteMemoryEntry={handleDeleteEntry}
      onUpdateMemoryEntry={handleUpdateEntry}
      onSync={handleSync}
      onExportProject={handleExportProject}
      onImportProject={handleImportProject}
    />
  );

  const main = (
    <MainContent
      selectedTask={selectedTask}
      onSelectTask={setSelectedTask}
      context={context}
      onContextChange={setContext}
      output={output}
      loading={isLoading}
      error={error || db.error}
      maxContextLength={SECURITY_CONFIG.maxContextLength}
      apiKeyValid={apiKeyValid}
      onExecute={handleExecute}
      onReset={handleReset}
      onCopy={() => copyToClipboard(output)}
      contextError={contextError}
      onContextError={setContextError}
      outputRef={outputRef}
      sessions={sessions}
      onLoadSession={handleLoadSession}
      onClearHistory={() => selectedProject && clearConversationHistory(selectedProject)}
      agentSteps={agentSteps}
      agentMode={mode === 'agent'}
      codebaseConnected={!!codebaseProvider}
      onModeChange={setMode}
      codebaseProvider={codebaseProvider}
      onCodebaseConnect={handleConnect}
      onCodebaseDisconnect={handleDisconnect}
    />
  );

  return <MainLayout sidebar={sidebar} main={main} />;
}
