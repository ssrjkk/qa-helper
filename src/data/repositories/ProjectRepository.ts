import { Project, CreateProjectDTO, UpdateProjectDTO, mapRowToProject } from '../../domain/entities';
import type { Database } from 'sql.js';
import { queryAll, queryOne, insertAndReturnId, buildUpdateQuery, safeRun, execTransaction } from '../../lib/dbHelpers';

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
    return queryAll<Record<string, unknown>>(this.db, "SELECT * FROM projects ORDER BY updated_at DESC").map(mapRowToProject);
  }

  findById(id: number): Project | undefined {
    const row = queryOne<Record<string, unknown>>(this.db, "SELECT * FROM projects WHERE id = ?", [id]);
    return row ? mapRowToProject(row) : undefined;
  }

  create(data: CreateProjectDTO): number {
    return insertAndReturnId(
      this.db, this.saveDb,
      "INSERT INTO projects (name, description) VALUES (?, ?)",
      [data.name, data.description || ''],
    );
  }

  update(id: number, data: UpdateProjectDTO): void {
    const update = buildUpdateQuery('projects', data as Record<string, unknown>, id);
    if (update) {
      safeRun(this.db, update.sql, update.params);
      this.saveDb();
    }
  }

  delete(id: number): void {
    execTransaction(this.db, this.saveDb, [
      () => this.db.run("DELETE FROM screenshots WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)", [id]),
      () => this.db.run("DELETE FROM tasks WHERE project_id = ?", [id]),
      () => this.db.run("DELETE FROM conversation_history WHERE project_id = ?", [id]),
      () => this.db.run("DELETE FROM memory_entries WHERE project_id = ?", [id]),
      () => this.db.run("DELETE FROM projects WHERE id = ?", [id]),
    ]);
  }
}
