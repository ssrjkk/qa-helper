import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTEXT_PRESETS, searchPresets, type ContextPreset } from '../../config';
import { Input } from '../ui';

interface ContextPresetsProps {
  onSelect: (template: string) => void;
  currentContext: string;
}

export function ContextPresets({ onSelect, currentContext }: ContextPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPresets = search ? searchPresets(search) : CONTEXT_PRESETS;

  const handleSelect = (preset: ContextPreset) => {
    const newContext = currentContext
      ? `${currentContext}\n\n---\n\n${preset.template}`
      : preset.template;
    onSelect(newContext);
    setIsOpen(false);
    setSearch('');
  };

  const categories = [
    { id: 'e2e', label: 'E2E', presets: filteredPresets.filter(p => p.tags.includes('e2e')) },
    { id: 'unit', label: 'Unit', presets: filteredPresets.filter(p => p.tags.includes('unit')) },
    { id: 'api', label: 'API', presets: filteredPresets.filter(p => p.tags.includes('api')) },
    { id: 'mobile', label: 'Mobile', presets: filteredPresets.filter(p => p.tags.includes('mobile')) },
    { id: 'other', label: 'Other', presets: filteredPresets.filter(p =>
      !p.tags.includes('e2e') && !p.tags.includes('unit') && !p.tags.includes('api') && !p.tags.includes('mobile')
    ) },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        <span>⚡</span>
        <span>Presets</span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); }}
            role="listbox"
            className="absolute left-0 top-full mt-2 z-50 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-3 border-b border-white/10">
              <Input
                placeholder="Search presets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredPresets.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No presets found
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map(category => {
                    if (category.presets.length === 0) return null;
                    return (
                      <div key={category.id}>
                        <p className="text-xs text-gray-500 px-2 py-1">{category.label}</p>
                        {category.presets.map(preset => (
                          <PresetItem
                            key={preset.id}
                            preset={preset}
                            onSelect={() => handleSelect(preset)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PresetItem({ preset, onSelect }: { preset: ContextPreset; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
    >
      <span className="text-xl">{preset.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-200">{preset.name}</span>
          <div className="flex gap-1">
            {preset.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-white/5 rounded text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{preset.description}</p>
      </div>
    </button>
  );
}
