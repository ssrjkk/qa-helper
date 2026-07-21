import type { Database } from 'sql.js';

export function rowToObject(columns: string[], values: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj;
}

export function queryAll<T>(db: Database, sql: string, params?: (string | number | null)[]): T[] {
  try {
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      results.push(rowToObject(cols, vals) as T);
    }
    stmt.free();
    return results;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[dbHelpers] queryAll failed:', sql, err);
    }
    return [];
  }
}

export function queryOne<T>(db: Database, sql: string, params?: (string | number | null)[]): T | undefined {
  try {
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    if (!stmt.step()) {
      stmt.free();
      return undefined;
    }
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    stmt.free();
    return rowToObject(cols, vals) as T;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[dbHelpers] queryOne failed:', sql, err);
    }
    return undefined;
  }
}

export function safeRun(db: Database, sql: string, params?: (string | number | null)[]): string | null {
  try {
    db.run(sql, params);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

export function execTransaction(db: Database, saveDb: () => void | Promise<void>, operations: (() => void)[]): string | null {
  try {
    db.run("BEGIN TRANSACTION");
    for (const op of operations) {
      op();
    }
    db.run("COMMIT");
    saveDb();
    return null;
  } catch (err) {
    db.run("ROLLBACK");
    return err instanceof Error ? err.message : String(err);
  }
}

export function insertAndReturnId(db: Database, saveDb: () => void | Promise<void>, sql: string, params?: (string | number | null)[]): number {
  try {
    db.run(sql, params);
    saveDb();
    const result = db.exec("SELECT last_insert_rowid() as id");
    return Number(result[0].values[0][0]);
  } catch {
    return -1;
  }
}

export function buildUpdateQuery<T extends Record<string, unknown>>(table: string, data: T, id: number): { sql: string; params: (string | number | null)[] } | null {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | null);
    }
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  return { sql: `UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`, params: values };
}
