import { 
  MemoryEntry, 
  CreateMemoryEntryDTO, 
  UpdateMemoryEntryDTO,
  MemoryCategory
} from '../entities';
import { IMemoryRepository } from '../../data/repositories';

export interface MemorySummary {
  techStackCount: number;
  requirementsCount: number;
  edgeCasesCount: number;
  bugPatternsCount: number;
  totalCount: number;
}

export class MemoryUseCases {
  constructor(private memoryRepo: IMemoryRepository) {}

  getEntriesByProject(projectId: number): MemoryEntry[] {
    return this.memoryRepo.findByProjectId(projectId);
  }

  createEntry(data: CreateMemoryEntryDTO): number {
    return this.memoryRepo.create(data);
  }

  updateEntry(id: number, data: UpdateMemoryEntryDTO): void {
    this.memoryRepo.update(id, data);
  }

  deleteEntry(id: number): void {
    this.memoryRepo.delete(id);
  }

  getEntriesByCategory(projectId: number, category: MemoryCategory): MemoryEntry[] {
    return this.getEntriesByProject(projectId).filter(e => e.category === category);
  }

  getMemorySummary(projectId: number): MemorySummary {
    const entries = this.getEntriesByProject(projectId);
    const counts: Record<string, number> = { tech_stack: 0, test_requirements: 0, edge_cases: 0, bug_patterns: 0 };

    for (const e of entries) {
      if (e.category in counts) counts[e.category] = (counts[e.category] ?? 0) + 1;
    }

    return {
      techStackCount: counts.tech_stack ?? 0,
      requirementsCount: counts.test_requirements ?? 0,
      edgeCasesCount: counts.edge_cases ?? 0,
      bugPatternsCount: counts.bug_patterns ?? 0,
      totalCount: entries.length,
    };
  }

  getSummaryText(projectId: number): string {
    const s = this.getMemorySummary(projectId);
    const parts: string[] = [];
    if (s.techStackCount > 0) parts.push(`${s.techStackCount} tech items`);
    if (s.requirementsCount > 0) parts.push(`${s.requirementsCount} requirements`);
    if (s.edgeCasesCount > 0) parts.push(`${s.edgeCasesCount} edge cases`);
    if (s.bugPatternsCount > 0) parts.push(`${s.bugPatternsCount} bug patterns`);
    return parts.join(' • ') || 'No structured memory yet';
  }

  getGroupedEntries(projectId: number): Record<MemoryCategory, MemoryEntry[]> {
    const entries = this.getEntriesByProject(projectId);
    const grouped: Record<MemoryCategory, MemoryEntry[]> = {
      tech_stack: [],
      test_requirements: [],
      edge_cases: [],
      bug_patterns: [],
      conventions: [],
      api_endpoints: [],
      user_flows: [],
      custom: [],
    };

    for (const entry of entries) {
      if (entry.category in grouped) {
        grouped[entry.category].push(entry);
      }
    }

    return grouped;
  }
}
