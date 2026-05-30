import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from '../lib/database';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

describe('DatabaseService', () => {
  let db: Database;
  let saveDbMock: () => void | Promise<void>;
  let service: DatabaseService;

  beforeEach(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    
    db.run(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        memory TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        task_type TEXT,
        context TEXT,
        output TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);
    db.run(`
      CREATE TABLE screenshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        data TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      )
    `);
    db.run(`
      CREATE TABLE conversation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        role TEXT,
        content TEXT,
        task_type TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);
    db.run(`
      CREATE TABLE memory_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        category TEXT,
        key TEXT,
        value TEXT,
        confidence REAL DEFAULT 0.8,
        source_task_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    saveDbMock = vi.fn();
    service = new DatabaseService(db, saveDbMock);
  });

  describe('execTransaction', () => {
    it('should execute all operations in a transaction', () => {
      service.execTransaction([
        () => db.run("INSERT INTO projects (name) VALUES (?)", ['Test']),
        () => db.run("INSERT INTO projects (name) VALUES (?)", ['Test 2']),
      ]);
      
      const result = db.exec("SELECT COUNT(*) as count FROM projects");
      expect(result[0].values[0][0]).toBe(2);
      expect(saveDbMock).toHaveBeenCalled();
    });

    it('should rollback on error', () => {
      const initialCount = db.exec("SELECT COUNT(*) as count FROM projects");
      
      service.execTransaction([
        () => db.run("INSERT INTO projects (name) VALUES (?)", ['Test']),
        () => { throw new Error('Intentional error'); },
      ]);
      
      const result = db.exec("SELECT COUNT(*) as count FROM projects");
      expect(result[0].values[0][0]).toBe(initialCount[0].values[0][0]);
    });

    it('should return false on error', () => {
      const result = service.execTransaction([
        () => db.run("INSERT INTO projects (name) VALUES (?)", ['Test']),
        () => { throw new Error('Intentional error'); },
      ]);
      
      expect(result).toBe(false);
      expect(service.getLastError()).toBe('Intentional error');
    });

    it('should return true on success', () => {
      const result = service.execTransaction([
        () => db.run("INSERT INTO projects (name) VALUES (?)", ['Test']),
      ]);
      
      expect(result).toBe(true);
      expect(service.getLastError()).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete project and all related data', () => {
      db.run("INSERT INTO projects (name) VALUES ('Test Project')");
      let result = db.exec("SELECT last_insert_rowid() as id");
      const projectId = result[0].values[0][0] as number;
      
      db.run("INSERT INTO tasks (project_id, task_type) VALUES (" + projectId + ", 'test')");
      result = db.exec("SELECT last_insert_rowid() as id");
      const taskId = result[0].values[0][0] as number;
      
      db.run("INSERT INTO screenshots (task_id) VALUES (" + taskId + ")");
      db.run("INSERT INTO conversation_history (project_id, role, content) VALUES (" + projectId + ", 'user', 'hello')");
      db.run("INSERT INTO memory_entries (project_id, category, key, value) VALUES (" + projectId + ", 'test', 'key', 'value')");
      
      service.deleteProject(projectId);
      
      let stmt = db.prepare("SELECT COUNT(*) FROM projects WHERE id = ?");
      stmt.bind([projectId]);
      stmt.step();
      expect(stmt.get()[0]).toBe(0);
      stmt.free();

      stmt = db.prepare("SELECT COUNT(*) FROM tasks WHERE project_id = ?");
      stmt.bind([projectId]);
      stmt.step();
      expect(stmt.get()[0]).toBe(0);
      stmt.free();

      stmt = db.prepare("SELECT COUNT(*) FROM conversation_history WHERE project_id = ?");
      stmt.bind([projectId]);
      stmt.step();
      expect(stmt.get()[0]).toBe(0);
      stmt.free();

      stmt = db.prepare("SELECT COUNT(*) FROM memory_entries WHERE project_id = ?");
      stmt.bind([projectId]);
      stmt.step();
      expect(stmt.get()[0]).toBe(0);
      stmt.free();
    });
  });
});
