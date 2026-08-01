/**
 * Project selector with virtualized list
 * @module ProjectSelector
 * @author ssrjkk
 */

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GlassCard, RippleButton, AutoResizeTextarea } from '../ui';
import { formatDate } from '../../lib';
import { validate, ProjectSchema } from '../../lib/validation';
import { t } from '../../lib/i18n';
import type { Project } from '../../types';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
  onDelete: (id: number) => void;
  onSaveMemory: (memory: string) => void;
  memory: string;
  maxMemoryLength: number;
}

export function ProjectSelector({
  projects,
  selectedProject,
  onSelect,
  onCreate,
  onDelete,
  onSaveMemory,
  memory,
  maxMemoryLength
}: ProjectSelectorProps) {
  const [showNew, setShowNew] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [localMemory, setLocalMemory] = useState(memory);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMemory(memory);
  }, [memory]);

  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 3,
  });

  const handleCreate = () => {
    const result = validate(ProjectSchema, { name: projectName.trim() });
    if (!result.success) {
      setNameError(result.error);
      return;
    }
    setNameError(null);
    onCreate((result.data as { name: string }).name);
    setProjectName("");
    setShowNew(false);
  };

  const handleMemoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalMemory(e.target.value);
    onSaveMemory(e.target.value);
  };

  return (
    <>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-gray-300">{t('project.select')}</h2>
          <RippleButton onClick={() => setShowNew(!showNew)} variant="secondary" className="!px-3 !py-1.5 !text-xs" aria-expanded={showNew} aria-label="Create new project">
            + New
          </RippleButton>
        </div>
        
        {showNew && (
          <div
            className="mb-4 space-y-2 animate-fadeIn"
          >
            <input
              type="text"
              value={projectName}
              onChange={e => { setProjectName(e.target.value); if (nameError) setNameError(null); }}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder={t('project.name')}
              aria-label={t('project.name')}
              aria-invalid={!!nameError}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 focus:border-indigo-500/50"
            />
            {nameError && (
              <p className="text-xs text-amber-400 animate-slideUp">{nameError}</p>
            )}
            <RippleButton onClick={handleCreate} className="w-full !text-xs">
              {t('project.create')}
            </RippleButton>
          </div>
        )}

        <div 
          ref={parentRef}
          className="max-h-64 overflow-y-auto"
        >
          {projects.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">{t('project.none')}</p>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const p = projects[virtualRow.index]!;
                return (
                  <div
                    key={p.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: '0.5rem',
                    }}
                  >
                    <div
                      onClick={() => onSelect(p.id)}
                      onKeyDown={(e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelect(p.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select project ${p.name}`}
                      className={`h-full p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedProject === p.id
                          ? 'bg-indigo-500/20 border border-indigo-500/30'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between h-full">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(p.updated_at)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                          aria-label={`Delete project ${p.name}`}
                          className="text-gray-500 hover:text-red-400 text-lg"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      {selectedProject && (
        <div
          className="animate-fadeIn"
        >
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-300">📝 {t('memory.addEntry')}</h3>
              <RippleButton onClick={() => onSaveMemory(localMemory)} variant="secondary" className="!px-2 !py-1 !text-xs">
                {t('common.save')}
              </RippleButton>
            </div>
            <AutoResizeTextarea
              value={localMemory}
              onChange={handleMemoryChange}
              placeholder="Tech stack, conventions, patterns..."
              aria-label="Project memory notes"
              maxLength={maxMemoryLength}
              className="min-h-24"
            />
          </GlassCard>
        </div>
      )}
    </>
  );
}
