/**
 * Command palette (Ctrl+K)
 * @module CommandPalette
 * @author ssrjkk
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { KeyboardShortcuts } from '../../lib/keyboardShortcuts';

interface Command {
  id: string;
  label: string;
  description?: string;
  category: string;
  action: () => void;
  icon?: string;
}

interface CommandPaletteProps {
  commands: Command[];
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ commands, open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      c => c.label.toLowerCase().includes(q) ||
           c.description?.toLowerCase().includes(q) ||
           c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const unsub = KeyboardShortcuts.register({
      key: 'Escape',
      handler: onClose,
      description: 'Close command palette',
      category: 'Navigation',
    });
    return unsub;
  }, [open, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    const selected = listRef.current?.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const categories = [...new Set(filtered.map(c => c.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <span className="text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
          />
          <kbd className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No commands found
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat}>
                <div className="px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {cat}
                </div>
                {filtered
                  .filter(c => c.category === cat)
                  .map(cmd => {
                    const globalIdx = filtered.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => { cmd.action(); onClose(); }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          globalIdx === selectedIndex
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {cmd.icon && <span className="text-lg">{cmd.icon}</span>}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-gray-500 truncate">{cmd.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
