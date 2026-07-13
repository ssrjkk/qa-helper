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
    id: row.id as number,
    project_id: row.project_id as number,
    task_type: row.task_type as string,
    context: (row.context as string) || '',
    output: (row.output as string) || '',
    created_at: row.created_at as string,
  };
}
