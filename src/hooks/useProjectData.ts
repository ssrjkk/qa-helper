import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { useDatabase } from './useDatabase';

type UseDatabaseReturn = ReturnType<typeof useDatabase>;

export function useProjectData(db: UseDatabaseReturn) {
  const setCurrentMemory = useAppStore((s) => s.setCurrentMemory);
  const setSessions = useAppStore((s) => s.setSessions);
  const setMemoryEntries = useAppStore((s) => s.setMemoryEntries);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const setContext = useAppStore((s) => s.setContext);
  const setOutput = useAppStore((s) => s.setOutput);
  const {
    projects,
    selectedProject,
    createProject,
    deleteProject,
    updateProjectMemory,
    getProject,
    getRecentSessions,
    clearConversationHistory,
    getMemoryEntries,
  } = db;

  const updateProjectMemoryRef = useRef(updateProjectMemory);
  updateProjectMemoryRef.current = updateProjectMemory;

  const selectedProjectRef = useRef(selectedProject);
  selectedProjectRef.current = selectedProject;

  useEffect(() => {
    if (!selectedProject) {
      setCurrentMemory('');
      return;
    }
    const project = getProject(selectedProject);
    setCurrentMemory(project?.memory || '');
  }, [selectedProject, getProject, setCurrentMemory]);

  useEffect(() => {
    if (!selectedProject) {
      setSessions([]);
      return;
    }
    const recentSessions = getRecentSessions(selectedProject, 50);
    setSessions(recentSessions);
  }, [selectedProject, getRecentSessions, setSessions]);

  useEffect(() => {
    if (!selectedProject) {
      setMemoryEntries([]);
      return;
    }
    const entries = getMemoryEntries(selectedProject);
    setMemoryEntries(entries);
  }, [selectedProject, getMemoryEntries, setMemoryEntries]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ projectId: number; memory: string } | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pendingSaveRef.current) {
        updateProjectMemoryRef.current(pendingSaveRef.current.projectId, pendingSaveRef.current.memory);
        pendingSaveRef.current = null;
      }
    };
  }, []);

  const debouncedSave = useCallback((projectId: number, memory: string) => {
    pendingSaveRef.current = { projectId, memory };
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        updateProjectMemoryRef.current(pendingSaveRef.current.projectId, pendingSaveRef.current.memory);
        pendingSaveRef.current = null;
      }
    }, 1000);
  }, []);

  const handleSaveMemory = useCallback(
    (memory: string) => {
      if (!selectedProjectRef.current) return;
      setCurrentMemory(memory);
      debouncedSave(selectedProjectRef.current, memory);
    },
    [debouncedSave, setCurrentMemory],
  );

  const handleCreateProject = useCallback(
    (name: string) => {
      const id = createProject(name);
      if (id !== undefined && id > 0) {
        setSelectedProject(id);
      }
    },
    [createProject, setSelectedProject],
  );

  const handleLoadSession = useCallback(
    (session: { task_type: string; context: string; output: string }) => {
      setSelectedTask(session.task_type);
      setContext(session.context);
      setOutput(session.output);
    },
    [setSelectedTask, setContext, setOutput],
  );

  return {
    projects,
    selectedProject,
    createProject,
    deleteProject,
    handleSaveMemory,
    handleCreateProject,
    handleLoadSession,
    clearConversationHistory,
  };
}
