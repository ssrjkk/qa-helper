export interface Project {
  id: number;
  name: string;
  description?: string;
  memory?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  memory?: string;
}

export function createProject(id: number, data: CreateProjectDTO): Project {
  const now = new Date();
  return {
    id,
    name: data.name,
    description: data.description,
    memory: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function mapRowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string | undefined,
    memory: row.memory as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
