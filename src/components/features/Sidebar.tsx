import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectSelector } from './ProjectSelector';
import { StructuredMemory } from './StructuredMemory';
import { CloudSync } from './CloudSync';
import { TeamFeatures } from './TeamFeatures';
import { RateLimitBar, SaveIndicator } from '../ui';
import { SECURITY_CONFIG } from '../../config';
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

export function Sidebar({
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
      deleteTimerRef.current = setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center"
        >
          Offline - requests disabled
        </motion.div>
      )}
      
      {apiKeyValid ? (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          API Connected
          <button onClick={onSetApiKey} className="ml-2 text-gray-500 hover:text-white">Edit</button>
        </div>
      ) : (
        <motion.button
          onClick={onSetApiKey}
          className="w-full p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm text-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Set API Key
        </motion.button>
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
      
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl"
          >
            <p className="text-red-400 text-xs mb-2 text-center">Delete project?</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteProject(deleteConfirmId)}
                className="flex-1 px-3 py-1.5 bg-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-500/50 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-3 py-1.5 bg-white/5 text-gray-400 text-xs rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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

      <TeamFeatures
        currentProject={currentProj || null}
        onExportForTeam={onExportProject}
        onImportFromTeam={onImportProject}
      />
      
      <RateLimitBar remaining={rateLimitInfo.remaining} />
      
      {isDbReady && selectedProject && (
        <SaveIndicator saving={false} />
      )}
    </div>
  );
}
