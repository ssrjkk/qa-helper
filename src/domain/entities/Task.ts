export interface Task {
  id: number;
  projectId: number;
  taskType: TaskType;
  context: string;
  output: string;
  createdAt: Date;
}

export type TaskType = 
  | 'test_generation'
  | 'bug_report_analysis'
  | 'test_case_review'
  | 'test_data_generation'
  | 'api_test_planning'
  | 'test_automation_advice'
  | 'screenshot_analysis'
  | 'test_coverage_analysis';

export interface CreateTaskDTO {
  projectId: number;
  taskType: TaskType;
  context: string;
  output: string;
}

export function createTask(id: number, data: CreateTaskDTO): Task {
  return {
    id,
    projectId: data.projectId,
    taskType: data.taskType,
    context: data.context,
    output: data.output,
    createdAt: new Date(),
  };
}

export function mapRowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as number,
    projectId: row.project_id as number,
    taskType: row.task_type as TaskType,
    context: row.context as string || '',
    output: row.output as string || '',
    createdAt: new Date(row.created_at as string),
  };
}
