import type { StructuredMemory, MemoryEntry } from '../types/memory';

export function parseMemoryExtraction(response: string): Partial<StructuredMemory> {
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return {
      tech_stack: typeof parsed.tech_stack === 'object' && parsed.tech_stack !== null ? parsed.tech_stack : {},
      test_requirements: Array.isArray(parsed.test_requirements) ? parsed.test_requirements : [],
      edge_cases: Array.isArray(parsed.edge_cases) ? parsed.edge_cases : [],
      bug_patterns: Array.isArray(parsed.bug_patterns) ? parsed.bug_patterns : [],
      conventions: typeof parsed.conventions === 'object' && parsed.conventions !== null ? parsed.conventions : {},
      api_endpoints: Array.isArray(parsed.api_endpoints) ? parsed.api_endpoints : [],
      user_flows: Array.isArray(parsed.user_flows) ? parsed.user_flows : [],
      custom: typeof parsed.custom === 'object' && parsed.custom !== null ? parsed.custom : {},
    };
  } catch {
    return {};
  }
}

export function memoryToEntries(
  projectId: number,
  memory: Partial<StructuredMemory>,
  taskId?: number
): Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>[] {
  const entries: Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>[] = [];

  if (memory.tech_stack && typeof memory.tech_stack === 'object') {
    Object.entries(memory.tech_stack).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          entries.push({
            project_id: projectId,
            category: 'tech_stack',
            key: category,
            value: item,
            confidence: 0.8,
            source_task_id: taskId,
          });
        });
      }
    });
  }

  if (memory.test_requirements && Array.isArray(memory.test_requirements)) {
    memory.test_requirements.forEach(item => {
      entries.push({
        project_id: projectId,
        category: 'test_requirements',
        key: 'requirement',
        value: item,
        confidence: 0.7,
        source_task_id: taskId,
      });
    });
  }

  if (memory.edge_cases && Array.isArray(memory.edge_cases)) {
    memory.edge_cases.forEach(item => {
      entries.push({
        project_id: projectId,
        category: 'edge_cases',
        key: 'edge_case',
        value: item,
        confidence: 0.6,
        source_task_id: taskId,
      });
    });
  }

  if (memory.bug_patterns && Array.isArray(memory.bug_patterns)) {
    memory.bug_patterns.forEach(item => {
      entries.push({
        project_id: projectId,
        category: 'bug_patterns',
        key: 'bug',
        value: item,
        confidence: 0.8,
        source_task_id: taskId,
      });
    });
  }

  if (memory.conventions && typeof memory.conventions === 'object') {
    Object.entries(memory.conventions).forEach(([key, value]) => {
      entries.push({
        project_id: projectId,
        category: 'conventions',
        key,
        value: String(value),
        confidence: 0.7,
        source_task_id: taskId,
      });
    });
  }

  if (memory.api_endpoints && Array.isArray(memory.api_endpoints)) {
    memory.api_endpoints.forEach(item => {
      entries.push({
        project_id: projectId,
        category: 'api_endpoints',
        key: 'endpoint',
        value: item,
        confidence: 0.9,
        source_task_id: taskId,
      });
    });
  }

  if (memory.user_flows && Array.isArray(memory.user_flows)) {
    memory.user_flows.forEach(item => {
      entries.push({
        project_id: projectId,
        category: 'user_flows',
        key: 'flow',
        value: item,
        confidence: 0.7,
        source_task_id: taskId,
      });
    });
  }

  if (memory.custom && typeof memory.custom === 'object') {
    Object.entries(memory.custom).forEach(([key, value]) => {
      entries.push({
        project_id: projectId,
        category: 'custom',
        key,
        value: String(value),
        confidence: 0.6,
        source_task_id: taskId,
      });
    });
  }

  return entries;
}

export function entriesToMemory(entries: MemoryEntry[]): StructuredMemory {
  const memory: StructuredMemory = {
    tech_stack: {},
    test_requirements: [],
    edge_cases: [],
    bug_patterns: [],
    conventions: {},
    api_endpoints: [],
    user_flows: [],
    custom: {},
  };

  for (const entry of entries) {
    switch (entry.category) {
      case 'tech_stack':
        if (!memory.tech_stack[entry.key]) {
          memory.tech_stack[entry.key] = [];
        }
        memory.tech_stack[entry.key].push(entry.value);
        break;
      case 'test_requirements':
        memory.test_requirements.push(entry.value);
        break;
      case 'edge_cases':
        memory.edge_cases.push(entry.value);
        break;
      case 'bug_patterns':
        memory.bug_patterns.push(entry.value);
        break;
      case 'conventions':
        memory.conventions[entry.key] = entry.value;
        break;
      case 'api_endpoints':
        memory.api_endpoints.push(entry.value);
        break;
      case 'user_flows':
        memory.user_flows.push(entry.value);
        break;
      case 'custom':
        memory.custom[entry.key] = entry.value;
        break;
    }
  }

  return memory;
}

export function getMemorySummary(memory: StructuredMemory): string {
  const parts: string[] = [];

  const techCount = Object.values(memory.tech_stack).flat().length;
  if (techCount > 0) parts.push(`${techCount} tech items`);

  if (memory.test_requirements.length > 0) {
    parts.push(`${memory.test_requirements.length} requirements`);
  }
  if (memory.edge_cases.length > 0) {
    parts.push(`${memory.edge_cases.length} edge cases`);
  }
  if (memory.bug_patterns.length > 0) {
    parts.push(`${memory.bug_patterns.length} bug patterns`);
  }
  if (memory.api_endpoints.length > 0) {
    parts.push(`${memory.api_endpoints.length} APIs`);
  }

  return parts.join(' • ') || 'No structured memory yet';
}

export function mergeMemories(existing: StructuredMemory, newMemory: Partial<StructuredMemory>): StructuredMemory {
  const merged: StructuredMemory = {
    tech_stack: { ...existing.tech_stack },
    test_requirements: [...existing.test_requirements],
    edge_cases: [...existing.edge_cases],
    bug_patterns: [...existing.bug_patterns],
    conventions: { ...existing.conventions },
    api_endpoints: [...existing.api_endpoints],
    user_flows: [...existing.user_flows],
    custom: { ...existing.custom },
  };

  if (newMemory.tech_stack && typeof newMemory.tech_stack === 'object') {
    for (const [category, items] of Object.entries(newMemory.tech_stack)) {
      if (Array.isArray(items)) {
        if (!merged.tech_stack[category]) merged.tech_stack[category] = [];
        for (const item of items) {
          if (!merged.tech_stack[category].includes(item)) {
            merged.tech_stack[category].push(item);
          }
        }
      }
    }
  }

  if (newMemory.test_requirements && Array.isArray(newMemory.test_requirements)) {
    for (const item of newMemory.test_requirements) {
      if (!merged.test_requirements.includes(item)) {
        merged.test_requirements.push(item);
      }
    }
  }

  if (newMemory.edge_cases && Array.isArray(newMemory.edge_cases)) {
    for (const item of newMemory.edge_cases) {
      if (!merged.edge_cases.includes(item)) {
        merged.edge_cases.push(item);
      }
    }
  }

  if (newMemory.bug_patterns && Array.isArray(newMemory.bug_patterns)) {
    for (const item of newMemory.bug_patterns) {
      if (!merged.bug_patterns.includes(item)) {
        merged.bug_patterns.push(item);
      }
    }
  }

  if (newMemory.conventions && typeof newMemory.conventions === 'object') {
    merged.conventions = { ...merged.conventions, ...newMemory.conventions };
  }

  if (newMemory.api_endpoints && Array.isArray(newMemory.api_endpoints)) {
    for (const item of newMemory.api_endpoints) {
      if (!merged.api_endpoints.includes(item)) {
        merged.api_endpoints.push(item);
      }
    }
  }

  if (newMemory.user_flows && Array.isArray(newMemory.user_flows)) {
    for (const item of newMemory.user_flows) {
      if (!merged.user_flows.includes(item)) {
        merged.user_flows.push(item);
      }
    }
  }

  if (newMemory.custom && typeof newMemory.custom === 'object') {
    merged.custom = { ...merged.custom, ...newMemory.custom };
  }

  return merged;
}

export function filterMemoryByConfidence(entries: MemoryEntry[], minConfidence: number): MemoryEntry[] {
  return entries.filter(entry => entry.confidence >= minConfidence);
}

export function filterMemoryByCategory(entries: MemoryEntry[], categories: string[]): MemoryEntry[] {
  return entries.filter(entry => categories.includes(entry.category));
}

export function searchMemory(entries: MemoryEntry[], searchTerm: string): MemoryEntry[] {
  const term = searchTerm.toLowerCase();
  return entries.filter(entry => 
    entry.key.toLowerCase().includes(term) || 
    entry.value.toLowerCase().includes(term) ||
    entry.category.toLowerCase().includes(term)
  );
}

export function exportMemoryToJson(memory: StructuredMemory): string {
  return JSON.stringify(memory, null, 2);
}

export function importMemoryFromJson(json: string): StructuredMemory | null {
  try {
    const parsed = JSON.parse(json);
    return {
      tech_stack: typeof parsed.tech_stack === 'object' ? parsed.tech_stack : {},
      test_requirements: Array.isArray(parsed.test_requirements) ? parsed.test_requirements : [],
      edge_cases: Array.isArray(parsed.edge_cases) ? parsed.edge_cases : [],
      bug_patterns: Array.isArray(parsed.bug_patterns) ? parsed.bug_patterns : [],
      conventions: typeof parsed.conventions === 'object' ? parsed.conventions : {},
      api_endpoints: Array.isArray(parsed.api_endpoints) ? parsed.api_endpoints : [],
      user_flows: Array.isArray(parsed.user_flows) ? parsed.user_flows : [],
      custom: typeof parsed.custom === 'object' ? parsed.custom : {},
    };
  } catch {
    return null;
  }
}
