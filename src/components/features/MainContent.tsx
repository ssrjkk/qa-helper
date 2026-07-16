import { useState, RefObject } from 'react';
import { motion } from 'framer-motion';
import { TaskSelector } from './TaskSelector';
import { ScreenshotUploader } from './ScreenshotUploader';
import { LazyChatArea, LazyCodebasePanel, LazySessionHistory, LazySuspense } from './LazyComponents';
import type { TabType } from '../../types';
import type { AgentStep } from '../../data/agent/types';
import type { CodebaseProvider } from '../../data/codebase/CodebaseProvider';

interface Session {
  task_type: string;
  context: string;
  output: string;
  created_at: string;
}

interface MainContentProps {
  selectedTask: string | null;
  onSelectTask: (task: string | null) => void;
  context: string;
  onContextChange: (context: string) => void;
  output: string;
  loading: boolean;
  error: string | null;
  maxContextLength: number;
  apiKeyValid: boolean;
  onExecute: () => void;
  onReset: () => void;
  onCopy: () => void;
  contextError: string | null;
  onContextError: (error: string | null) => void;
  outputRef: RefObject<HTMLDivElement | null>;
  sessions: Session[];
  onLoadSession: (session: Session) => void;
  onClearHistory: () => void;
  agentSteps?: AgentStep[];
  agentMode?: boolean;
  codebaseConnected?: boolean;
  onModeChange?: (mode: 'prompt' | 'agent') => void;
  codebaseProvider?: CodebaseProvider | null;
  onCodebaseConnect?: (provider: CodebaseProvider) => void;
  onCodebaseDisconnect?: () => void;
}

export function MainContent({
  selectedTask,
  onSelectTask,
  context,
  onContextChange,
  output,
  loading,
  error,
  maxContextLength,
  apiKeyValid,
  onExecute,
  onReset,
  onCopy,
  contextError,
  onContextError,
  outputRef,
  sessions,
  onLoadSession,
  onClearHistory,
  agentSteps,
  agentMode,
  codebaseConnected,
  onModeChange,
  codebaseProvider,
  onCodebaseConnect,
  onCodebaseDisconnect,
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new');

  if (selectedTask === 'screenshot_analysis') {
    return (
      <div className="space-y-6">
        <ScreenshotUploader
          context={context}
          onContextChange={onContextChange}
          maxContextLength={maxContextLength}
          onError={(e) => onContextError(e)}
          error={error}
          onScreenshotChange={() => {}}
        />
        
        <LazySuspense>
          <LazyChatArea
            context={context}
            onContextChange={onContextChange}
            output={output}
            loading={loading}
            error={error}
            maxContextLength={maxContextLength}
            selectedTask={selectedTask}
            apiKeyValid={apiKeyValid}
            onExecute={onExecute}
            onReset={onReset}
            onCopy={onCopy}
            contextError={contextError}
            onContextError={onContextError}
            outputRef={outputRef}
            agentSteps={agentSteps}
            agentMode={agentMode}
            codebaseConnected={codebaseConnected}
          />
        </LazySuspense>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg">
        <motion.button
          onClick={() => setActiveTab('new')}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'new'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          ✨ New
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('history')}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📜 History
          {sessions.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/10 rounded-full">
              {sessions.length}
            </span>
          )}
        </motion.button>
      </div>

      {activeTab === 'history' ? (
        <LazySuspense>
          <LazySessionHistory
            sessions={sessions}
            onLoadSession={onLoadSession}
            onClearHistory={onClearHistory}
          />
        </LazySuspense>
      ) : (
        <>
          <TaskSelector selectedTask={selectedTask} onSelect={onSelectTask} />

          <LazySuspense>
            <LazyCodebasePanel
              provider={codebaseProvider ?? null}
              onConnect={onCodebaseConnect ?? (() => {})}
              onDisconnect={onCodebaseDisconnect ?? (() => {})}
            />
          </LazySuspense>

          {codebaseConnected && onModeChange && (
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg">
              <motion.button
                onClick={() => onModeChange('prompt')}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  !agentMode
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Prompt
              </motion.button>
              <motion.button
                onClick={() => onModeChange('agent')}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  agentMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Agent
              </motion.button>
            </div>
          )}
          
          {selectedTask && (
            <LazySuspense>
              <LazyChatArea
                context={context}
                onContextChange={onContextChange}
                output={output}
                loading={loading}
                error={error}
                maxContextLength={maxContextLength}
                selectedTask={selectedTask}
                apiKeyValid={apiKeyValid}
                onExecute={onExecute}
                onReset={onReset}
                onCopy={onCopy}
                contextError={contextError}
                onContextError={onContextError}
                outputRef={outputRef}
                agentSteps={agentSteps}
                agentMode={agentMode}
                codebaseConnected={codebaseConnected}
              />
            </LazySuspense>
          )}
        </>
      )}
    </div>
  );
}
