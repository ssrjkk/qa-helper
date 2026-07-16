import JSZip from 'jszip';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.cache', '__pycache__', '.venv', 'vendor',
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
  '.rb', '.php', '.cs', '.swift', '.kt', '.scala', '.vue', '.svelte',
  '.html', '.css', '.scss', '.less', '.json', '.yaml', '.yml',
  '.toml', '.sql', '.sh', '.bash', '.md', '.txt',
]);

export interface ZipFileEntry {
  path: string;
  name: string;
  content: string;
  size: number;
  lastModified: Date;
}

export interface ZipParseResult {
  files: ZipFileEntry[];
  totalSize: number;
  fileCount: number;
  parseTimeMs: number;
}

interface WorkerRequest {
  requestId: number;
  data: ArrayBuffer;
  filename: string;
}

interface WorkerResponse {
  requestId: number;
  success: boolean;
  result?: ZipParseResult;
  error?: string;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const startTime = performance.now();
  const { requestId, data } = event.data;

  try {
    const zip = await JSZip.loadAsync(data);
    const files: ZipFileEntry[] = [];
    let totalSize = 0;

    const filePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir || relativePath.startsWith('__MACOSX')) return;

      const parts = relativePath.split('/');
      const name = parts[parts.length - 1];
      if (!name) return;

      const lowerName = name.toLowerCase();
      if (IGNORED_DIRS.has(name) || name === '.DS_Store' || name === 'Thumbs.db') return;

      const ext = '.' + lowerName.split('.').pop();
      if (!CODE_EXTENSIONS.has(ext)) return;

      const promise = zipEntry.async('string').then((content) => {
        const fileSize = content.length;
        totalSize += fileSize;

        files.push({
          path: relativePath,
          name,
          content,
          size: fileSize,
          lastModified: zipEntry.date,
        });
      });
      filePromises.push(promise);
    });

    await Promise.all(filePromises);

    const parseTimeMs = performance.now() - startTime;

    const result: ZipParseResult = {
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
      totalSize,
      fileCount: files.length,
      parseTimeMs,
    };

    const response: WorkerResponse = { requestId, success: true, result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      requestId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};
