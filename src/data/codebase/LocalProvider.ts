import type { CodebaseFile, CodebaseProvider, CodebaseSearchResult } from './CodebaseProvider';
import type { ZipFileEntry } from '../../workers/zipParser.worker';
import { IGNORED_DIRS, IGNORED_FILES, CODE_EXTENSIONS } from './constants';

interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  content?: string;
}

export class LocalProvider implements CodebaseProvider {
  readonly name: string;
  private files: Map<string, FileEntry> = new Map();
  private _isReady = false;

  constructor(name: string) {
    this.name = name;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  async loadFromDataTransfer(items: DataTransferItemList): Promise<void> {
    this.files.clear();
    const entries: FileSystemEntry[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }

    await Promise.all(entries.map(entry => this.walkEntry(entry, '')));
    this._isReady = true;
  }

  async loadFromFiles(files: ZipFileEntry[]): Promise<void> {
    this.files.clear();

    for (const entry of files) {
      const parts = entry.path.split('/');
      const name = parts[parts.length - 1];
      if (this.isIgnored(name)) continue;

      const ext = '.' + name.split('.').pop()?.toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) continue;

      this.files.set(entry.path, {
        path: entry.path,
        name,
        type: 'file',
        size: entry.size,
        content: entry.content,
      });

      let currentPath = '';
      for (const part of parts.slice(0, -1)) {
        const dirPath = currentPath ? `${currentPath}/${part}` : part;
        if (!this.files.has(dirPath)) {
          this.files.set(dirPath, {
            path: dirPath,
            name: part,
            type: 'directory',
            size: 0,
          });
        }
        currentPath = dirPath;
      }
    }

    this._isReady = true;
  }

  private isIgnored(name: string): boolean {
    return IGNORED_DIRS.has(name) || IGNORED_FILES.has(name);
  }

  private async walkEntry(entry: FileSystemEntry, basePath: string): Promise<void> {
    const path = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      this.files.set(path, { path, name: entry.name, type: 'directory', size: 0 });

      if (this.isIgnored(entry.name)) return;

      try {
        const reader = dirEntry.createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          const allEntries: FileSystemEntry[] = [];
          const readBatch = () => {
            reader.readEntries((batch) => {
              if (batch.length === 0) {
                resolve(allEntries);
              } else {
                allEntries.push(...batch);
                readBatch();
              }
            }, reject);
          };
          readBatch();
        });

        await Promise.all(entries.map(e => this.walkEntry(e, path)));
      } catch { /* skip unreadable directories */ }
    } else if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const ext = '.' + entry.name.split('.').pop()?.toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) return;

      try {
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });

        if (file.size > 500_000) return;

        const content = await file.text();
        this.files.set(path, {
          path,
          name: entry.name,
          type: 'file',
          size: file.size,
          content,
        });
      } catch { /* skip unreadable files */ }
    }
  }

  async listTree(path = ''): Promise<CodebaseFile[]> {
    const results: CodebaseFile[] = [];
    const prefix = path ? `${path}/` : '';

    for (const [key, entry] of this.files) {
      if (!key.startsWith(prefix)) continue;

      const relative = key.slice(prefix.length);
      if (!relative) continue;

      const depth = relative.split('/').length - 1;
      if (depth > 0 && entry.type === 'file') continue;
      if (depth > 0 && entry.type === 'directory') {
        const nextSlash = relative.indexOf('/');
        const dirName = nextSlash === -1 ? relative : relative.slice(0, nextSlash);
        if (results.some(r => r.name === dirName && r.type === 'directory')) continue;
      }

      if (entry.type === 'file' && depth === 0) {
        results.push({ path: entry.path, name: entry.name, type: 'file', size: entry.size });
      } else if (entry.type === 'directory' && depth === 0) {
        results.push({ path: entry.path, name: entry.name, type: 'directory' });
      }
    }

    return results.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async readFile(path: string): Promise<string> {
    const entry = this.files.get(path);
    if (!entry?.content) {
      return `// File not found: ${path}`;
    }
    return entry.content;
  }

  async searchCode(pattern: string, fileGlob?: string): Promise<CodebaseSearchResult[]> {
    const regex = new RegExp(pattern, 'gi');
    const results: CodebaseSearchResult[] = [];

    for (const [path, entry] of this.files) {
      if (entry.type !== 'file' || !entry.content) continue;
      if (fileGlob && !path.includes(fileGlob)) continue;

      const lines = entry.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push({ path, line: i + 1, content: lines[i].trim() });
          regex.lastIndex = 0;
        }
        if (results.length >= 50) return results;
      }
    }

    return results;
  }

  async getStructureSummary(): Promise<string> {
    const lines: string[] = [this.name, ''];

    const renderPath = (prefix: string, currentPath: string): void => {
      const dirs: FileEntry[] = [];
      const files: FileEntry[] = [];

      for (const [, entry] of this.files) {
        const parent = entry.path.substring(0, entry.path.lastIndexOf('/'));
        if (parent === currentPath) {
          if (entry.type === 'directory') dirs.push(entry);
          else files.push(entry);
        }
      }

      dirs.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => a.name.localeCompare(b.name));

      for (const dir of dirs) {
        lines.push(`${prefix}${dir.name}/`);
        renderPath(prefix + '  ', dir.path);
      }

      for (const file of files) {
        lines.push(`${prefix}${file.name}`);
      }
    };

    renderPath('', '');
    return lines.join('\n');
  }

  getFileCount(): number {
    let count = 0;
    for (const entry of this.files.values()) {
      if (entry.type === 'file') count++;
    }
    return count;
  }
}
