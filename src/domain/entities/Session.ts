export interface Session {
  taskType: string;
  context: string;
  output: string;
  createdAt: Date;
}

export function mapRowToSession(row: Record<string, unknown>): Session {
  return {
    taskType: row.task_type as string,
    context: row.context as string || '',
    output: row.output as string || '',
    createdAt: new Date(row.created_at as string),
  };
}
