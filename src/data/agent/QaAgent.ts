import type { UnifiedAiService } from '../api/UnifiedAiService';
import type { CodebaseProvider } from '../codebase/CodebaseProvider';
import type { AgentStep, AgentResult } from './types';
import { executeTool } from './toolRegistry';
import { parseToolCall } from '../../lib/toolParser';

const AGENT_SYSTEM_PROMPT = `You are a world-class Senior QA Engineer and Test Architect acting as an autonomous AI agent. You have access to the user's codebase through tools.

Your capabilities:
- List directory structures to understand project architecture
- Read source files to understand implementation details
- Search code for patterns, functions, classes, and references

Your workflow:
1. First, explore the project structure (list_directory)
2. Read relevant source files to understand the code
3. Search for related patterns (imports, usages, tests)
4. Then generate comprehensive, production-ready QA artifacts based on the ACTUAL code

Critical rules:
- ALWAYS explore the codebase first before generating output
- Base ALL generated content on real code you've read, not assumptions
- Include specific file paths, function names, and line references from the actual code
- If the user asks for tests, reference the actual function signatures and types
- Generate complete, runnable code - no TODOs, no placeholders, no stubs
- Use the project's existing patterns, imports, and conventions
- Be thorough: read multiple files to understand the full picture

When you have gathered enough information, produce your final comprehensive output.`;

const TOOL_CALL_FORMAT = `To use a tool, respond with EXACTLY this format (no other text around it):

\`\`\`tool
{"name": "tool_name", "input": {"param": "value"}}
\`\`\`

Available tools:
{tools}

If you do NOT need a tool, simply respond with your analysis as plain text. Do NOT use tool format unless you actually need a tool.`;

let globalStepCounter = 0;

function createStepId(): string {
  return `step_${++globalStepCounter}_${Date.now()}`;
}

function buildToolDescriptions(): string {
  return [
    '- list_directory: List files and subdirectories. Args: {"path": "relative/path"} (use "" for root)',
    '- read_file: Read file contents. Args: {"path": "src/file.ts"}',
    '- search_code: Search codebase by regex. Args: {"pattern": "regex", "file_extension": ".ts" (optional)}',
  ].join('\n');
}

export class QaAgent {
  private codebase: CodebaseProvider;
  private aiService: UnifiedAiService;
  private isAborted = false;

  constructor(codebase: CodebaseProvider, aiService: UnifiedAiService) {
    this.codebase = codebase;
    this.aiService = aiService;
  }

  abort(): void {
    this.isAborted = true;
    this.aiService.abort();
  }

  async run(
    task: string,
    options: {
      onChunk?: (text: string) => void;
      onStep?: (step: AgentStep) => void;
      signal?: AbortSignal;
      maxIterations?: number;
    } = {}
  ): Promise<AgentResult> {
    this.isAborted = false;

    const maxIterations = options.maxIterations ?? 12;
    const steps: AgentStep[] = [];
    let iterations = 0;

    const emitStep = (step: AgentStep) => {
      steps.push(step);
      options.onStep?.(step);
    };

    let structureSummary: string;
    try {
      structureSummary = await this.codebase.getStructureSummary();
    } catch {
      structureSummary = '(unable to retrieve project structure)';
    }

    const systemPrompt = `${AGENT_SYSTEM_PROMPT}

Connected codebase: ${this.codebase.name}

Project structure:
${structureSummary}

${TOOL_CALL_FORMAT.replace('{tools}', buildToolDescriptions())}

Remember: Start by listing directories and reading relevant files. Only produce final output after exploring the codebase.`;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: task },
    ];

    while (iterations < maxIterations && !this.isAborted) {
      iterations++;

      emitStep({
        id: createStepId(),
        type: 'thinking',
        content: `Analyzing... (iteration ${iterations}/${maxIterations})`,
        timestamp: Date.now(),
      });

      const recentMessages = messages.slice(-6);
      const conversationHistory = recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const omitted = messages.length - recentMessages.length;
      const contextPrefix = omitted > 0 ? `[Earlier ${omitted} messages omitted for brevity]\n\n` : '';
      const userMessage = `${contextPrefix}${conversationHistory}\n\nContinue your analysis. If you need more information, use a tool. If you have enough information, provide your final comprehensive output.`;

      let result: { success: boolean; output?: string; error?: string };
      try {
        result = await this.aiService.executeWithRetry({
          systemPrompt,
          userMessage,
          onChunk: options.onChunk,
        });
      } catch (err) {
        if (this.isAborted) break;
        emitStep({
          id: createStepId(),
          type: 'error',
          content: `API error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          timestamp: Date.now(),
        });
        break;
      }

      if (!result.success || !result.output) {
        emitStep({
          id: createStepId(),
          type: 'error',
          content: result.error || 'Failed to get response from AI model',
          timestamp: Date.now(),
        });
        break;
      }

      const responseText = result.output;

      emitStep({
        id: createStepId(),
        type: 'text',
        content: responseText,
        timestamp: Date.now(),
      });

      const toolCall = parseToolCall(responseText);

      if (toolCall) {
        messages.push({ role: 'assistant', content: responseText });

        emitStep({
          id: createStepId(),
          type: 'tool_call',
          content: `Using ${toolCall.name}...`,
          toolName: toolCall.name,
          toolInput: toolCall.input,
          timestamp: Date.now(),
        });

        let toolResult: Awaited<ReturnType<typeof executeTool>>;
        try {
          toolResult = await executeTool(
            { id: `tc_${iterations}`, name: toolCall.name, input: toolCall.input },
            this.codebase
          );
        } catch (err) {
          toolResult = {
            tool_use_id: `tc_${iterations}`,
            content: `Tool error: ${err instanceof Error ? err.message : String(err)}`,
            is_error: true,
          };
        }

        const truncatedContent = toolResult.content.length > 15000
          ? `${toolResult.content.slice(0, 15_000)}\n... (truncated, ${toolResult.content.length - 15000} chars omitted)`
          : toolResult.content;

        emitStep({
          id: createStepId(),
          type: 'tool_result',
          content: truncatedContent.length > 200 ? `${truncatedContent.slice(0, 200)}...` : truncatedContent,
          toolName: toolCall.name,
          toolOutput: truncatedContent,
          timestamp: Date.now(),
        });

        messages.push({
          role: 'user',
          content: `TOOL RESULT (${toolCall.name}):\n${truncatedContent}`,
        });

        continue;
      }

      return {
        output: responseText,
        steps,
        iterations,
      };
    }

    const lastTextStep = [...steps].reverse().find(s => s.type === 'text');
    return {
      output: lastTextStep?.content || 'Agent completed without generating output.',
      steps,
      iterations,
    };
  }
}
