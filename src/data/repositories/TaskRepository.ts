import { Task, CreateTaskDTO, mapRowToTask, Session, mapRowToSession } from '../../domain/entities';
import type { Database } from 'sql.js';
import { queryAll, insertAndReturnId } from '../../lib/dbHelpers';

export interface ITaskRepository {
  findByProjectId(projectId: number): Task[];
  create(data: CreateTaskDTO): number;
  getRecentSessions(projectId: number, limit: number): Session[];
}

export class TaskRepository implements ITaskRepository {
  constructor(
    private db: Database,
    private saveDb: () => void | Promise<void>
  ) {}

  findByProjectId(projectId: number): Task[] {
    return queryAll<Record<string, unknown>>(this.db, "SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC", [projectId]).map(mapRowToTask);
  }

  create(data: CreateTaskDTO): number {
    return insertAndReturnId(
      this.db, this.saveDb,
      "INSERT INTO tasks (project_id, task_type, context, output) VALUES (?, ?, ?, ?)",
      [data.projectId, data.taskType, data.context, data.output],
    );
  }

  getRecentSessions(projectId: number, limit: number): Session[] {
    return queryAll<Record<string, unknown>>(
      this.db,
      "SELECT DISTINCT task_type, context, output, created_at FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT ?",
      [projectId, limit]
    ).map(mapRowToSession);
  }
}
