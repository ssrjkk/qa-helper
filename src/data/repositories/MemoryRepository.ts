import { 
  MemoryEntry, 
  CreateMemoryEntryDTO, 
  UpdateMemoryEntryDTO, 
  mapRowToMemoryEntry 
} from '../../domain/entities';
import type { Database } from 'sql.js';
import { queryAll, insertAndReturnId, buildUpdateQuery, safeRun } from '../../lib/dbHelpers';

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
    return queryAll<Record<string, unknown>>(this.db, "SELECT * FROM memory_entries WHERE project_id = ? ORDER BY created_at DESC", [projectId]).map(mapRowToMemoryEntry);
  }

  create(data: CreateMemoryEntryDTO): number {
    return insertAndReturnId(
      this.db, this.saveDb,
      "INSERT INTO memory_entries (project_id, category, key, value, confidence, source_task_id) VALUES (?, ?, ?, ?, ?, ?)",
      [data.projectId, data.category, data.key, data.value, data.confidence ?? 0.8, data.sourceTaskId || null],
    );
  }

  update(id: number, data: UpdateMemoryEntryDTO): void {
    const update = buildUpdateQuery('memory_entries', data as Record<string, unknown>, id);
    if (update) {
      safeRun(this.db, update.sql, update.params);
      this.saveDb();
    }
  }

  delete(id: number): void {
    safeRun(this.db, "DELETE FROM memory_entries WHERE id = ?", [id]);
    this.saveDb();
  }
}
