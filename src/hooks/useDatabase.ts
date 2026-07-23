import { useState, useEffect, useCallback } from 'react';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { DatabaseService } from '../lib/database';
import { createStorageProvider } from '../lib/storage';
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
      setError(`Failed to save database: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [db]);

  useEffect(() => {
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const initDb = async () => {
      try {
        const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
        const storage = await createStorageProvider();
        
        let database: Database;
        const savedData = await storage.load();
        
        if (savedData) {
          try {
            database = new SQL.Database(savedData);
            try { database.run("ALTER TABLE projects ADD COLUMN memory TEXT DEFAULT ''"); } catch (e: unknown) {
              if (!(e instanceof Error) || !e.message?.includes('duplicate column')) throw e;
            }
          } catch {
            database = new SQL.Database();
            [
              "CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, memory TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)",
              "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, task_type TEXT NOT NULL, context TEXT, output TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES projects(id))",
              "CREATE TABLE IF NOT EXISTS screenshots (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER, image_data TEXT NOT NULL, analysis_result TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (task_id) REFERENCES tasks(id))",
              "CREATE TABLE IF NOT EXISTS conversation_history (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, role TEXT NOT NULL, content TEXT NOT NULL, task_type TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES projects(id))",
            ].forEach(sql => database.run(sql));
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
        
        const service = new DatabaseService(database, async () => {
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(async () => {
            try {
              const exported = database.export();
              await storage.save(exported);
            } catch {
              // Save failed — non-critical, will retry on next change
            }
          }, 500);
        });
        
        service.initMemoryTable();
        
        if (!mounted) return;
        setDb(database);
        setDbService(service);
        setProjects(service.getProjects());
        setIsDbReady(true);
      } catch {
        if (mounted) setError('Failed to initialize database');
      }
    };
    
    initDb();

    return () => {
      mounted = false;
      if (saveTimeout) clearTimeout(saveTimeout);
    };
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
    if (!dbService || id <= 0) return;
    const success = dbService.deleteProject(id);
    if (success) {
      setProjects(dbService.getProjects());
    }
  }, [dbService]);

  const updateProjectMemory = useCallback((id: number, memory: string) => {
    if (!dbService || id <= 0) return;
    dbService.updateProjectMemory(id, memory);
    setProjects(dbService.getProjects());
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
