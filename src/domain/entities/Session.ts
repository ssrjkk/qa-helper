export interface Session {
  task_type: string;
  context: string;
  output: string;
  created_at: string;
}

export function mapRowToSession(row: Record<string, unknown>): Session {
  return {
    task_type: row.task_type as string,
    context: (row.context as string) || '',
    output: (row.output as string) || '',
    created_at: row.created_at as string,
  };
}
