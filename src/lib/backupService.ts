/**
 * Auto-backup service with versioning and conflict resolution
 * @module backupService
 * @author ssrjkk
 */

import { STORAGE_KEYS, ErrorCode } from './constants';
import { ErrorService } from './errorService';
import type { Project } from '../types';
import type { MemoryEntry } from '../types/memory';

const BACKUP_VERSION = 1;
const MAX_BACKUPS = 5;
const AUTO_BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface BackupMeta {
  version: number;
  timestamp: string;
  checksum: string;
  projectsCount: number;
  memoryCount: number;
}

interface BackupData {
  meta: BackupMeta;
  projects: Project[];
  memoryEntries: MemoryEntry[];
}

function computeChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function loadBackupIndex(): BackupMeta[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.backupIndex);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    if (import.meta.env.DEV) console.warn('[backupService] Failed to load backup index');
  }
  return [];
}

function saveBackupIndex(index: BackupMeta[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.backupIndex, JSON.stringify(index));
  } catch {
    if (import.meta.env.DEV) console.warn('[backupService] Failed to save backup index');
  }
}

function loadBackupData(timestamp: string): BackupData | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const saved = localStorage.getItem(`${STORAGE_KEYS.backupPrefix}${timestamp}`);
    if (saved) return JSON.parse(saved);
  } catch {
    if (import.meta.env.DEV) console.warn('[backupService] Failed to load backup data');
  }
  return null;
}

function saveBackupData(data: BackupData): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.backupPrefix}${data.meta.timestamp}`,
      JSON.stringify(data),
    );
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      ErrorService.report(ErrorCode.STORAGE_SAVE, 'Backup quota exceeded', { operation: 'saveBackupData' }, false);
    }
    return false;
  }
}

function deleteBackupData(timestamp: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_KEYS.backupPrefix}${timestamp}`);
  } catch {
    // Ignore cleanup errors
  }
}

let autoBackupTimer: ReturnType<typeof setInterval> | null = null;
let lastKnownProjects: Project[] = [];
let lastKnownMemory: MemoryEntry[] = [];

export const BackupService = {
  createBackup(projects: Project[], memoryEntries: MemoryEntry[]): BackupMeta | null {
    const dataStr = JSON.stringify({ projects, memoryEntries });
    const checksum = computeChecksum(dataStr);

    const meta: BackupMeta = {
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      checksum,
      projectsCount: projects.length,
      memoryCount: memoryEntries.length,
    };

    const backupData: BackupData = { meta, projects, memoryEntries };

    if (!saveBackupData(backupData)) return null;

    const index = loadBackupIndex();
    index.unshift(meta);
    if (index.length > MAX_BACKUPS) {
      const removed = index.splice(MAX_BACKUPS);
      for (const old of removed) {
        deleteBackupData(old.timestamp);
      }
    }
    saveBackupIndex(index);

    return meta;
  },

  listBackups(): BackupMeta[] {
    return loadBackupIndex();
  },

  restoreBackup(timestamp: string): { projects: Project[]; memoryEntries: MemoryEntry[] } | null {
    const data = loadBackupData(timestamp);
    if (!data) return null;

    const expectedChecksum = computeChecksum(JSON.stringify({
      projects: data.projects,
      memoryEntries: data.memoryEntries,
    }));

    if (expectedChecksum !== data.meta.checksum) {
      ErrorService.report(ErrorCode.STORAGE_LOAD, 'Backup checksum mismatch — data may be corrupted', {
        timestamp,
        expected: data.meta.checksum,
        actual: expectedChecksum,
      }, false);
      return null;
    }

    return {
      projects: data.projects,
      memoryEntries: data.memoryEntries,
    };
  },

  deleteBackup(timestamp: string): void {
    deleteBackupData(timestamp);
    const index = loadBackupIndex().filter(m => m.timestamp !== timestamp);
    saveBackupIndex(index);
  },

  hasConflicts(incoming: BackupMeta): { hasConflict: boolean; newerBackup?: BackupMeta } {
    const index = loadBackupIndex();
    const latest = index[0];
    if (!latest) return { hasConflict: false };
    if (new Date(incoming.timestamp) <= new Date(latest.timestamp)) {
      return { hasConflict: true, newerBackup: latest };
    }
    return { hasConflict: false };
  },

  resolveConflict(local: Project[], localMemory: MemoryEntry[], remote: Project[], _remoteMemory: MemoryEntry[]): { projects: Project[]; memoryEntries: MemoryEntry[] } {
    const projectMap = new Map<number, Project>();
    for (const p of local) projectMap.set(p.id, p);
    for (const p of remote) {
      const existing = projectMap.get(p.id);
      if (!existing || new Date(p.updated_at) > new Date(existing.updated_at)) {
        projectMap.set(p.id, p);
      }
    }

    const entryMap = new Map<string, MemoryEntry>();
    for (const e of localMemory) entryMap.set(String(e.id), e);
    for (const e of _remoteMemory) {
      const existing = entryMap.get(String(e.id));
      if (!existing || new Date(e.updated_at) > new Date(existing.updated_at)) {
        entryMap.set(String(e.id), e);
      }
    }

    return {
      projects: Array.from(projectMap.values()),
      memoryEntries: Array.from(entryMap.values()),
    };
  },

  startAutoBackup(getData: () => { projects: Project[]; memoryEntries: MemoryEntry[] }): void {
    this.stopAutoBackup();
    autoBackupTimer = setInterval(() => {
      try {
        const { projects, memoryEntries } = getData();
        const changed =
          JSON.stringify(projects) !== JSON.stringify(lastKnownProjects) ||
          JSON.stringify(memoryEntries) !== JSON.stringify(lastKnownMemory);
        if (changed) {
          this.createBackup(projects, memoryEntries);
          lastKnownProjects = projects;
          lastKnownMemory = memoryEntries;
        }
      } catch {
        if (import.meta.env.DEV) console.warn('[backupService] Auto-backup failed');
      }
    }, AUTO_BACKUP_INTERVAL_MS);
  },

  stopAutoBackup(): void {
    if (autoBackupTimer !== null) {
      clearInterval(autoBackupTimer);
      autoBackupTimer = null;
    }
  },
};
