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

export function mapRowToMemoryEntry(row: Record<string, unknown>): MemoryEntry {
  return {
    id: row.id as number,
    project_id: row.project_id as number,
    category: row.category as MemoryCategory,
    key: row.key as string,
    value: row.value as string,
    confidence: row.confidence as number,
    source_task_id: row.source_task_id as number | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
