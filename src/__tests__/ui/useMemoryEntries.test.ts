import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemoryEntries } from '../../hooks/useMemoryEntries';

vi.mock('../../lib/cloudSync', () => ({
  cloudSync: { syncToCloud: vi.fn() },
}));

const mockDb = {
  createMemoryEntry: vi.fn(),
  deleteMemoryEntry: vi.fn(),
  updateMemoryEntry: vi.fn(),
  getMemoryEntries: vi.fn(() => []),
  createProject: vi.fn(() => 1),
  projects: [{ id: 1, name: 'Test' }],
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('useMemoryEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a memory entry', () => {
    const { result } = renderHook(() => useMemoryEntries(1, mockDb));
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.handleAddEntry({ project_id: 1, category: 'custom', key: 'k', value: 'v' } as any);
    });
    expect(mockDb.createMemoryEntry).toHaveBeenCalledOnce();
  });

  it('deletes a memory entry', () => {
    const { result } = renderHook(() => useMemoryEntries(1, mockDb));
    act(() => result.current.handleDeleteEntry(5));
    expect(mockDb.deleteMemoryEntry).toHaveBeenCalledWith(5);
  });

  it('updates a memory entry', () => {
    const { result } = renderHook(() => useMemoryEntries(1, mockDb));
    act(() => result.current.handleUpdateEntry(1, { value: 'new' }));
    expect(mockDb.updateMemoryEntry).toHaveBeenCalledWith(1, { value: 'new' });
  });

  it('does not add entry when no project selected', () => {
    const { result } = renderHook(() => useMemoryEntries(null, mockDb));
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.handleAddEntry({ project_id: 1, category: 'custom', key: 'k', value: 'v' } as any);
    });
    expect(mockDb.createMemoryEntry).not.toHaveBeenCalled();
  });

  it('handles export', () => {
    const { result } = renderHook(() => useMemoryEntries(1, mockDb));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exported = result.current.handleExportProject({ id: 1, name: 'Test' } as any);
    expect(typeof exported).toBe('string');
  });
});
