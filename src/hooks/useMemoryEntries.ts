import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { cloudSync } from '../lib/cloudSync';
import type { Project } from '../types';
import type { MemoryEntry } from '../types/memory';
import type { useDatabase } from './useDatabase';

type UseDatabaseReturn = ReturnType<typeof useDatabase>;

interface ImportData {
  project?: Project;
  memoryEntries?: MemoryEntry[];
}

export function useMemoryEntries(selectedProject: number | null, db: UseDatabaseReturn) {
  const setMemoryEntries = useAppStore((s) => s.setMemoryEntries);
  const removeMemoryEntry = useAppStore((s) => s.removeMemoryEntry);
  const updateMemoryEntryStore = useAppStore((s) => s.updateMemoryEntry);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const memoryEntries = useAppStore((s) => s.memoryEntries);
  const {
    createProject,
    createMemoryEntry,
    updateMemoryEntry,
    deleteMemoryEntry,
    getMemoryEntries,
    projects,
  } = db;

  const handleAddEntry = useCallback(
    (entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>) => {
      if (!selectedProject) return;
      const id = createMemoryEntry(entry);
      if (id > 0) {
        const entries = getMemoryEntries(selectedProject);
        setMemoryEntries(entries);
      }
    },
    [createMemoryEntry, getMemoryEntries, selectedProject, setMemoryEntries],
  );

  const handleDeleteEntry = useCallback(
    (id: number) => {
      deleteMemoryEntry(id);
      removeMemoryEntry(id);
    },
    [deleteMemoryEntry, removeMemoryEntry],
  );

  const handleUpdateEntry = useCallback(
    (id: number, updates: Partial<MemoryEntry>) => {
      updateMemoryEntry(id, updates);
      updateMemoryEntryStore(id, updates);
    },
    [updateMemoryEntry, updateMemoryEntryStore],
  );

  const handleSync = useCallback(async () => {
    await cloudSync.syncToCloud(db.projects, memoryEntries);
  }, [db.projects, memoryEntries]);

  const handleExportProject = useCallback(
    (project: Project) => {
      return JSON.stringify({ project, memoryEntries }, null, 2);
    },
    [memoryEntries],
  );

  const handleImportProject = useCallback(
    async (data: string) => {
      try {
        const parsed: ImportData = JSON.parse(data);
        if (!parsed.project) return false;

        const existingProject = projects.find((p) => p.name === parsed.project!.name);
        const projectId = existingProject?.id || createProject(parsed.project.name);
        if (!projectId || projectId <= 0) return false;

        if (parsed.memoryEntries?.length) {
          for (const entry of parsed.memoryEntries) {
            const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = entry;
            void _id;
            void _ca;
            void _ua;
            createMemoryEntry({ ...rest, project_id: projectId });
          }
        }

        const updatedEntries = getMemoryEntries(projectId);
        setMemoryEntries(updatedEntries);
        setSelectedProject(projectId);
        return true;
      } catch {
        return false;
      }
    },
    [projects, createProject, createMemoryEntry, getMemoryEntries, setMemoryEntries, setSelectedProject],
  );

  return {
    handleAddEntry,
    handleDeleteEntry,
    handleUpdateEntry,
    handleSync,
    handleExportProject,
    handleImportProject,
  };
}
