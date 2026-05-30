import { create } from 'zustand';
import type { MemoryEntry } from '../types/memory';

interface Session {
  taskType: string;
  context: string;
  output: string;
  created_at: string;
}

interface AppState {
  selectedTask: string | null;
  setSelectedTask: (task: string | null) => void;

  context: string;
  setContext: (context: string) => void;

  output: string;
  setOutput: (output: string) => void;

  screenshotBase64: string | null;
  setScreenshotBase64: (screenshot: string | null) => void;

  selectedProject: number | null;
  setSelectedProject: (id: number | null) => void;

  currentMemory: string;
  setCurrentMemory: (memory: string) => void;

  memoryEntries: MemoryEntry[];
  setMemoryEntries: (entries: MemoryEntry[]) => void;
  addMemoryEntry: (entry: MemoryEntry) => void;
  removeMemoryEntry: (id: number) => void;
  updateMemoryEntry: (id: number, updates: Partial<MemoryEntry>) => void;

  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;

  showApiKeyInput: boolean;
  setShowApiKeyInput: (show: boolean) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;

  apiKey: string;
  setApiKey: (key: string) => void;

  apiKeyValid: boolean;
  setApiKeyValid: (valid: boolean) => void;

  resetTask: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),

  context: '',
  setContext: (context) => set({ context }),

  output: '',
  setOutput: (output) => set({ output }),

  screenshotBase64: null,
  setScreenshotBase64: (screenshot) => set({ screenshotBase64: screenshot }),

  selectedProject: null,
  setSelectedProject: (id) => set({ selectedProject: id }),

  currentMemory: '',
  setCurrentMemory: (memory) => set({ currentMemory: memory }),

  memoryEntries: [],
  setMemoryEntries: (entries) => set({ memoryEntries: entries }),
  addMemoryEntry: (entry) => set((state) => ({ 
    memoryEntries: [...state.memoryEntries, entry] 
  })),
  removeMemoryEntry: (id) => set((state) => ({ 
    memoryEntries: state.memoryEntries.filter((e) => e.id !== id) 
  })),
  updateMemoryEntry: (id, updates) => set((state) => ({
    memoryEntries: state.memoryEntries.map((e) => 
      e.id === id ? { ...e, ...updates } : e
    )
  })),

  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ 
    sessions: [session, ...state.sessions].slice(0, 50) 
  })),

  showApiKeyInput: false,
  setShowApiKeyInput: (show) => set({ showApiKeyInput: show }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  error: null,
  setError: (error) => set({ error }),

  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),

  apiKeyValid: false,
  setApiKeyValid: (valid) => set({ apiKeyValid: valid }),

  resetTask: () => set({ 
    context: '', 
    output: '', 
    screenshotBase64: null,
    error: null 
  }),
}));
