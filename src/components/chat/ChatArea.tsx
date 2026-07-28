/**
 * Chat input/output area with undo/redo
 * Composes ChatHeader, ChatActions, ChatOutput sub-components
 * @module ChatArea
 * @author ssrjkk
 */

import { useCallback, useState, RefObject } from 'react';
import { GlassCard, AutoResizeTextarea } from '../ui';
import { ChatHeader } from './ChatHeader';
import { LazyExportPanel, LazyMetricsDashboard, LazySuspense } from '../features/LazyComponents';
import { ChatActions } from './ChatActions';
import { ChatOutput } from './ChatOutput';
import { t } from '../../lib/i18n';
import type { AgentStep } from '../../data/agent/types';

interface ChatAreaProps {
  context: string;
  onContextChange: (value: string) => void;
  output: string;
  loading: boolean;
  error: string | null;
  maxContextLength: number;
  selectedTask: string | null;
  apiKeyValid: boolean;
  onExecute: () => void;
  onReset: () => void;
  onCopy: () => void;
  contextError: string | null;
  onContextError: (error: string | null) => void;
  outputRef?: RefObject<HTMLDivElement | null>;
  agentSteps?: AgentStep[];
  agentMode?: boolean;
  codebaseConnected?: boolean;
}

export function ChatArea({
  context,
  onContextChange,
  output,
  loading,
  error,
  maxContextLength,
  selectedTask,
  apiKeyValid,
  onExecute,
  onReset,
  onCopy,
  contextError,
  onContextError,
  outputRef,
  agentSteps,
}: ChatAreaProps) {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const handleShowExport = useCallback(() => setShowExportPanel(prev => !prev), []);

  const canExecute =
    selectedTask &&
    (context.trim() || selectedTask === 'screenshot_analysis') &&
    apiKeyValid;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <ChatHeader
          context={context}
          onContextChange={onContextChange}
          maxContextLength={maxContextLength}
        />
        <AutoResizeTextarea
          value={context}
          onChange={e => { onContextChange(e.target.value); if (e.target.value.length > 20) onContextError(null); }}
          placeholder={t('chat.placeholder')}
          maxLength={maxContextLength}
          className="min-h-32"
          aria-label="Task description input"
        />
        {contextError && (
          <p className="text-amber-400 text-xs mt-2 animate-slideUp">
            ⚠️ {contextError}
          </p>
        )}
        {!context && selectedTask && !loading && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Try:</span>
            {[
              'Login form with email validation and OAuth',
              'REST API /users endpoint with pagination',
              'Mobile responsive navbar with hamburger menu',
              'Payment checkout flow with Stripe integration',
            ].map(hint => (
              <button
                key={hint}
                onClick={() => onContextChange(hint)}
                className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {hint}
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      <ChatActions
        loading={loading}
        canExecute={!!canExecute}
        hasOutput={!!output}
        onExecute={onExecute}
        onReset={onReset}
        apiKeyValid={apiKeyValid}
      />

      {error && (
        <div
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-slideUp"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-red-400/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {(output || loading) && (
        <div className="animate-slideUp">
          <ChatOutput
            output={output}
            loading={loading}
            onCopy={onCopy}
            onShowExport={handleShowExport}
            outputRef={outputRef}
            agentSteps={agentSteps}
          />

          {showExportPanel && output && (
            <LazySuspense>
              <LazyExportPanel
                output={output}
                context={context}
                taskType={selectedTask || undefined}
                onClose={() => setShowExportPanel(false)}
              />
            </LazySuspense>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          📊 {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
        </button>
      </div>

      {showMetrics && (
        <LazySuspense>
          <LazyMetricsDashboard onClose={() => setShowMetrics(false)} />
        </LazySuspense>
      )}
    </div>
  );
}
