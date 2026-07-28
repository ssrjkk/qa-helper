import { describe, it, expect } from 'vitest';
import { ProjectSchema, validate } from '../lib/validation';

describe('validate()', () => {
  it('returns success with data on valid input', () => {
    const result = validate(ProjectSchema, { name: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as { name: string }).name).toBe('Test');
  });

  it('returns error string on invalid input', () => {
    const result = validate(ProjectSchema, {});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
  });
});

describe('ProjectSchema', () => {
  it('accepts valid project', () => {
    expect(ProjectSchema.validate({ name: 'My Project' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(ProjectSchema.validate({ name: '' }).success).toBe(false);
  });

  it('rejects name > 100 chars', () => {
    expect(ProjectSchema.validate({ name: 'x'.repeat(101) }).success).toBe(false);
  });
});
