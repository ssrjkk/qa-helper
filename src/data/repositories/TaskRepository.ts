import { Task, CreateTaskDTO, mapRowToTask, Session, mapRowToSession } from '../../domain/entities';
import type { Database } from '../../types';

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
    try {
      const stmt = this.db.prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC");
      stmt.bind([projectId]);
      const tasks: Task[] = [];
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const obj: Record<string, unknown> = {};
        cols.forEach((col, i) => { obj[col] = vals[i]; });
        tasks.push(mapRowToTask(obj));
      }
      stmt.free();
      return tasks;
    } catch {
      return [];
    }
  }

  create(data: CreateTaskDTO): number {
    try {
      this.db.run(
        "INSERT INTO tasks (project_id, task_type, context, output) VALUES (?, ?, ?, ?)",
        [data.projectId, data.taskType, data.context, data.output]
      );
      this.saveDb();
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      return result[0].values[0][0] as number;
    } catch {
      return -1;
    }
  }

  getRecentSessions(projectId: number, limit: number): Session[] {
    try {
      const stmt = this.db.prepare(
        "SELECT DISTINCT task_type, context, output, created_at FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT ?"
      );
      stmt.bind([projectId, limit]);
      const sessions: Session[] = [];
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const obj: Record<string, unknown> = {};
        cols.forEach((col, i) => { obj[col] = vals[i]; });
        sessions.push(mapRowToSession(obj));
      }
      stmt.free();
      return sessions;
    } catch {
      return [];
    }
  }
}
