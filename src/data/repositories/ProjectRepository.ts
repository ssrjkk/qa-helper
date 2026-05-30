import { Project, CreateProjectDTO, UpdateProjectDTO, mapRowToProject } from '../../domain/entities';
import type { Database } from '../../types';

export interface IProjectRepository {
  findAll(): Project[];
  findById(id: number): Project | undefined;
  create(data: CreateProjectDTO): number;
  update(id: number, data: UpdateProjectDTO): void;
  delete(id: number): void;
}

export class ProjectRepository implements IProjectRepository {
  constructor(
    private db: Database,
    private saveDb: () => void | Promise<void>
  ) {}

  findAll(): Project[] {
    try {
      const result = this.db.exec("SELECT * FROM projects ORDER BY updated_at DESC");
      if (result.length === 0) return [];
      const { columns, values } = result[0];
      return values.map(row => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return mapRowToProject(obj);
      });
    } catch {
      return [];
    }
  }

  findById(id: number): Project | undefined {
    try {
      const stmt = this.db.prepare("SELECT * FROM projects WHERE id = ?");
      stmt.bind([id]);
      if (!stmt.step()) {
        stmt.free();
        return undefined;
      }
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      stmt.free();
      const obj: Record<string, unknown> = {};
      cols.forEach((col, i) => { obj[col] = vals[i]; });
      return mapRowToProject(obj);
    } catch {
      return undefined;
    }
  }

  create(data: CreateProjectDTO): number {
    try {
      this.db.run("INSERT INTO projects (name, description) VALUES (?, ?)", [data.name, data.description || '']);
      this.saveDb();
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      return result[0].values[0][0] as number;
    } catch {
      return -1;
    }
  }

  update(id: number, data: UpdateProjectDTO): void {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.memory !== undefined) { fields.push('memory = ?'); values.push(data.memory); }
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      this.db.run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
      this.saveDb();
    }
  }

  delete(id: number): void {
    try {
      this.db.run("BEGIN TRANSACTION");
      this.db.run("DELETE FROM tasks WHERE project_id = ?", [id]);
      this.db.run("DELETE FROM screenshots WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)", [id]);
      this.db.run("DELETE FROM conversation_history WHERE project_id = ?", [id]);
      this.db.run("DELETE FROM memory_entries WHERE project_id = ?", [id]);
      this.db.run("DELETE FROM projects WHERE id = ?", [id]);
      this.db.run("COMMIT");
      this.saveDb();
    } catch (err) {
      this.db.run("ROLLBACK");
      console.error('Delete project transaction error:', err);
    }
  }
}
