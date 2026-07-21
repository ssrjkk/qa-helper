import type { CodebaseFile, CodebaseProvider, CodebaseSearchResult } from './CodebaseProvider';
import { IGNORED_DIRS, IGNORED_FILES, CODE_EXTENSIONS } from './constants';

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

const MAX_CACHE_SIZE = 100;

export class GitHubProvider implements CodebaseProvider {
  readonly name: string;
  private owner: string;
  private repo: string;
  private branch: string;
  private token?: string;
  private treeCache: Map<string, CodebaseFile[]> = new Map();
  private fileCache: Map<string, string> = new Map();

  private evictOldestEntry<K, V>(map: Map<K, V>): void {
    const firstKey = map.keys().next().value;
    if (firstKey !== undefined) map.delete(firstKey);
  }

  constructor(owner: string, repo: string, branch = 'main', token?: string) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.token = token;
    this.name = `${owner}/${repo}`;
  }

  get isReady(): boolean {
    return true;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    return headers;
  }

  async listTree(path = ''): Promise<CodebaseFile[]> {
    const cacheKey = path;
    if (this.treeCache.has(cacheKey)) {
      return this.treeCache.get(cacheKey)!;
    }

    try {
      const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`;
      const response = await fetch(url, { headers: this.getHeaders() });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data: GitHubContentItem[] = await response.json();

      const files: CodebaseFile[] = data
        .filter(item => {
          if (item.type === 'dir') return !IGNORED_DIRS.has(item.name);
          if (item.type === 'file') {
            if (IGNORED_FILES.has(item.name)) return false;
            const ext = `.${item.name.split('.').pop()?.toLowerCase()}`;
            return CODE_EXTENSIONS.has(ext);
          }
          return false;
        })
        .map(item => ({
          path: item.path,
          name: item.name,
          type: item.type === 'dir' ? 'directory' as const : 'file' as const,
          size: item.size,
        }))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      if (this.treeCache.size >= MAX_CACHE_SIZE) this.evictOldestEntry(this.treeCache);
      this.treeCache.set(cacheKey, files);
      return files;
    } catch {
      return [];
    }
  }

  async readFile(path: string): Promise<string> {
    if (this.fileCache.has(path)) {
      return this.fileCache.get(path)!;
    }

    try {
      const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to read ${path}: ${response.status}`);
      }

      const text = await response.text();

      if (text.length > 100_000) {
        return `${text.slice(0, 100_000)}\n// ... truncated (file too large)`;
      }

      if (this.fileCache.size >= MAX_CACHE_SIZE) this.evictOldestEntry(this.fileCache);
      this.fileCache.set(path, text);
      return text;
    } catch (err) {
      return `// Error reading file: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async searchCode(pattern: string, fileGlob?: string): Promise<CodebaseSearchResult[]> {
    try {
      let query = `${pattern} repo:${this.owner}/${this.repo}`;
      if (fileGlob) query += ` filename:${fileGlob}`;

      const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=20`;
      const response = await fetch(url, { headers: this.getHeaders() });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.items || []).map((item: { path: string; text_matches?: Array<{ fragment: string }> }) => ({
        path: item.path,
        line: 0,
        content: item.text_matches?.[0]?.fragment || '',
      }));
    } catch {
      return [];
    }
  }

  async getStructureSummary(): Promise<string> {
    const lines: string[] = [`${this.name} (${this.branch})`, ''];

    const renderTree = async (path: string, prefix: string, depth: number): Promise<void> => {
      if (depth > 3) return;
      const items = await this.listTree(path);
      for (const item of items) {
        if (item.type === 'directory') {
          lines.push(`${prefix}${item.name}/`);
          await renderTree(item.path, prefix + '  ', depth + 1);
        } else {
          lines.push(`${prefix}${item.name}`);
        }
      }
    };

    await renderTree('', '', 0);
    return lines.join('\n');
  }

  clearCache(): void {
    this.treeCache.clear();
    this.fileCache.clear();
  }
}
