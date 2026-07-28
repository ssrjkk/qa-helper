/**
 * Chat input header with undo/redo and word count
 * @module ChatHeader
 * @author ssrjkk
 */

import { useMemo, memo } from 'react';
import { ContextPresets } from '../panels/ContextPresets';
import { useHistory } from '../../hooks/useHistory';

interface ChatHeaderProps {
  context: string;
  onContextChange: (value: string) => void;
  maxContextLength: number;
}

export const ChatHeader = memo(function ChatHeader({ context, onContextChange, maxContextLength }: ChatHeaderProps) {
  const { state: historyState, setState: setHistoryState, canUndo, canRedo, undo, redo } = useHistory(context);

  const handleContextChange = (value: string) => {
    setHistoryState(value);
    onContextChange(value);
  };

  const handleUndo = () => {
    const prevValue = historyState.past[historyState.past.length - 1];
    undo();
    if (prevValue !== undefined) {
      onContextChange(prevValue);
    }
  };

  const wordCount = useMemo(() => context.trim().split(/\s+/).filter(Boolean).length, [context]);
  const charCount = context.length;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium text-gray-300">📝 Task Description</h3>
        <ContextPresets onSelect={handleContextChange} currentContext={context} />
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
  );
});
