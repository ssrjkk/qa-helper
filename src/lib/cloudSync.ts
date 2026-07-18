import type { Project } from '../types';
import type { MemoryEntry } from '../types/memory';
import { keyManager } from './keyManagement';

export interface CloudConfig {
  provider: 'local' | 'firebase' | 'supabase';
  apiKey?: string;
  projectId?: string;
  url?: string;
}

export interface SyncStatus {
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  error?: string;
  entriesCount: number;
}

export interface SyncData {
  version: number;
  exportedAt: string;
  projects: Project[];
  memoryEntries: MemoryEntry[];
}

const SYNC_KEY = 'qa-helper-sync';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export class CloudSyncService {
  private config: CloudConfig;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private status: SyncStatus = {
    lastSync: null,
    status: 'idle',
    entriesCount: 0,
  };

  constructor(config: CloudConfig = { provider: 'local' }) {
    this.config = config;
    this.loadStatus();
    this.loadConfig();
  }

  private loadStatus(): void {
    try {
      const saved = localStorage.getItem(SYNC_KEY + '-status');
      if (saved) {
        this.status = JSON.parse(saved);
      }
    } catch { /* failed to parse saved sync status, use default */ }
  }

  private saveStatus(): void {
    try {
      localStorage.setItem(SYNC_KEY + '-status', JSON.stringify(this.status));
      this.notifyListeners();
    } catch { /* localStorage may be full or unavailable */ }
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(SYNC_KEY + '-config');
      if (saved) {
        const parsed = JSON.parse(saved) as CloudConfig;
        if (parsed.apiKey && keyManager.isReady()) {
          keyManager.decryptApiKey(parsed.apiKey).then(decrypted => {
            if (decrypted) this.config = { ...parsed, apiKey: decrypted };
          }).catch(() => { this.config = parsed; });
        } else {
          this.config = parsed;
        }
      }
    } catch { /* failed to parse saved config, use default */ }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async configure(config: CloudConfig): Promise<void> {
    this.config = config;
    try {
      const toStore = { ...config };
      if (toStore.apiKey && keyManager.isReady()) {
        toStore.apiKey = await keyManager.encryptApiKey(toStore.apiKey);
      }
      localStorage.setItem(SYNC_KEY + '-config', JSON.stringify(toStore));
    } catch { /* localStorage may be full or unavailable */ }
  }

  getConfig(): CloudConfig {
    return { ...this.config };
  }

  async exportData(projects: Project[], memoryEntries: MemoryEntry[]): Promise<string> {
    const data: SyncData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      memoryEntries,
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonString: string): Promise<{ projects: Project[]; memoryEntries: MemoryEntry[] } | null> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return null;
      if (!Array.isArray(data.projects)) return null;
      if (data.projects.length > 0 && typeof data.projects[0] !== 'object') return null;
      if (data.memoryEntries !== undefined && !Array.isArray(data.memoryEntries)) return null;
      return {
        projects: data.projects as Project[],
        memoryEntries: Array.isArray(data.memoryEntries) ? (data.memoryEntries as MemoryEntry[]) : [],
      };
    } catch {
      return null;
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
      }
    }
    throw lastError ?? new Error('Max retry attempts exceeded');
  }

  async syncToCloud(projects: Project[], memoryEntries: MemoryEntry[]): Promise<boolean> {
    this.status = { ...this.status, status: 'syncing', error: undefined };
    this.saveStatus();

    try {
      let success = false;
      switch (this.config.provider) {
        case 'local':
          success = await this.syncToLocal(projects, memoryEntries);
          break;
        case 'firebase':
          success = await this.withRetry(() => this.syncToFirebase(projects, memoryEntries));
          break;
        case 'supabase':
          success = await this.withRetry(() => this.syncToSupabase(projects, memoryEntries));
          break;
        default:
          throw new Error('Unknown provider');
      }
      return success;
    } catch (err) {
      this.status = {
        ...this.status,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown sync error',
      };
      this.saveStatus();
      return false;
    }
  }

  private async syncToLocal(projects: Project[], memoryEntries: MemoryEntry[]): Promise<boolean> {
    const data = await this.exportData(projects, memoryEntries);
    localStorage.setItem(SYNC_KEY + '-backup', data);
    this.status = {
      lastSync: new Date().toISOString(),
      status: 'synced',
      entriesCount: projects.length,
    };
    this.saveStatus();
    return true;
  }

  private async syncToFirebase(projects: Project[], memoryEntries: MemoryEntry[]): Promise<boolean> {
    if (!this.config.apiKey || !this.config.url) {
      throw new Error('Firebase config missing');
    }
    
    const response = await fetch(`${this.config.url}/sync.json`, {
      method: 'PUT',
      headers: new Headers({
        'Authorization': `Bearer ${this.config.apiKey}`,
      }),
      body: JSON.stringify(await this.exportData(projects, memoryEntries)),
    });

    if (!response.ok) throw new Error('Firebase sync failed');

    this.status = {
      lastSync: new Date().toISOString(),
      status: 'synced',
      entriesCount: projects.length,
    };
    this.saveStatus();
    return true;
  }

  private async syncToSupabase(projects: Project[], memoryEntries: MemoryEntry[]): Promise<boolean> {
    if (!this.config.url || !this.config.apiKey) {
      throw new Error('Supabase config missing');
    }

    const data = await this.exportData(projects, memoryEntries);
    const response = await fetch(`${this.config.url}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey,
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) throw new Error('Supabase sync failed');

    this.status = {
      lastSync: new Date().toISOString(),
      status: 'synced',
      entriesCount: projects.length,
    };
    this.saveStatus();
    return true;
  }

  async syncFromCloud(): Promise<{ projects: Project[]; memoryEntries: MemoryEntry[] } | null> {
    try {
      let data: { projects: Project[]; memoryEntries: MemoryEntry[] } | null = null;
      
      switch (this.config.provider) {
        case 'local': {
          const stored = localStorage.getItem(SYNC_KEY + '-backup');
          if (!stored) return null;
          data = await this.importData(stored);
          break;
        }
        case 'firebase': {
          if (!this.config.apiKey || !this.config.url) return null;
          const response = await this.withRetry(() => 
            fetch(`${this.config.url}/sync.json`, {
              headers: new Headers({
                'Authorization': `Bearer ${this.config.apiKey}`,
              }),
            })
          );
          if (!response.ok) return null;
          const json = await response.json();
          data = await this.importData(JSON.stringify(json));
          break;
        }
        case 'supabase': {
          if (!this.config.url || !this.config.apiKey) return null;
          const response = await this.withRetry(() => fetch(`${this.config.url}/sync`, {
            headers: new Headers({
              'apikey': this.config.apiKey || '',
              'Authorization': `Bearer ${this.config.apiKey}`,
            }),
          }));
          if (!response.ok) return null;
          const { data: jsonData } = await response.json();
          data = await this.importData(jsonData);
          break;
        }
        default:
          return null;
      }
      
      if (data) {
        this.status = {
          ...this.status,
          status: 'synced',
          lastSync: new Date().toISOString(),
        };
        this.saveStatus();
      }
      
      return data;
    } catch {
      return null;
    }
  }

  generateShareLink(projects: Project[], memoryEntries: MemoryEntry[]): string {
    const data = btoa(encodeURIComponent(JSON.stringify({ projects, memoryEntries })));
    return `${window.location.origin}?share=${data}`;
  }

  parseShareLink(url: string): { projects: Project[]; memoryEntries: MemoryEntry[] } | null {
    try {
      const params = new URL(url).searchParams;
      const share = params.get('share');
      if (!share) return null;
      return JSON.parse(decodeURIComponent(atob(share)));
    } catch {
      return null;
    }
  }

  async backupToFile(projects: Project[], memoryEntries: MemoryEntry[]): Promise<void> {
    const data = await this.exportData(projects, memoryEntries);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-helper-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async restoreFromFile(file: File): Promise<{ projects: Project[]; memoryEntries: MemoryEntry[] } | null> {
    try {
      const text = await file.text();
      return await this.importData(text);
    } catch {
      return null;
    }
  }

  clearLocalBackup(): void {
    localStorage.removeItem(SYNC_KEY + '-backup');
  }

  hasLocalBackup(): boolean {
    return localStorage.getItem(SYNC_KEY + '-backup') !== null;
  }
}

export const cloudSync = new CloudSyncService();
