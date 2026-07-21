export interface Session {
  task_type: string;
  context: string;
  output: string;
  created_at: string;
}

export function mapRowToSession(row: Record<string, unknown>): Session {
  return {
    task_type: String(row.task_type || ''),
    context: row.context != null ? String(row.context) : '',
    output: row.output != null ? String(row.output) : '',
    created_at: String(row.created_at || ''),
  };
}
