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
    id: Number(row.id) || 0,
    name: String(row.name || ''),
    description: row.description != null ? String(row.description) : undefined,
    memory: row.memory != null ? String(row.memory) : undefined,
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}
