export interface CodebaseFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface CodebaseSearchResult {
  path: string;
  line: number;
  content: string;
}

export interface CodebaseProvider {
  readonly name: string;
  readonly isReady: boolean;
  listTree(path?: string): Promise<CodebaseFile[]>;
  readFile(path: string): Promise<string>;
  searchCode(pattern: string, fileGlob?: string): Promise<CodebaseSearchResult[]>;
  getStructureSummary(): Promise<string>;
}
