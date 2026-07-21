import type { Task } from '../../types';

export type { Task };

export interface CreateTaskDTO {
  projectId: number;
  taskType: string;
  context: string;
  output: string;
}

export function mapRowToTask(row: Record<string, unknown>): Task {
  return {
    id: Number(row.id) || 0,
    project_id: Number(row.project_id) || 0,
    task_type: String(row.task_type || ''),
    context: row.context != null ? String(row.context) : '',
    output: row.output != null ? String(row.output) : '',
    created_at: String(row.created_at || ''),
  };
}
