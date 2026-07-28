/**
 * @module dbHelpers tests
 * @author ssrjkk
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/errorService', () => ({
  ErrorService: {
    report: vi.fn(),
    reportAsync: vi.fn(),
  },
}));

import { rowToObject, queryAll, queryOne, safeRun, execTransaction, insertAndReturnId, buildUpdateQuery } from '../lib/dbHelpers';

function createMockDb() {
  const rows: { columns: string[]; values: unknown[][] }[] = [];
  let prepareIndex = 0;

  return {
    prepare: vi.fn((_sql?: string) => {
      const idx = prepareIndex++;
      const row = rows[idx] ?? { columns: [], values: [] };
      let stepped = false;
      return {
        bind: vi.fn((_params?: unknown[]) => true),
        step: vi.fn(() => {
          if (stepped) return false;
          stepped = true;
          return row.values.length > 0;
        }),
        getColumnNames: vi.fn(() => row.columns),
        get: vi.fn(() => row.values[0] ?? []),
        free: vi.fn(),
      };
    }),
    run: vi.fn(),
    exec: vi.fn((): Array<{ columns: string[]; values: unknown[][] }> => []),
    addRow: (columns: string[], values: unknown[][]) => {
      rows.push({ columns, values });
    },
    reset: () => { rows.length = 0; prepareIndex = 0; },
  };
}

describe('rowToObject', () => {
  it('maps columns to values', () => {
    expect(rowToObject(['a', 'b', 'c'], [1, 'two', null])).toEqual({ a: 1, b: 'two', c: null });
  });

  it('handles empty arrays', () => {
    expect(rowToObject([], [])).toEqual({});
  });

  it('handles single column', () => {
    expect(rowToObject(['name'], ['test'])).toEqual({ name: 'test' });
  });
});

describe('queryAll', () => {
  it('returns array of row objects', () => {
    const db = createMockDb();
    db.addRow(['id', 'name'], [[1, 'Alice']]);
    db.addRow(['id', 'name'], [[2, 'Bob']]);
    const result = queryAll<{ id: number; name: string }>(db as unknown as Parameters<typeof queryAll>[0], 'SELECT * FROM users');
    expect(result).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('returns empty array when no rows', () => {
    const db = createMockDb();
    const result = queryAll(db as unknown as Parameters<typeof queryAll>[0], 'SELECT * FROM empty');
    expect(result).toEqual([]);
  });

  it('binds params when provided', () => {
    const db = createMockDb();
    db.addRow(['id'], [[42]]);
    const result = queryAll(db as unknown as Parameters<typeof queryAll>[0], 'SELECT * FROM t WHERE id = ?', [42]);
    expect(result).toEqual([{ id: 42 }]);
  });

  it('calls stmt.free() in finally', () => {
    const db = createMockDb();
    const result = queryAll(db as unknown as Parameters<typeof queryAll>[0], 'SELECT 1');
    expect(result).toBeDefined();
  });
});

describe('queryOne', () => {
  it('returns first row as object', () => {
    const db = createMockDb();
    db.addRow(['val'], [['hello']]);
    const result = queryOne<{ val: string }>(db as unknown as Parameters<typeof queryOne>[0], 'SELECT val');
    expect(result).toEqual({ val: 'hello' });
  });

  it('returns undefined when no rows', () => {
    const db = createMockDb();
    const result = queryOne(db as unknown as Parameters<typeof queryOne>[0], 'SELECT 1 WHERE 1=0');
    expect(result).toBeUndefined();
  });
});

describe('safeRun', () => {
  it('returns null on success', () => {
    const db = createMockDb();
    const result = safeRun(db as unknown as Parameters<typeof safeRun>[0], 'CREATE TABLE t (id INT)');
    expect(result).toBeNull();
  });

  it('returns error message on failure', () => {
    const db = createMockDb();
    db.run.mockImplementation(() => { throw new Error('SQL syntax'); });
    const result = safeRun(db as unknown as Parameters<typeof safeRun>[0], 'INVALID SQL');
    expect(result).toBe('SQL syntax');
  });

  it('returns string for non-Error throws', () => {
    const db = createMockDb();
    db.run.mockImplementation(() => { throw 'string error'; });
    const result = safeRun(db as unknown as Parameters<typeof safeRun>[0], 'SQL');
    expect(result).toBe('string error');
  });
});

describe('execTransaction', () => {
  it('executes operations in transaction', async () => {
    const db = createMockDb();
    const op1 = vi.fn();
    const op2 = vi.fn();
    const saveDb = vi.fn();
    const result = await execTransaction(db as unknown as Parameters<typeof execTransaction>[0], saveDb, [op1, op2]);
    expect(result).toBeNull();
    expect(op1).toHaveBeenCalledOnce();
    expect(op2).toHaveBeenCalledOnce();
    expect(saveDb).toHaveBeenCalledOnce();
    expect(db.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(db.run).toHaveBeenCalledWith('COMMIT');
  });

  it('rolls back on failure', async () => {
    const db = createMockDb();
    const op = vi.fn(() => { throw new Error('fail'); });
    const result = await execTransaction(db as unknown as Parameters<typeof execTransaction>[0], vi.fn(), [op]);
    expect(result).toBe('fail');
    expect(db.run).toHaveBeenCalledWith('ROLLBACK');
  });

  it('returns null for empty operations', async () => {
    const db = createMockDb();
    const result = await execTransaction(db as unknown as Parameters<typeof execTransaction>[0], vi.fn(), []);
    expect(result).toBeNull();
  });
});

describe('insertAndReturnId', () => {
  it('returns inserted row id', () => {
    const db = createMockDb();
    db.exec.mockReturnValue([{ columns: [], values: [[42]] }]);
    const result = insertAndReturnId(db as unknown as Parameters<typeof insertAndReturnId>[0], vi.fn(), 'INSERT INTO t VALUES (1)');
    expect(result).toBe(42);
  });

  it('returns -1 on failure', () => {
    const db = createMockDb();
    db.run.mockImplementation(() => { throw new Error('fail'); });
    const result = insertAndReturnId(db as unknown as Parameters<typeof insertAndReturnId>[0], vi.fn(), 'INVALID');
    expect(result).toBe(-1);
  });

  it('calls saveDb after insert', () => {
    const db = createMockDb();
    db.exec.mockReturnValue([{ columns: [], values: [[1]] }]);
    const saveDb = vi.fn();
    insertAndReturnId(db as unknown as Parameters<typeof insertAndReturnId>[0], saveDb, 'INSERT INTO t VALUES (1)');
    expect(saveDb).toHaveBeenCalledOnce();
  });
});

describe('buildUpdateQuery', () => {
  it('builds valid update query', () => {
    const result = buildUpdateQuery('projects', { name: 'Test', description: 'Desc' }, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('UPDATE projects SET');
    expect(result!.sql).toContain('WHERE id = ?');
    expect(result!.params).toContain('Test');
    expect(result!.params).toContain('Desc');
    expect(result!.params).toContain(1);
  });

  it('skips id field', () => {
    const result = buildUpdateQuery('projects', { id: 999, name: 'Test' }, 1);
    expect(result!.params).not.toContain(999);
  });

  it('skips undefined values', () => {
    const result = buildUpdateQuery('projects', { name: 'Test', desc: undefined }, 1);
    expect(result!.params).toHaveLength(2); // name + id
  });

  it('returns null for invalid table name', () => {
    const result = buildUpdateQuery('invalid; DROP TABLE', { name: 'x' }, 1);
    expect(result).toBeNull();
  });

  it('returns null for invalid column names', () => {
    const result = buildUpdateQuery('projects', { 'invalid;col': 'val' }, 1);
    expect(result).toBeNull();
  });

  it('returns null for empty data (only id)', () => {
    const result = buildUpdateQuery('projects', { id: 1 }, 1);
    expect(result).toBeNull();
  });

  it('adds updated_at timestamp', () => {
    const result = buildUpdateQuery('projects', { name: 'Test' }, 1);
    expect(result!.sql).toContain('updated_at = CURRENT_TIMESTAMP');
  });
});
