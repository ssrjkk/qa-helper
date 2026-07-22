import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Onboarding, hasSeenOnboarding } from './Onboarding';
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
import { useShallow } from 'zustand/react/shallow';

type UseDatabaseReturn = ReturnType<typeof useDatabase>;

interface AppContentProps {
  db: UseDatabaseReturn;
}

export function AppContent({ db }: AppContentProps) {
  const {
    output, setError, setApiKeyValid, apiKey, showApiKeyInput,
    setShowApiKeyInput, setSelectedProject, currentMemory, apiKeyValid,
    memoryEntries, selectedTask, setSelectedTask, context, setContext,
    isLoading, error, sessions, agentSteps, mode, setMode,
  } = useAppStore(useShallow((s) => ({
    output: s.output,
    setError: s.setError,
    setApiKeyValid: s.setApiKeyValid,
    apiKey: s.apiKey,
    showApiKeyInput: s.showApiKeyInput,
    setShowApiKeyInput: s.setShowApiKeyInput,
    setSelectedProject: s.setSelectedProject,
    currentMemory: s.currentMemory,
    apiKeyValid: s.apiKeyValid,
    memoryEntries: s.memoryEntries,
    selectedTask: s.selectedTask,
    setSelectedTask: s.setSelectedTask,
    context: s.context,
    setContext: s.setContext,
    isLoading: s.isLoading,
    error: s.error,
    sessions: s.sessions,
    agentSteps: s.agentSteps,
    mode: s.mode,
    setMode: s.setMode,
  })));
  const outputRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const [contextError, setContextError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());

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
    } else if (error === 'No internet connection') {
      setError(null);
    }
  }, [isOnline, setError, error]);

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

  return (
    <>
      <MainLayout sidebar={sidebar} main={main} />
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
