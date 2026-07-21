export const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.cache', '__pycache__', '.venv', 'vendor',
]);

export const IGNORED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.DS_Store', 'Thumbs.db',
]);

export const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
  '.rb', '.php', '.cs', '.swift', '.kt', '.scala', '.vue', '.svelte',
  '.html', '.css', '.scss', '.less', '.json', '.yaml', '.yml',
  '.toml', '.sql', '.sh', '.bash', '.md', '.txt',
]);
