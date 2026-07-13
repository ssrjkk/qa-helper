import type { Project } from '../../types';

export type { Project };

export interface CreateProjectDTO {
  name: string;
  description?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  memory?: string;
}

export function mapRowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as number,
    name: row.name as string,
    description: (row.description as string) || undefined,
    memory: (row.memory as string) || undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
