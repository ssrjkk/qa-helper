import { useState, useEffect, useCallback } from 'react';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { DatabaseService } from './database';
import { createStorageProvider } from './storage';
import type { Project } from '../types';
import type { MemoryEntry } from '../types/memory';

export function useDatabase() {
  const [dbService, setDbService] = useState<DatabaseService | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<Database | null>(null);

  const saveDb = useCallback(async () => {
    if (!db) return;
    try {
      const exported = db.export();
      const storage = await createStorageProvider();
      await storage.save(exported);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }, [db]);

  useEffect(() => {
    const initDb = async () => {
      try {
        const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
        const storage = await createStorageProvider();
        
        let database: Database;
        const savedData = await storage.load();
        
        if (savedData) {
          try {
            database = new SQL.Database(savedData);
            try { database.run("ALTER TABLE projects ADD COLUMN memory TEXT DEFAULT ''"); } catch { }
          } catch {
            database = new SQL.Database();
          }
        } else {
          database = new SQL.Database();
          const createSQL = [
            "CREATE TABLE projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, memory TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)",
            "CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, task_type TEXT NOT NULL, context TEXT, output TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES projects(id))",
            "CREATE TABLE screenshots (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER, image_data TEXT NOT NULL, analysis_result TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (task_id) REFERENCES tasks(id))",
            "CREATE TABLE conversation_history (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, role TEXT NOT NULL, content TEXT NOT NULL, task_type TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES projects(id))"
          ];
          createSQL.forEach(sql => database.run(sql));
        }
        
        let saveTimeout: ReturnType<typeof setTimeout> | null = null;
        const service = new DatabaseService(database, async () => {
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(async () => {
            try {
              const exported = database.export();
              await storage.save(exported);
            } catch (err) {
              console.error('Failed to save database:', err);
            }
          }, 500);
        });
        
        service.initMemoryTable();
        
        setDb(database);
        setDbService(service);
        setProjects(service.getProjects());
        setIsDbReady(true);
      } catch (err) {
        console.error('Database init failed:', err);
        setError('Failed to initialize database');
      }
    };
    
    initDb();
  }, []);

  useEffect(() => {
    if (!dbService) return;
    setProjects(dbService.getProjects());
  }, [dbService]);

  const createProject = useCallback((name: string) => {
    if (!dbService) return;
    const id = dbService.createProject(name);
    if (id > 0) {
      setProjects(dbService.getProjects());
    }
    return id;
  }, [dbService]);

  const deleteProject = useCallback((id: number) => {
    if (!dbService) return;
    dbService.deleteProject(id);
    setProjects(dbService.getProjects());
  }, [dbService]);

  const updateProjectMemory = useCallback((id: number, memory: string) => {
    if (!dbService) return;
    dbService.updateProjectMemory(id, memory);
  }, [dbService]);

  const getProject = useCallback((id: number) => {
    return dbService?.getProject(id);
  }, [dbService]);

  const createTask = useCallback((data: { projectId: number; taskType: string; context: string; output: string }) => {
    if (!dbService) return;
    dbService.createTask(data.projectId, data.taskType, data.context, data.output);
  }, [dbService]);

  const getRecentSessions = useCallback((projectId: number, limit: number) => {
    return dbService?.getRecentSessions(projectId, limit) || [];
  }, [dbService]);

  const clearConversationHistory = useCallback((projectId: number) => {
    if (!dbService) return;
    dbService.clearConversationHistory(projectId);
  }, [dbService]);

  const getMemoryEntries = useCallback((projectId: number) => {
    return dbService?.getMemoryEntries(projectId) || [];
  }, [dbService]);

  const createMemoryEntry = useCallback((entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (!dbService) return -1;
    return dbService.createMemoryEntry(entry);
  }, [dbService]);

  const updateMemoryEntry = useCallback((id: number, updates: Partial<MemoryEntry>) => {
    if (!dbService) return;
    dbService.updateMemoryEntry(id, updates);
  }, [dbService]);

  const deleteMemoryEntry = useCallback((id: number) => {
    if (!dbService) return;
    dbService.deleteMemoryEntry(id);
  }, [dbService]);

  return {
    db,
    saveDb,
    dbService,
    projects,
    selectedProject,
    setSelectedProject,
    isDbReady,
    error,
    createProject,
    deleteProject,
    updateProjectMemory,
    getProject,
    createTask,
    getRecentSessions,
    clearConversationHistory,
    getMemoryEntries,
    createMemoryEntry,
    updateMemoryEntry,
    deleteMemoryEntry
  };
}
