import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MEMORY_CATEGORIES, type MemoryCategory, type MemoryEntry } from '../../types/memory';
import { entriesToMemory, getMemorySummary } from '../../lib/memory';
import { GlassCard } from '../ui';

interface StructuredMemoryProps {
  entries: MemoryEntry[];
  onAddEntry: (entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteEntry: (id: number) => void;
  onUpdateEntry: (id: number, updates: Partial<MemoryEntry>) => void;
  isLoading?: boolean;
}

export function StructuredMemory({ entries, onAddEntry, onDeleteEntry, onUpdateEntry }: StructuredMemoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const memory = entriesToMemory(entries);
  const summary = getMemorySummary(memory);

  const handleAddEntry = () => {
    if (!selectedCategory || !newValue.trim()) return;
    
    onAddEntry({
      project_id: entries[0]?.project_id || 0,
      category: selectedCategory,
      key: newKey.trim() || 'entry',
      value: newValue.trim(),
      confidence: 0.8,
    });
    
    setNewKey('');
    setNewValue('');
  };

  const filteredEntries = selectedCategory
    ? entries.filter(e => e.category === selectedCategory)
    : entries;

  const groupedEntries = MEMORY_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = entries.filter(e => e.category === cat.id);
    return acc;
  }, {} as Record<MemoryCategory, MemoryEntry[]>);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🧠</span>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-200">Structured Memory</p>
            <p className="text-xs text-gray-500">{summary}</p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-gray-400"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    !selectedCategory
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  All ({entries.length})
                </button>
                {MEMORY_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                        : 'bg-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {cat.icon} {cat.label} ({groupedEntries[cat.id].length})
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredEntries.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">
                    No memory entries yet
                  </p>
                ) : (
                  filteredEntries.map(entry => (
                    <MemoryEntryItem
                      key={entry.id}
                      entry={entry}
                      onDelete={() => onDeleteEntry(entry.id)}
                      onUpdate={(updates) => onUpdateEntry(entry.id, updates)}
                    />
                  ))
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-500 mb-2">Add new entry:</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedCategory || ''}
                    onChange={e => setSelectedCategory(e.target.value as MemoryCategory)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 outline-none focus:border-indigo-500/50"
                  >
                    <option value="">Category...</option>
                    {MEMORY_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    placeholder="Key (optional)"
                    className="flex-1 min-w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Value"
                    className="flex-[2] min-w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={handleAddEntry}
                    disabled={!selectedCategory || !newValue.trim()}
                    className="px-4 py-2 bg-indigo-500/30 text-indigo-300 rounded-lg text-sm hover:bg-indigo-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemoryEntryItem({
  entry,
  onDelete,
  onUpdate,
}: {
  entry: MemoryEntry;
  onDelete: () => void;
  onUpdate: (updates: Partial<MemoryEntry>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.value);
  const category = MEMORY_CATEGORIES.find(c => c.id === entry.category);

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate({ value: editValue.trim() });
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-start gap-2 p-2 bg-white/5 rounded-lg group"
    >
      <span className="text-sm mt-0.5">{category?.icon}</span>
      <div className="flex-1 min-w-0">
        {entry.key !== 'entry' && entry.key !== category?.id && (
          <p className="text-xs text-indigo-400">{entry.key}</p>
        )}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full px-2 py-1 bg-white/5 border border-indigo-500/30 rounded text-sm text-gray-200 outline-none"
            autoFocus
          />
        ) : (
          <p
            className="text-sm text-gray-300 cursor-pointer hover:text-white"
            onClick={() => setIsEditing(true)}
          >
            {entry.value}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-gray-600">
          {Math.round(entry.confidence * 100)}%
        </span>
        <button
          onClick={onDelete}
          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
          title="Delete"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}
