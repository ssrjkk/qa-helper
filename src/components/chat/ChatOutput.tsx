/**
 * Chat output display with streaming cursor
 * @module ChatOutput
 * @author ssrjkk
 */

import { useEffect, useRef, useMemo, memo, RefObject } from 'react';
import { GlassCard, RippleButton } from '../ui';
import { AgentTimeline } from './AgentTimeline';
import type { AgentStep } from '../../data/agent/types';

function StreamingCursor() {
  return (
    <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse" />
  );
}

function LoadingIndicator() {
  return (
    <span className="inline-block min-w-12 animate-pulse">...</span>
  );
}

interface ChatOutputProps {
  output: string;
  loading: boolean;
  onCopy: () => void;
  onShowExport: () => void;
  outputRef?: RefObject<HTMLDivElement | null>;
  agentSteps?: AgentStep[];
}

export const ChatOutput = memo(function ChatOutput({
  output,
  loading,
  onCopy,
  onShowExport,
  outputRef: externalRef,
  agentSteps,
}: ChatOutputProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const outputRef = useMemo(() => externalRef || internalRef, [externalRef]);
  const outputWordCount = useMemo(() => output.trim().split(/\s+/).filter(Boolean).length, [output]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, outputRef]);

  return (
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
              onClick={onShowExport}
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
        <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-fadeIn">
          <div className="flex items-center gap-3 text-sm text-indigo-300">
            <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            <span>AI is thinking about your request<LoadingIndicator /></span>
          </div>
        </div>
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
              <div className="text-2xl animate-bounce">⚡</div>
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
    </GlassCard>
  );
});
