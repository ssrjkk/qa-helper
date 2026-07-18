import { useState, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui';
import { TASK_TYPES, TASK_CATEGORIES, type TaskCategory, type TaskType } from '../../config';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TaskSelectorProps {
  selectedTask: string | null;
  onSelect: (taskId: string) => void;
}

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  all: 'All',
  generate: 'Generate',
  analyze: 'Analyze',
  review: 'Review',
  setup: 'Setup',
};

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  all: '🎯',
  generate: '⚡',
  analyze: '📊',
  review: '🔍',
  setup: '🔧',
};

export function TaskSelector({ selectedTask, onSelect }: TaskSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    return TASK_TYPES.filter((task) => {
      const matchesCategory = activeCategory === 'all' || task.category === activeCategory;
      const matchesSearch = searchQuery === '' || 
        task.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <GlassCard className="p-4">
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 focus:border-indigo-500/50 focus:bg-white/10 transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-1 p-1 bg-white/5 rounded-lg overflow-x-auto">
          {TASK_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <span>{CATEGORY_ICONS[category]}</span>
              <span>{CATEGORY_LABELS[category]}</span>
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No modules found for "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTask === task.id}
                onClick={() => onSelect(task.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

interface TaskCardProps {
  task: TaskType;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

function TaskCard({ task, isSelected, onClick, index }: TaskCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 10 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={reduced ? undefined : { delay: index * 0.03, type: "spring", stiffness: 300 }}
      onClick={onClick}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select task ${task.label}`}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-3 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/50' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm"
          style={{ backgroundColor: `${task.color}20` }}
        >
          {task.icon}
        </div>
        <span className="font-medium text-xs truncate">{task.label}</span>
      </div>
      {isSelected && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 border-2 border-indigo-500/50 rounded-lg"
        />
      )}
    </motion.div>
  );
}
