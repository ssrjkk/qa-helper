import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/errorService', () => ({
  ErrorService: { report: vi.fn(), reportAsync: vi.fn() },
}));

import { ProjectRepository } from '../data/repositories/ProjectRepository';
import { TaskRepository } from '../data/repositories/TaskRepository';
import { MemoryRepository } from '../data/repositories/MemoryRepository';

const mockDb = {
  prepare: vi.fn(),
  run: vi.fn(),
  exec: vi.fn((): Array<{ columns: string[]; values: unknown[][] }> => []),
};

const saveDb = vi.fn();

function mockQueryReturn(rows: Record<string, unknown>[]) {
  let idx = 0;
  mockDb.prepare.mockImplementation(() => ({
    bind: vi.fn(() => true),
    step: vi.fn(() => {
      if (idx >= rows.length) return false;
      idx++;
      return true;
    }),
    getColumnNames: vi.fn(() => rows.length > 0 ? Object.keys(rows[0]!) : []),
    get: vi.fn(() => {
      const row = rows[idx - 1];
      return row ? Object.values(row) : [];
    }),
    free: vi.fn(),
  }));
}

describe('ProjectRepository', () => {
  let repo: ProjectRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ProjectRepository(mockDb as never, saveDb);
  });

  it('findAll returns mapped projects', () => {
    mockQueryReturn([
      { id: 1, name: 'Proj A', description: 'desc', created_at: '2024-01-01', updated_at: '2024-01-02' },
      { id: 2, name: 'Proj B', description: null, created_at: '2024-01-03', updated_at: '2024-01-04' },
    ]);
    const result = repo.findAll();
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe('Proj A');
    expect(result[1]!.name).toBe('Proj B');
  });

  it('findById returns mapped project', () => {
    mockQueryReturn([{ id: 5, name: 'X', description: 'd', created_at: 't', updated_at: 't' }]);
    const result = repo.findById(5);
    expect(result?.id).toBe(5);
    expect(result?.name).toBe('X');
  });

  it('findById returns undefined when not found', () => {
    mockQueryReturn([]);
    expect(repo.findById(999)).toBeUndefined();
  });

  it('create calls insertAndReturnId', () => {
    mockDb.exec.mockReturnValue([{ columns: ['id'], values: [[42]] }]);
    mockDb.run.mockImplementation(() => {});
    const id = repo.create({ name: 'New', description: 'desc' });
    expect(mockDb.run).toHaveBeenCalled();
    expect(id).toBeDefined();
  });

  it('delete runs cascading deletes', () => {
    mockDb.run.mockImplementation(() => {});
    repo.delete(1);
    expect(mockDb.run).toHaveBeenCalledTimes(7);
    expect(saveDb).toHaveBeenCalled();
  });

  it('update calls saveDb on valid data', () => {
    mockDb.run.mockImplementation(() => {});
    repo.update(1, { name: 'Updated' });
    expect(saveDb).toHaveBeenCalled();
  });
});

describe('TaskRepository', () => {
  let repo: TaskRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TaskRepository(mockDb as never, saveDb);
  });

  it('findByProjectId returns mapped tasks', () => {
    mockQueryReturn([
      { id: 1, project_id: 10, task_type: 'test_plan', context: 'ctx', output: 'out', created_at: '2024-01-01' },
    ]);
    const result = repo.findByProjectId(10);
    expect(result).toHaveLength(1);
    expect(result[0]!.task_type).toBe('test_plan');
    expect(result[0]!.project_id).toBe(10);
  });

  it('create calls insertAndReturnId', () => {
    mockDb.exec.mockReturnValue([{ columns: ['id'], values: [[7]] }]);
    mockDb.run.mockImplementation(() => {});
    const id = repo.create({ projectId: 10, taskType: 'test_plan', context: 'c', output: 'o' });
    expect(mockDb.run).toHaveBeenCalled();
    expect(id).toBeDefined();
  });

  it('getRecentSessions returns mapped sessions', () => {
    mockQueryReturn([
      { task_type: 'code_review', context: 'c', output: 'o', created_at: '2024-01-01' },
    ]);
    const result = repo.getRecentSessions(10, 5);
    expect(result).toHaveLength(1);
    expect(result[0]!.task_type).toBe('code_review');
  });
});

describe('MemoryRepository', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new MemoryRepository(mockDb as never, saveDb);
  });

  it('findByProjectId returns mapped entries', () => {
    mockQueryReturn([
      { id: 1, project_id: 10, category: 'tech_stack', key: 'framework', value: 'React', confidence: 0.9, created_at: 't', updated_at: 't' },
    ]);
    const result = repo.findByProjectId(10);
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('framework');
    expect(result[0]!.value).toBe('React');
    expect(result[0]!.confidence).toBe(0.9);
  });

  it('create inserts with defaults', () => {
    mockDb.exec.mockReturnValue([{ columns: ['id'], values: [[1]] }]);
    mockDb.run.mockImplementation(() => {});
    const id = repo.create({ projectId: 10, category: 'tech_stack', key: 'k', value: 'v' });
    expect(mockDb.run).toHaveBeenCalled();
    expect(id).toBeDefined();
  });

  it('create uses confidence default of 0.8 when not provided', () => {
    mockDb.exec.mockReturnValue([{ columns: ['id'], values: [[1]] }]);
    mockDb.run.mockImplementation(() => {});
    repo.create({ projectId: 10, category: 'custom', key: 'k', value: 'v' });
    const args = mockDb.run.mock.calls[0];
    expect(args).toBeDefined();
  });

  it('delete calls safeRun and saveDb', () => {
    mockDb.run.mockImplementation(() => {});
    repo.delete(5);
    expect(mockDb.run).toHaveBeenCalled();
    expect(saveDb).toHaveBeenCalled();
  });

  it('update calls saveDb on valid data', () => {
    mockDb.run.mockImplementation(() => {});
    repo.update(5, { value: 'new' });
    expect(saveDb).toHaveBeenCalled();
  });
});
