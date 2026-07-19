import type { Database } from 'sql.js';
import type { Project, Task, ConversationMessage } from '../types';
import type { MemoryEntry } from '../types/memory';

export class DatabaseService {
  private lastError: string | null = null;
  private isInitialized = false;

  constructor(private db: Database, private saveDb: () => void | Promise<void>) {}

  getLastError(): string | null {
    return this.lastError;
  }

  clearError(): void {
    this.lastError = null;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  setInitialized(value: boolean): void {
    this.isInitialized = value;
  }

  execTransaction(operations: (() => void)[]): boolean {
    try {
      this.db.run("BEGIN TRANSACTION");
      for (const op of operations) {
        op();
      }
      this.db.run("COMMIT");
      this.saveDb();
      this.clearError();
      return true;
    } catch (err) {
      this.db.run("ROLLBACK");
      this.lastError = (err as Error).message;
      return false;
    }
  }

  private safeRun(sql: string, params?: (string | number | null)[]): boolean {
    try {
      this.db.run(sql, params);
      this.clearError();
      return true;
    } catch (err) {
      this.lastError = (err as Error).message;
      return false;
    }
  }

  private rowToObject(columns: string[], values: unknown[]): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => { obj[col] = values[i]; });
    return obj;
  }

  private queryAll<T>(sql: string, params?: (string | number | null)[]): T[] {
    try {
      const stmt = this.db.prepare(sql);
      if (params) stmt.bind(params);
      
      const results: T[] = [];
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        results.push(this.rowToObject(cols, vals) as T);
      }
      stmt.free();
      return results;
    } catch {
      return [];
    }
  }

  private queryOne<T>(sql: string, params?: (string | number | null)[]): T | undefined {
    try {
      const stmt = this.db.prepare(sql);
      if (params) stmt.bind(params);
      
      if (!stmt.step()) {
        stmt.free();
        return undefined;
      }
      
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      stmt.free();
      return this.rowToObject(cols, vals) as T;
    } catch {
      return undefined;
    }
  }

  getProjects(): Project[] {
    return this.queryAll<Project>("SELECT * FROM projects ORDER BY updated_at DESC");
  }

  getProject(id: number): Project | undefined {
    return this.queryOne<Project>("SELECT * FROM projects WHERE id = ?", [id]);
  }

  createProject(name: string, description: string = ""): number {
    this.safeRun("INSERT INTO projects (name, description, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))", [name, description]);
    if (this.lastError) return -1;
    try {
      this.saveDb();
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      return result[0].values[0][0] as number;
    } catch {
      return -1;
    }
  }

  updateProject(id: number, updates: Partial<Project>): boolean {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.memory !== undefined) { fields.push('memory = ?'); values.push(updates.memory); }
    
    if (fields.length > 0) {
      fields.push('updated_at = datetime("now")');
      values.push(id);
      this.safeRun(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
      this.saveDb();
      return !this.lastError;
    }
    return false;
  }

  updateProjectMemory(id: number, memory: string): void {
    this.safeRun("UPDATE projects SET memory = ?, updated_at = datetime('now') WHERE id = ?", [memory, id]);
    this.saveDb();
  }

  deleteProject(id: number): boolean {
    return this.execTransaction([
      () => this.db.run("DELETE FROM screenshots WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)", [id]),
      () => this.db.run("DELETE FROM tasks WHERE project_id = ?", [id]),
      () => this.db.run("DELETE FROM conversation_history WHERE project_id = ?", [id]),
      () => this.db.run("DELETE FROM memory_entries WHERE project_id = ?", [id]),
      () => this.db.run("DELETE FROM projects WHERE id = ?", [id]),
    ]);
  }

  getTasks(projectId: number, limit?: number): Task[] {
    const sql = limit 
      ? "SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT ?" 
      : "SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC";
    return this.queryAll<Task>(sql, limit ? [projectId, limit] : [projectId]);
  }

  createTask(projectId: number, taskType: string, context: string, output: string): number {
    this.safeRun(
      "INSERT INTO tasks (project_id, task_type, context, output, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
      [projectId, taskType, context, output]
    );
    if (this.lastError) return -1;
    try {
      this.saveDb();
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      return result[0].values[0][0] as number;
    } catch {
      return -1;
    }
  }

  batchCreateTasks(tasks: Array<{ projectId: number; taskType: string; context: string; output: string }>): number[] {
    const results: number[] = [];
    const operations: (() => void)[] = tasks.map(task => () => {
      this.db.run(
        "INSERT INTO tasks (project_id, task_type, context, output, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [task.projectId, task.taskType, task.context, task.output]
      );
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      results.push(result[0].values[0][0] as number);
    });
    this.execTransaction(operations);
    return results;
  }

  getDatabase(): Database {
    return this.db;
  }

  addConversationMessage(projectId: number, role: 'user' | 'assistant', content: string, taskType?: string): number {
    this.safeRun(
      "INSERT INTO conversation_history (project_id, role, content, task_type, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
      [projectId, role, content, taskType || null]
    );
    if (this.lastError) return -1;
    try {
      this.saveDb();
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      return result[0].values[0][0] as number;
    } catch {
      return -1;
    }
  }

  getConversationHistory(projectId: number, limit: number = 50): ConversationMessage[] {
    return this.queryAll<ConversationMessage>(
      "SELECT * FROM conversation_history WHERE project_id = ? ORDER BY created_at DESC LIMIT ?",
      [projectId, limit]
    ).reverse();
  }

  clearConversationHistory(projectId: number): void {
    this.safeRun("DELETE FROM conversation_history WHERE project_id = ?", [projectId]);
    this.saveDb();
  }

  getRecentSessions(projectId: number, limit: number = 10): Array<{ task_type: string; context: string; output: string; created_at: string }> {
    return this.queryAll(
      "SELECT DISTINCT task_type, context, output, created_at FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT ?",
      [projectId, limit]
    );
  }

  getMemoryEntries(projectId: number, category?: string): MemoryEntry[] {
    const sql = category 
      ? "SELECT * FROM memory_entries WHERE project_id = ? AND category = ? ORDER BY created_at DESC"
      : "SELECT * FROM memory_entries WHERE project_id = ? ORDER BY created_at DESC";
    return this.queryAll<MemoryEntry>(sql, category ? [projectId, category] : [projectId]);
  }

  createMemoryEntry(entry: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>): number {
    this.safeRun(
      "INSERT INTO memory_entries (project_id, category, key, value, confidence, source_task_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      [entry.project_id, entry.category, entry.key, entry.value, entry.confidence, entry.source_task_id || null]
    );
    if (this.lastError) return -1;
    try {
      this.saveDb();
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      return result[0].values[0][0] as number;
    } catch {
      return -1;
    }
  }

  batchCreateMemoryEntries(entries: Array<Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>>): number[] {
    const results: number[] = [];
    const operations: (() => void)[] = entries.map(entry => () => {
      this.db.run(
        "INSERT INTO memory_entries (project_id, category, key, value, confidence, source_task_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
        [entry.project_id, entry.category, entry.key, entry.value, entry.confidence, entry.source_task_id || null]
      );
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      results.push(result[0].values[0][0] as number);
    });
    this.execTransaction(operations);
    return results;
  }

  updateMemoryEntry(id: number, updates: Partial<MemoryEntry>): boolean {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    
    if (updates.key !== undefined) { fields.push('key = ?'); values.push(updates.key); }
    if (updates.value !== undefined) { fields.push('value = ?'); values.push(updates.value); }
    if (updates.confidence !== undefined) { fields.push('confidence = ?'); values.push(updates.confidence); }
    if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
    
    if (fields.length > 0) {
      fields.push('updated_at = datetime("now")');
      values.push(id);
      this.safeRun(`UPDATE memory_entries SET ${fields.join(', ')} WHERE id = ?`, values);
      this.saveDb();
      return !this.lastError;
    }
    return false;
  }

  deleteMemoryEntry(id: number): void {
    this.safeRun("DELETE FROM memory_entries WHERE id = ?", [id]);
    this.saveDb();
  }

  searchMemoryEntries(projectId: number, searchTerm: string): MemoryEntry[] {
    const escaped = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const term = `%${escaped}%`;
    return this.queryAll<MemoryEntry>(
      "SELECT * FROM memory_entries WHERE project_id = ? AND (key LIKE ? ESCAPE '\\' OR value LIKE ? ESCAPE '\\') ORDER BY created_at DESC",
      [projectId, term, term]
    );
  }

  getMemoryStats(projectId: number): { total: number; categories: Record<string, number> } {
    const rows = this.queryAll<{ category: string; count: number }>(
      "SELECT category, COUNT(*) as count FROM memory_entries WHERE project_id = ? GROUP BY category",
      [projectId],
    );
    const categories: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      categories[row.category] = row.count;
      total += row.count;
    }
    return { total, categories };
  }

  initMemoryTable(): void {
    this.safeRun(
      "CREATE TABLE IF NOT EXISTS memory_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, category TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, confidence REAL DEFAULT 0.8, source_task_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES projects(id))"
    );
    this.safeRun("CREATE INDEX IF NOT EXISTS idx_memory_project ON memory_entries(project_id)");
    this.safeRun("CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_entries(category)");
    this.saveDb();
  }

  vacuum(): void {
    this.db.run("VACUUM");
  }

  getDatabaseSize(): number {
    const result = this.db.exec("PRAGMA page_count");
    if (result.length > 0 && result[0].values.length > 0) {
      return (result[0].values[0][0] as number) * 4096;
    }
    return 0;
  }

  exportAll(): { projects: Project[]; tasks: Task[]; memoryEntries: MemoryEntry[] } {
    return {
      projects: this.getProjects(),
      tasks: this.queryAll<Task>("SELECT * FROM tasks"),
      memoryEntries: this.queryAll<MemoryEntry>("SELECT * FROM memory_entries")
    };
  }
}
