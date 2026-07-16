import type { ToolDefinition } from './types';

export const QA_TOOLS: ToolDefinition[] = [
  {
    name: 'list_directory',
    description: 'List files and subdirectories in a directory of the connected codebase. Returns file names, types, and paths. Use root path "" to list top-level.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path relative to repo root. Use "" for root directory.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the full contents of a source code file. Returns the file content as text. Use this to understand implementation details before generating tests.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to repo root (e.g. "src/components/Login.tsx")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_code',
    description: 'Search the codebase for a pattern (regex supported). Returns matching lines with file paths and line numbers. Use to find specific functions, classes, or patterns.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Search pattern (regex). Example: "function login|export.*authenticate"',
        },
        file_extension: {
          type: 'string',
          description: 'Optional file extension filter. Example: ".tsx" or ".py"',
        },
      },
      required: ['pattern'],
    },
  },
];
