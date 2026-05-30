export type MemoryCategory = 
  | 'tech_stack'
  | 'test_requirements'
  | 'edge_cases'
  | 'bug_patterns'
  | 'conventions'
  | 'api_endpoints'
  | 'user_flows'
  | 'custom';

export interface MemoryEntry {
  id: number;
  projectId: number;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
  sourceTaskId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoryEntryDTO {
  projectId: number;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence?: number;
  sourceTaskId?: number;
}

export interface UpdateMemoryEntryDTO {
  key?: string;
  value?: string;
  confidence?: number;
}

export const MEMORY_CATEGORIES = [
  { id: 'tech_stack' as const, label: 'Tech Stack', icon: '🛠️', description: 'Frameworks, libraries, languages' },
  { id: 'test_requirements' as const, label: 'Requirements', icon: '📋', description: 'Test cases, acceptance criteria' },
  { id: 'edge_cases' as const, label: 'Edge Cases', icon: '⚠️', description: 'Boundary conditions, error handling' },
  { id: 'bug_patterns' as const, label: 'Bug Patterns', icon: '🐛', description: 'Known issues, fixes' },
  { id: 'conventions' as const, label: 'Conventions', icon: '📐', description: 'Code style, naming rules' },
  { id: 'api_endpoints' as const, label: 'API Endpoints', icon: '🔗', description: 'REST APIs, GraphQL' },
  { id: 'user_flows' as const, label: 'User Flows', icon: '🔀', description: 'Navigation paths, workflows' },
  { id: 'custom' as const, label: 'Custom', icon: '📝', description: 'User-defined entries' },
];

export function getCategoryLabel(category: MemoryCategory): string {
  return MEMORY_CATEGORIES.find(c => c.id === category)?.label || category;
}

export function getCategoryIcon(category: MemoryCategory): string {
  return MEMORY_CATEGORIES.find(c => c.id === category)?.icon || '📌';
}

export function createMemoryEntry(id: number, data: CreateMemoryEntryDTO): MemoryEntry {
  const now = new Date();
  return {
    id,
    projectId: data.projectId,
    category: data.category,
    key: data.key,
    value: data.value,
    confidence: data.confidence ?? 0.8,
    sourceTaskId: data.sourceTaskId,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapRowToMemoryEntry(row: Record<string, unknown>): MemoryEntry {
  return {
    id: row.id as number,
    projectId: row.project_id as number,
    category: row.category as MemoryCategory,
    key: row.key as string,
    value: row.value as string,
    confidence: row.confidence as number,
    sourceTaskId: row.source_task_id as number | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
