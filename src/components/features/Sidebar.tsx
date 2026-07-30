/**
 * Application sidebar with project/memory/sync controls
 * @module Sidebar
 * @author ssrjkk
 */

import { memo, useState, useRef, useEffect } from 'react';
import { ProjectSelector } from '../selectors/ProjectSelector';
import { StructuredMemory } from '../panels/StructuredMemory';
import { CloudSync } from '../panels/CloudSync';
import { TeamFeatures } from './TeamFeatures';
import { ErrorBoundary, RateLimitBar, SaveIndicator } from '../ui';
import { SECURITY_CONFIG } from '../../config';
import { LIMITS } from '../../lib/constants';
import { t } from '../../lib/i18n';
import type { Project } from '../../types';
import type { MemoryEntry } from '../../types/memory';

interface SidebarProps {
  projects: Project[];
  selectedProject: number | null;
  onSelectProject: (id: number | null) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: number) => void;
  onSaveMemory: (memory: string) => void;
  currentMemory: string;
  rateLimitInfo: { remaining: number; resetIn: number };
  apiKeyValid: boolean;
  onSetApiKey: () => void;
  isOnline: boolean;
  isDbReady: boolean;
  memoryEntries: MemoryEntry[];
  onAddMemoryEntry: (entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteMemoryEntry: (id: number) => void;
  onUpdateMemoryEntry: (id: number, updates: Partial<MemoryEntry>) => void;
  onSync: () => Promise<void>;
  onExportProject: (project: Project) => string;
  onImportProject: (data: string) => Promise<boolean>;
}

export const Sidebar = memo(function Sidebar({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onSaveMemory,
  currentMemory,
  rateLimitInfo,
  apiKeyValid,
  onSetApiKey,
  isOnline,
  isDbReady,
  memoryEntries,
  onAddMemoryEntry,
  onDeleteMemoryEntry,
  onUpdateMemoryEntry,
  onSync,
  onExportProject,
  onImportProject,
}: SidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const currentProj = projects.find(p => p.id === selectedProject);

  const handleDeleteProject = (id: number) => {
    if (deleteConfirmId === id) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      onDeleteProject(id);
      if (selectedProject === id) onSelectProject(null);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => setDeleteConfirmId(null), LIMITS.toastDurationMs);
    }
  };

  return (
    <div className="space-y-4">
      {!isOnline && (
        <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm text-center animate-fadeIn" role="alert">
          {t('errors.networkError')}
        </div>
      )}

      {apiKeyValid ? (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          API Connected
          <button onClick={onSetApiKey} className="ml-2 text-gray-500 hover:text-gray-800 dark:hover:text-white">{t('common.edit')}</button>
        </div>
      ) : (
        <button
          onClick={onSetApiKey}
          className="w-full p-3 bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-sm text-center transition-all duration-200"
        >
        {t('errors.apiKeyRequired', { provider: 'AI' })}
        </button>
      )}

      <ProjectSelector
        projects={projects}
        selectedProject={selectedProject}
        onSelect={onSelectProject}
        onCreate={onCreateProject}
        onDelete={handleDeleteProject}
        onSaveMemory={onSaveMemory}
        memory={currentMemory}
        maxMemoryLength={SECURITY_CONFIG.maxMemoryLength}
      />

      {deleteConfirmId && (
        <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl animate-fadeIn" role="alert">
          <p className="text-red-600 dark:text-red-400 text-xs mb-2 text-center">{t('project.deleteConfirm')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDeleteProject(deleteConfirmId)}
              className="flex-1 px-3 py-1.5 bg-red-100 dark:bg-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-lg hover:bg-red-200 dark:hover:bg-red-500/50 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <StructuredMemory
        projectId={selectedProject ?? 0}
        entries={memoryEntries}
        onAddEntry={onAddMemoryEntry}
        onDeleteEntry={onDeleteMemoryEntry}
        onUpdateEntry={onUpdateMemoryEntry}
      />

      <CloudSync
        onSync={onSync}
        projectsCount={projects.length}
        canSync={isOnline && apiKeyValid}
        projects={projects}
        memoryEntries={memoryEntries}
      />

      <ErrorBoundary>
        <TeamFeatures
          currentProject={currentProj || null}
          onExportForTeam={onExportProject}
          onImportFromTeam={onImportProject}
        />
      </ErrorBoundary>

      <RateLimitBar remaining={rateLimitInfo.remaining} />

      {isDbReady && selectedProject && (
        <SaveIndicator saving={false} />
      )}
    </div>
  );
});
