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
    
    const techStackCount = entries.filter(e => e.category === 'tech_stack').length;
    const requirementsCount = entries.filter(e => e.category === 'test_requirements').length;
    const edgeCasesCount = entries.filter(e => e.category === 'edge_cases').length;
    const bugPatternsCount = entries.filter(e => e.category === 'bug_patterns').length;

    return {
      techStackCount,
      requirementsCount,
      edgeCasesCount,
      bugPatternsCount,
      totalCount: entries.length,
    };
  }

  getSummaryText(projectId: number): string {
    const summary = this.getMemorySummary(projectId);
    const parts: string[] = [];

    if (summary.techStackCount > 0) parts.push(`${summary.techStackCount} tech items`);
    if (summary.requirementsCount > 0) parts.push(`${summary.requirementsCount} requirements`);
    if (summary.edgeCasesCount > 0) parts.push(`${summary.edgeCasesCount} edge cases`);
    if (summary.bugPatternsCount > 0) parts.push(`${summary.bugPatternsCount} bug patterns`);

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

    entries.forEach(entry => {
      grouped[entry.category].push(entry);
    });

    return grouped;
  }
}
