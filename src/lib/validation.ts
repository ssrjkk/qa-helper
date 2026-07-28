/**
 * Lightweight validation (no external dependencies)
 * @module validation
 * @author ssrjkk
 */

interface ValidationSchema {
  validate(data: unknown): { success: true } | { success: false; error: string };
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

export const ProjectSchema: ValidationSchema = {
  validate(data: unknown) {
    if (!isRecord(data)) return { success: false, error: 'Invalid data' };
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      return { success: false, error: 'Project name is required' };
    }
    if (data.name.length > 100) {
      return { success: false, error: 'Name too long' };
    }
    return { success: true };
  },
};

export type ProjectInput = { name: string; description?: string };

export function validate<T>(schema: ValidationSchema & { validate(data: unknown): { success: true } | { success: false; error: string } }, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.validate(data);
  if (result.success) return { success: true, data: data as T };
  return { success: false, error: result.error };
}
