import { useState, useEffect, useRef, useMemo, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, RippleButton, AutoResizeTextarea } from '../ui';
import { ExportPanel } from './ExportPanel';
import { MetricsDashboard } from './MetricsDashboard';
import { ContextPresets } from './ContextPresets';
import { AgentTimeline } from './AgentTimeline';
import { useHistory } from '../../lib/useHistory';
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

function LoadingIndicator() {
  const dotCount = 3;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % dotCount);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block min-w-12">
      {'.'.repeat(index + 1)}
    </span>
  );
}

function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.8, repeat: Infinity }}
      className="inline-block w-2 h-4 bg-indigo-400 ml-1"
    />
  );
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
  outputRef: externalRef,
  agentSteps,
  agentMode: _agentMode,
  codebaseConnected: _codebaseConnected,
}: ChatAreaProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const outputRef = useMemo(() => externalRef || internalRef, [externalRef]);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const { state: historyState, setState: setHistoryState, canUndo, canRedo, undo, redo } = useHistory(context);

  useEffect(() => {
    if (context !== historyState.present) {
      setHistoryState(context);
    }
  }, [context, historyState.present, setHistoryState]);

  const handleContextChange = (value: string) => {
    setHistoryState(value);
    onContextChange(value);
  };

  const handleUndo = () => {
    undo();
    const newValue = historyState.past[historyState.past.length - 1];
    if (newValue !== undefined) {
      onContextChange(newValue);
    }
  };

  const canExecute =
    selectedTask && 
    (context.trim() || selectedTask === 'screenshot_analysis') && 
    apiKeyValid;

  const wordCount = useMemo(() => context.trim().split(/\s+/).filter(Boolean).length, [context]);
  const charCount = context.length;
  const outputWordCount = useMemo(() => output.trim().split(/\s+/).filter(Boolean).length, [output]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, outputRef]);

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-300">📝 Describe Your Task</h3>
            <ContextPresets onSelect={onContextChange} currentContext={context} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg transition-colors ${
                canUndo 
                  ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              aria-label="Undo (Ctrl+Z)"
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg transition-colors ${
                canRedo 
                  ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              aria-label="Redo (Ctrl+Shift+Z)"
              title="Redo (Ctrl+Shift+Z)"
            >
              ↷
            </button>
            <span className="text-xs text-gray-500 ml-2" aria-live="polite">
              {wordCount} words • {charCount}/{maxContextLength} chars
            </span>
          </div>
        </div>
        <AutoResizeTextarea
          value={historyState.present}
          onChange={e => { handleContextChange(e.target.value); onContextError(null); }}
          placeholder="Describe your testing needs, stack, features, or paste code..."
          maxLength={maxContextLength}
          className="min-h-32"
          aria-label="Task description input"
        />
        {contextError && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-amber-400 text-xs mt-2"
          >
            ⚠️ {contextError}
          </motion.p>
        )}
      </GlassCard>

      <div className="flex items-center gap-4">
        <RippleButton
          onClick={onExecute}
          disabled={!canExecute || loading}
          className="flex-1 !py-4 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              <span className="flex items-center">
                Generating<LoadingIndicator />
              </span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🚀 Execute
            </span>
          )}
        </RippleButton>
        {(output || loading) && (
          <RippleButton onClick={onReset} variant="secondary">
            ↺ Reset
          </RippleButton>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(output || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <span className="text-sm font-medium text-gray-300">
                    {loading ? 'Generating...' : 'Output'}
                  </span>
                  {output && (
                    <span className="text-xs text-gray-500">
                      {outputWordCount} words generated
                    </span>
                  )}
                </div>
                {output && !loading && (
                  <div className="flex items-center gap-2">
                    <RippleButton onClick={onCopy} variant="secondary" className="!px-3 !py-1.5 !text-xs" aria-label="Copy output to clipboard">
                      📋 Copy
                    </RippleButton>
                    <RippleButton 
                      onClick={() => setShowExportPanel(!showExportPanel)} 
                      variant="secondary" 
                      className="!px-3 !py-1.5 !text-xs"
                      aria-label="Export options"
                    >
                      📤 Export
                    </RippleButton>
                  </div>
                )}
              </div>

              {loading && !output && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                >
                  <div className="flex items-center gap-3 text-sm text-indigo-300">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full"
                    />
                    <span>AI is thinking about your request<LoadingIndicator /></span>
                  </div>
                </motion.div>
              )}

              <div
                ref={outputRef as React.RefObject<HTMLDivElement>}
                className="bg-white/5 rounded-xl p-4 max-h-96 overflow-y-auto text-sm leading-relaxed"
              >
                {output ? (
                  <pre className="whitespace-pre-wrap font-mono text-gray-300">
                    {output}
                    {loading && <StreamingCursor />}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-2xl"
                      >
                        ⚡
                      </motion.div>
                      <span>Waiting for response...</span>
                    </div>
                  </div>
                )}
              </div>

              {agentSteps && agentSteps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <AgentTimeline steps={agentSteps} isRunning={loading} />
                </div>
              )}

              {loading && output.length > 100 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Streaming response...</span>
                    <span>~{Math.round(output.length / 5)} tokens</span>
                  </div>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 30, ease: 'linear' }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  </div>
                </div>
              )}
            </GlassCard>

            {showExportPanel && output && (
              <ExportPanel
                output={output}
                context={context}
                taskType={selectedTask || undefined}
                onClose={() => setShowExportPanel(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          📊 {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
        </button>
      </div>

      {showMetrics && (
        <MetricsDashboard onClose={() => setShowMetrics(false)} />
      )}
    </div>
  );
}
