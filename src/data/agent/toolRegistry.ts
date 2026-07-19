import type { CodebaseProvider } from '../codebase/CodebaseProvider';
import type { ToolCall, ToolResult } from './types';

export async function executeTool(
  toolCall: ToolCall,
  codebase: CodebaseProvider
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    let content: string;

    switch (toolCall.name) {
      case 'list_directory': {
        const path = String(toolCall.input.path || '');
        const files = await codebase.listTree(path);
        if (files.length === 0) {
          content = path ? `Directory "${path}" is empty or does not exist.` : 'Root directory is empty.';
        } else {
          const lines = files.map(f => {
            const icon = f.type === 'directory' ? '📁' : '📄';
            const size = f.size ? ` (${formatSize(f.size)})` : '';
            return `${icon} ${f.name}${size}`;
          });
          content = `Contents of "${path || '/'}":\n\n${lines.join('\n')}`;
        }
        break;
      }

      case 'read_file': {
        const path = String(toolCall.input.path || '');
        if (!path) {
          content = 'Error: file path is required.';
          break;
        }
        if (path.includes('..') || path.startsWith('/')) {
          content = 'Error: path traversal is not allowed.';
          break;
        }
        const fileContent = await codebase.readFile(path);
        const lineCount = fileContent.split('\n').length;
        content = `File: ${path} (${lineCount} lines)\n\n\`\`\`\n${fileContent}\n\`\`\``;
        break;
      }

      case 'search_code': {
        const pattern = String(toolCall.input.pattern || '');
        const ext = toolCall.input.file_extension ? String(toolCall.input.file_extension) : undefined;
        if (!pattern) {
          content = 'Error: search pattern is required.';
          break;
        }
        const results = await codebase.searchCode(pattern, ext);
        if (results.length === 0) {
          content = `No matches found for pattern "${pattern}".`;
        } else {
          const lines = results.map(r => `${r.path}:${r.line}: ${r.content}`);
          content = `Found ${results.length} matches for "${pattern}":\n\n${lines.join('\n')}`;
        }
        break;
      }

      default:
        content = `Unknown tool: ${toolCall.name}`;
    }

    const duration = Date.now() - startTime;
    if (duration > 5000) {
      content += `\n\n(took ${Math.round(duration / 1000)}s)`;
    }

    return { tool_use_id: toolCall.id, content };
  } catch (err) {
    return {
      tool_use_id: toolCall.id,
      content: `Tool error: ${err instanceof Error ? err.message : String(err)}`,
      is_error: true,
    };
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
