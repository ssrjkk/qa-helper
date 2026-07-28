/**
 * @module migrations tests
 * @author ssrjkk
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/errorService', () => ({
  ErrorService: {
    report: vi.fn(),
    reportAsync: vi.fn(),
  },
}));

import { runMigrations, getSchemaVersion } from '../lib/migrations';

function createMockDb() {
  const tables = new Map<string, string[]>();
  const indexes = new Map<string, string>();
  const migrationsApplied: number[] = [];

  return {
    run: vi.fn((sql: string, params?: unknown[]) => {
      if (sql.startsWith('BEGIN')) return;
      if (sql === 'COMMIT') return;
      if (sql === 'ROLLBACK') return;

      if (sql.includes('CREATE TABLE IF NOT EXISTS _schema_migrations')) {
        if (!tables.has('_schema_migrations')) {
          tables.set('_schema_migrations', ['version INTEGER PRIMARY KEY', 'name TEXT NOT NULL', 'applied_at TEXT DEFAULT CURRENT_TIMESTAMP']);
        }
        return;
      }

      if (sql.includes('INSERT INTO _schema_migrations')) {
        const version = params?.[0];
        if (typeof version === 'number') migrationsApplied.push(version);
        return;
      }

      if (sql.includes('CREATE TABLE IF NOT EXISTS')) {
        const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (match?.[1]) tables.set(match[1], ['id INTEGER PRIMARY KEY']);
        return;
      }

      if (sql.includes('CREATE INDEX IF NOT EXISTS')) {
        const match = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/);
        if (match?.[1]) indexes.set(match[1], 'created');
        return;
      }
    }),
    exec: vi.fn((sql: string) => {
      if (sql.includes('SELECT version FROM _schema_migrations')) {
        if (migrationsApplied.length === 0) return [];
        return [{ values: migrationsApplied.map(v => [v]) }];
      }
      return [];
    }),
    tables,
    indexes,
    migrationsApplied,
  };
}

describe('migrations', () => {
  it('getSchemaVersion returns 0 for empty database', () => {
    const db = createMockDb();
    const version = getSchemaVersion(db as unknown as Parameters<typeof getSchemaVersion>[0]);
    expect(version).toBe(0);
  });

  it('runMigrations applies all migrations from scratch', () => {
    const db = createMockDb();
    const result = runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(result.applied).toBe(3);
    expect(result.currentVersion).toBe(3);
    expect(db.migrationsApplied).toContain(1);
    expect(db.migrationsApplied).toContain(2);
    expect(db.migrationsApplied).toContain(3);
  });

  it('runMigrations skips already applied migrations', () => {
    const db = createMockDb();
    // Apply first run
    runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    const firstCount = db.migrationsApplied.length;

    // Second run — should apply 0
    const result = runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(result.applied).toBe(0);
    expect(db.migrationsApplied.length).toBe(firstCount);
  });

  it('creates migration tracking table', () => {
    const db = createMockDb();
    runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(db.tables.has('_schema_migrations')).toBe(true);
  });

  it('creates core tables in migration 1', () => {
    const db = createMockDb();
    runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(db.tables.has('projects')).toBe(true);
    expect(db.tables.has('tasks')).toBe(true);
    expect(db.tables.has('screenshots')).toBe(true);
    expect(db.tables.has('conversation_history')).toBe(true);
  });

  it('creates memory_entries table in migration 2', () => {
    const db = createMockDb();
    runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(db.tables.has('memory_entries')).toBe(true);
  });

  it('creates indexes in migration 3', () => {
    const db = createMockDb();
    runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(db.indexes.has('idx_tasks_project')).toBe(true);
    expect(db.indexes.has('idx_conv_project')).toBe(true);
    expect(db.indexes.has('idx_screenshots_task')).toBe(true);
  });

  it('creates memory indexes in migration 2', () => {
    const db = createMockDb();
    runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(db.indexes.has('idx_memory_project')).toBe(true);
    expect(db.indexes.has('idx_memory_category')).toBe(true);
  });

  it('migration runs within transaction', () => {
    const db = createMockDb();
    runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    // Each migration should have BEGIN + COMMIT = 2 transaction calls per migration
    // 3 migrations × 2 = 6 transaction-related calls
    const transactionCalls = db.run.mock.calls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] === 'BEGIN TRANSACTION' || c[0] === 'COMMIT')
    );
    expect(transactionCalls.length).toBe(6);
  });

  it('handles partial migration failure gracefully', () => {
    const db = createMockDb();
    let callCount = 0;
    db.run.mockImplementation((sql: string) => {
      callCount++;
      if (callCount === 5) throw new Error('Simulated failure');
      if (sql.startsWith('BEGIN')) return;
      if (sql === 'COMMIT') return;
      if (sql === 'ROLLBACK') return;
      if (sql.includes('CREATE TABLE IF NOT EXISTS')) {
        const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (match?.[1]) db.tables.set(match[1], ['id INTEGER PRIMARY KEY']);
        return;
      }
      if (sql.includes('CREATE INDEX IF NOT EXISTS')) {
        const match = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/);
        if (match?.[1]) db.indexes.set(match[1], 'created');
        return;
      }
    });

    const result = runMigrations(db as unknown as Parameters<typeof runMigrations>[0]);
    expect(result.applied).toBeLessThan(3);
  });
});
