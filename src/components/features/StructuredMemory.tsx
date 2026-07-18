import { useState, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MEMORY_CATEGORIES, type MemoryCategory, type MemoryEntry } from '../../types/memory';
import { entriesToMemory, getMemorySummary } from '../../lib/memory';
import { GlassCard, Accordion, Input, Select } from '../ui';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SLIDE_UP, SPRING } from '../../lib/animations';

interface StructuredMemoryProps {
  entries: MemoryEntry[];
  onAddEntry: (entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteEntry: (id: number) => void;
  onUpdateEntry: (id: number, updates: Partial<MemoryEntry>) => void;
  isLoading?: boolean;
}

export function StructuredMemory({ entries, onAddEntry, onDeleteEntry, onUpdateEntry }: StructuredMemoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const reduced = useReducedMotion();

  const memory = entriesToMemory(entries);
  const summary = getMemorySummary(memory);

  const handleAddEntry = () => {
    if (!selectedCategory || !newValue.trim() || entries.length === 0) return;

    onAddEntry({
      project_id: entries[0].project_id,
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
    <Accordion
      icon="🧠"
      title="Structured Memory"
      subtitle={summary}
      badge={entries.length > 0 ? entries.length : undefined}
    >
      <GlassCard className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
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
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span aria-hidden="true">{cat.icon}</span> {cat.label} ({groupedEntries[cat.id].length})
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">
              No memory entries yet
            </p>
          ) : (
            <AnimatePresence>
              {filteredEntries.map(entry => (
                <MemoryEntryItem
                  key={entry.id}
                  entry={entry}
                  onDelete={() => onDeleteEntry(entry.id)}
                  onUpdate={(updates) => onUpdateEntry(entry.id, updates)}
                  reduced={reduced}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-gray-500 mb-2">Add new entry:</p>
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedCategory || ''}
              onChange={e => {
                const val = e.target.value;
                if (MEMORY_CATEGORIES.some(c => c.id === val)) setSelectedCategory(val as MemoryCategory);
              }}
            >
              <option value="">Category...</option>
              {MEMORY_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </Select>
            <Input
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder="Key (optional)"
              className="flex-1 min-w-24"
            />
            <Input
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder="Value"
              className="flex-[2] min-w-32"
            />
            <button
              onClick={handleAddEntry}
              disabled={!selectedCategory || !newValue.trim()}
              className="px-4 py-2 bg-indigo-500/30 text-indigo-300 rounded-lg text-sm hover:bg-indigo-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Add
            </button>
          </div>
        </div>
      </GlassCard>
    </Accordion>
  );
}

function MemoryEntryItemInner({
  entry,
  onDelete,
  onUpdate,
  reduced,
}: {
  entry: MemoryEntry;
  onDelete: () => void;
  onUpdate: (updates: Partial<MemoryEntry>) => void;
  reduced: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.value);
  const category = MEMORY_CATEGORIES.find(c => c.id === entry.category);

  useEffect(() => {
    if (!isEditing) setEditValue(entry.value);
  }, [entry.value, isEditing]);

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate({ value: editValue.trim() });
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      {...(reduced ? {} : SLIDE_UP)}
      transition={SPRING.gentle}
      className="flex items-start gap-2 p-2 bg-white/5 rounded-lg group"
    >
      <span className="text-sm mt-0.5" aria-hidden="true">{category?.icon}</span>
      <div className="flex-1 min-w-0">
        {entry.key !== 'entry' && entry.key !== category?.id && (
          <p className="text-xs text-indigo-400">{entry.key}</p>
        )}
        {isEditing ? (
          <Input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="!px-2 !py-1 !bg-transparent !border-indigo-500/30"
            autoFocus
          />
        ) : (
          <p
            className="text-sm text-gray-300 cursor-pointer hover:text-white"
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setIsEditing(true)}
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
          className="p-1 text-gray-500 hover:text-red-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          aria-label="Delete entry"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

const MemoryEntryItem = memo(MemoryEntryItemInner, (prev, next) =>
  prev.entry.id === next.entry.id &&
  prev.entry.value === next.entry.value &&
  prev.entry.confidence === next.entry.confidence &&
  prev.entry.category === next.entry.category &&
  prev.reduced === next.reduced,
);
