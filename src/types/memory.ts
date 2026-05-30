export interface MemoryEntry {
  id: number;
  project_id: number;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
  source_task_id?: number;
  created_at: string;
  updated_at: string;
}

export type MemoryCategory = 
  | 'tech_stack'
  | 'test_requirements'
  | 'edge_cases'
  | 'bug_patterns'
  | 'conventions'
  | 'api_endpoints'
  | 'user_flows'
  | 'custom';

export interface StructuredMemory {
  tech_stack: Record<string, string[]>;
  test_requirements: string[];
  edge_cases: string[];
  bug_patterns: string[];
  conventions: Record<string, string>;
  api_endpoints: string[];
  user_flows: string[];
  custom: Record<string, string>;
}

export const MEMORY_CATEGORIES: { id: MemoryCategory; label: string; icon: string; description: string }[] = [
  { id: 'tech_stack', label: 'Tech Stack', icon: '🛠️', description: 'Frameworks, libraries, languages' },
  { id: 'test_requirements', label: 'Requirements', icon: '📋', description: 'Test cases, acceptance criteria' },
  { id: 'edge_cases', label: 'Edge Cases', icon: '⚠️', description: 'Boundary conditions, error handling' },
  { id: 'bug_patterns', label: 'Bug Patterns', icon: '🐛', description: 'Known issues, fixes' },
  { id: 'conventions', label: 'Conventions', icon: '📐', description: 'Code style, naming rules' },
  { id: 'api_endpoints', label: 'API Endpoints', icon: '🔗', description: 'REST APIs, GraphQL' },
  { id: 'user_flows', label: 'User Flows', icon: '🔀', description: 'Navigation paths, workflows' },
  { id: 'custom', label: 'Custom', icon: '📝', description: 'User-defined entries' },
];

export function getCategoryLabel(category: MemoryCategory): string {
  return MEMORY_CATEGORIES.find(c => c.id === category)?.label || category;
}

export function getCategoryIcon(category: MemoryCategory): string {
  return MEMORY_CATEGORIES.find(c => c.id === category)?.icon || '📌';
}
