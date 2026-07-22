import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentStep } from '../../data/agent/types';

interface AgentTimelineProps {
  steps: AgentStep[];
  isRunning: boolean;
}

function ToolIcon({ name }: { name?: string }) {
  const icons: Record<string, string> = {
    list_directory: '📁',
    read_file: '📄',
    search_code: '🔍',
  };
  return <span>{icons[name || ''] || '🔧'}</span>;
}

function StepDetail({ step }: { step: AgentStep }) {
  const [expanded, setExpanded] = useState(false);

  if (step.type === 'thinking') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-3 h-3 border border-gray-600 border-t-gray-400 rounded-full"
        />
        <span>{step.content}</span>
      </div>
    );
  }

  if (step.type === 'error') {
    return (
      <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
        {step.content}
      </div>
    );
  }

  if (step.type === 'tool_call') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-blue-300">
          <ToolIcon name={step.toolName} />
          <span className="font-medium">{step.toolName}</span>
          {step.toolInput && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              {expanded ? '▾' : '▸'}
            </button>
          )}
        </div>
        <AnimatePresence>
          {expanded && step.toolInput && (
            <motion.pre
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-gray-400 bg-white/5 rounded px-2 py-1 overflow-hidden font-mono"
            >
              {JSON.stringify(step.toolInput, null, 2)}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step.type === 'tool_result') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-green-300">
          <span>✓</span>
          <span className="font-medium">{step.toolName}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? '▾' : '▸'} output
          </button>
        </div>
        <AnimatePresence>
          {expanded && step.toolOutput && (
            <motion.pre
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-gray-400 bg-white/5 rounded px-2 py-1 overflow-x-auto max-h-40 overflow-y-auto font-mono whitespace-pre-wrap"
            >
              {step.toolOutput}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step.type === 'text') {
    return null;
  }

  return null;
}

export function AgentTimeline({ steps, isRunning }: AgentTimelineProps) {
  const toolCalls = steps.filter(s => s.type === 'tool_call');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium">Agent Steps</span>
          <span className="text-gray-600">•</span>
          <span>{toolCalls.length} tools used</span>
        </div>
        {isRunning && (
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-amber-400 rounded-full"
            />
            <span className="text-xs text-amber-400">Running</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        <AnimatePresence>
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="pl-3 border-l border-white/10"
            >
              <StepDetail step={step} key={`${step.id}-${i}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isRunning && toolCalls.length > 0 && (
        <div className="text-xs text-gray-500 pt-1 border-t border-white/5">
          Completed {toolCalls.length} tool calls in {steps[steps.length - 1] && steps[0] ? Math.round((steps[steps.length - 1]!.timestamp - steps[0]!.timestamp) / 1000) : 0}s
        </div>
      )}
    </div>
  );
}
