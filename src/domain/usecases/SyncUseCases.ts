import { Project } from '../entities';
import { MemoryEntry } from '../entities/Memory';

export type SyncProvider = 'local' | 'firebase' | 'supabase';

export interface SyncConfig {
  provider: SyncProvider;
  apiKey?: string;
  projectId?: string;
  url?: string;
}

export interface SyncData {
  version: number;
  exportedAt: string;
  projects: Project[];
  memoryEntries: MemoryEntry[];
}

export interface SyncResult {
  success: boolean;
  error?: string;
  lastSync?: string;
}

export class SyncUseCases {
  private config: SyncConfig = { provider: 'local' };
  private lastSync: string | null = null;

  configure(config: SyncConfig): void {
    this.config = config;
    this.persistConfig();
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  private persistConfig(): void {
    localStorage.setItem('qa-helper-sync-config', JSON.stringify(this.config));
  }

  exportData(projects: Project[], memoryEntries: MemoryEntry[]): string {
    const data: SyncData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      memoryEntries,
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): SyncData | null {
    try {
      const data = JSON.parse(jsonString) as SyncData;
      if (!data.version || !data.projects) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  async syncToCloud(projects: Project[], memoryEntries: MemoryEntry[]): Promise<SyncResult> {
    try {
      switch (this.config.provider) {
        case 'local':
          return this.syncToLocal(projects, memoryEntries);
        case 'firebase':
          return this.syncToFirebase(projects, memoryEntries);
        case 'supabase':
          return this.syncToSupabase(projects, memoryEntries);
        default:
          return { success: false, error: 'Unknown provider' };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  private syncToLocal(projects: Project[], memoryEntries: MemoryEntry[]): SyncResult {
    const data = this.exportData(projects, memoryEntries);
    localStorage.setItem('qa-helper-sync-backup', data);
    this.lastSync = new Date().toISOString();
    return { success: true, lastSync: this.lastSync };
  }

  private async syncToFirebase(projects: Project[], memoryEntries: MemoryEntry[]): Promise<SyncResult> {
    if (!this.config.apiKey || !this.config.url) {
      return { success: false, error: 'Firebase config missing' };
    }
    
    const data = this.exportData(projects, memoryEntries);
    const response = await fetch(`${this.config.url}/sync.json?auth=${this.config.apiKey}`, {
      method: 'PUT',
      body: data,
    });

    if (!response.ok) {
      return { success: false, error: 'Firebase sync failed' };
    }

    this.lastSync = new Date().toISOString();
    return { success: true, lastSync: this.lastSync };
  }

  private async syncToSupabase(projects: Project[], memoryEntries: MemoryEntry[]): Promise<SyncResult> {
    if (!this.config.url || !this.config.apiKey) {
      return { success: false, error: 'Supabase config missing' };
    }

    const data = this.exportData(projects, memoryEntries);
    const response = await fetch(`${this.config.url}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey,
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      return { success: false, error: 'Supabase sync failed' };
    }

    this.lastSync = new Date().toISOString();
    return { success: true, lastSync: this.lastSync };
  }

  getShareLink(projects: Project[], memoryEntries: MemoryEntry[]): string {
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

  getLastSync(): string | null {
    return this.lastSync;
  }
}

export const syncUseCases = new SyncUseCases();
