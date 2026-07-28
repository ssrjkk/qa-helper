import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemoryEntry } from '../types/memory';

function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get store() { return store; },
  };
}

describe('BackupService', () => {
  let ls: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    ls = mockLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true });
  });

  it('creates and lists backups', async () => {
    const { BackupService } = await import('../lib/backupService');
    const projects = [{ id: 1, name: 'P1', created_at: '2025-01-01', updated_at: '2025-01-01' }];
    const entries: MemoryEntry[] = [{ id: 1, project_id: 1, category: 'bug_patterns', key: 'k', value: 'v', confidence: 0.9, created_at: '2025-01-01', updated_at: '2025-01-01' }];

    const meta = BackupService.createBackup(projects, entries);
    expect(meta).not.toBeNull();
    expect(meta!.projectsCount).toBe(1);
    expect(meta!.memoryCount).toBe(1);

    const list = BackupService.listBackups();
    expect(list).toHaveLength(1);
  });

  it('restores backup with valid checksum', async () => {
    const { BackupService } = await import('../lib/backupService');
    const projects = [{ id: 1, name: 'P1', created_at: '2025-01-01', updated_at: '2025-01-01' }];
    const entries: MemoryEntry[] = [{ id: 1, project_id: 1, category: 'bug_patterns', key: 'k', value: 'v', confidence: 0.9, created_at: '2025-01-01', updated_at: '2025-01-01' }];

    const meta = BackupService.createBackup(projects, entries);
    const restored = BackupService.restoreBackup(meta!.timestamp);
    expect(restored).not.toBeNull();
    expect(restored!.projects).toEqual(projects);
  });

  it('limits backups to MAX_BACKUPS', async () => {
    const { BackupService } = await import('../lib/backupService');
    for (let i = 0; i < 7; i++) {
      BackupService.createBackup([], []);
    }
    expect(BackupService.listBackups().length).toBeLessThanOrEqual(5);
  });

  it('deleteBackup removes from index', async () => {
    const { BackupService } = await import('../lib/backupService');
    const meta = BackupService.createBackup([], []);
    if (meta) BackupService.deleteBackup(meta.timestamp);
    expect(BackupService.listBackups()).toHaveLength(0);
  });

  it('resolveConflict picks newer by updated_at', async () => {
    const { BackupService } = await import('../lib/backupService');
    const local = [{ id: 1, name: 'Old', created_at: '2025-01-01', updated_at: '2025-01-01' }];
    const remote = [{ id: 1, name: 'New', created_at: '2025-01-01', updated_at: '2025-06-01' }];
    const result = BackupService.resolveConflict(local, [], remote, []);
    expect(result.projects[0]!.name).toBe('New');
  });
});
