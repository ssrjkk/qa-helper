import type { MemoryEntry, MemoryCategory } from '../../types/memory';
import { MEMORY_CATEGORIES, getCategoryLabel, getCategoryIcon } from '../../types/memory';

export type { MemoryEntry, MemoryCategory };
export { MEMORY_CATEGORIES, getCategoryLabel, getCategoryIcon };

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

const VALID_CATEGORIES = new Set<string>(MEMORY_CATEGORIES.map(c => c.id));

export function mapRowToMemoryEntry(row: Record<string, unknown>): MemoryEntry {
  return {
    id: Number(row.id) || 0,
    project_id: Number(row.project_id) || 0,
    category: VALID_CATEGORIES.has(String(row.category)) ? (String(row.category) as MemoryCategory) : 'custom',
    key: String(row.key || ''),
    value: String(row.value || ''),
    confidence: typeof row.confidence === 'number' ? row.confidence : Number(row.confidence) || 0.8,
    source_task_id: row.source_task_id != null ? Number(row.source_task_id) : undefined,
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}
