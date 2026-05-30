import { 
  MemoryEntry, 
  CreateMemoryEntryDTO, 
  UpdateMemoryEntryDTO, 
  mapRowToMemoryEntry 
} from '../../domain/entities';
import type { Database } from '../../types';

export interface IMemoryRepository {
  findByProjectId(projectId: number): MemoryEntry[];
  create(data: CreateMemoryEntryDTO): number;
  update(id: number, data: UpdateMemoryEntryDTO): void;
  delete(id: number): void;
}

export class MemoryRepository implements IMemoryRepository {
  constructor(
    private db: Database,
    private saveDb: () => void | Promise<void>
  ) {}

  findByProjectId(projectId: number): MemoryEntry[] {
    try {
      const stmt = this.db.prepare("SELECT * FROM memory_entries WHERE project_id = ? ORDER BY created_at DESC");
      stmt.bind([projectId]);
      const entries: MemoryEntry[] = [];
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const obj: Record<string, unknown> = {};
        cols.forEach((col, i) => { obj[col] = vals[i]; });
        entries.push(mapRowToMemoryEntry(obj));
      }
      stmt.free();
      return entries;
    } catch {
      return [];
    }
  }

  create(data: CreateMemoryEntryDTO): number {
    try {
      this.db.run(
        "INSERT INTO memory_entries (project_id, category, key, value, confidence, source_task_id) VALUES (?, ?, ?, ?, ?, ?)",
        [data.projectId, data.category, data.key, data.value, data.confidence ?? 0.8, data.sourceTaskId || null]
      );
      this.saveDb();
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      return result[0].values[0][0] as number;
    } catch {
      return -1;
    }
  }

  update(id: number, data: UpdateMemoryEntryDTO): void {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    
    if (data.key !== undefined) { fields.push('key = ?'); values.push(data.key); }
    if (data.value !== undefined) { fields.push('value = ?'); values.push(data.value); }
    if (data.confidence !== undefined) { fields.push('confidence = ?'); values.push(data.confidence); }
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      this.db.run(`UPDATE memory_entries SET ${fields.join(', ')} WHERE id = ?`, values);
      this.saveDb();
    }
  }

  delete(id: number): void {
    this.db.run("DELETE FROM memory_entries WHERE id = ?", [id]);
    this.saveDb();
  }
}
