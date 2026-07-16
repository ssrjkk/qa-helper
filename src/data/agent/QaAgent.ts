import type { CodebaseProvider } from '../codebase/CodebaseProvider';
import type {
  AgentStep,
  AgentResult,
  LlmMessage,
  LlmContentBlock,
  LlmResponse,
  ToolCall,
} from './types';
import { QA_TOOLS } from './toolDefinitions';
import { executeTool } from './toolRegistry';

const AGENT_SYSTEM_PROMPT = `You are a world-class Senior QA Engineer and Test Architect acting as an autonomous AI agent. You have access to the user's codebase through tools.

Your capabilities:
- Read directory structures to understand project architecture
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

let stepCounter = 0;

function createStepId(): string {
  return `step_${++stepCounter}_${Date.now()}`;
}

export class QaAgent {
  private codebase: CodebaseProvider;
  private apiKey: string;
  private abortController: AbortController | null = null;
  private isAborted = false;

  constructor(codebase: CodebaseProvider, apiKey: string) {
    this.codebase = codebase;
    this.apiKey = apiKey;
  }

  abort(): void {
    this.isAborted = true;
    this.abortController?.abort();
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
    this.abortController = new AbortController();

    const combinedSignal = options.signal
      ? AbortSignal.any([options.signal, this.abortController.signal])
      : this.abortController.signal;

    const maxIterations = options.maxIterations ?? 12;
    const steps: AgentStep[] = [];
    const messages: LlmMessage[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const emitStep = (step: AgentStep) => {
      steps.push(step);
      options.onStep?.(step);
    };

    const structureSummary = await this.codebase.getStructureSummary();

    const systemPrompt = `${AGENT_SYSTEM_PROMPT}

Connected codebase: ${this.codebase.name}

Project structure:
${structureSummary}

Remember: Use the tools above to explore the codebase. Start by listing directories and reading relevant files.`;

    messages.push({
      role: 'user',
      content: task,
    });

    let iterations = 0;

    while (iterations < maxIterations && !this.isAborted) {
      iterations++;

      emitStep({
        id: createStepId(),
        type: 'thinking',
        content: `Analyzing... (iteration ${iterations}/${maxIterations})`,
        timestamp: Date.now(),
      });

      const response = await this.callLlm(systemPrompt, messages, combinedSignal);

      if (!response) {
        emitStep({
          id: createStepId(),
          type: 'error',
          content: 'Failed to get response from AI model',
          timestamp: Date.now(),
        });
        break;
      }

      totalInputTokens += response.usage?.inputTokens || 0;
      totalOutputTokens += response.usage?.outputTokens || 0;

      if (response.text) {
        emitStep({
          id: createStepId(),
          type: 'text',
          content: response.text,
          timestamp: Date.now(),
        });

        options.onChunk?.(response.text);
      }

      if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') {
        return {
          output: response.text,
          steps,
          totalTokens: totalInputTokens + totalOutputTokens,
          iterations,
        };
      }

      if (response.stop_reason === 'tool_use' && response.toolCalls.length > 0) {
        const assistantContent: LlmContentBlock[] = [];

        if (response.text) {
          assistantContent.push({ type: 'text', text: response.text });
        }

        for (const toolCall of response.toolCalls) {
          assistantContent.push({
            type: 'tool_use',
            id: toolCall.id,
            name: toolCall.name,
            input: toolCall.input,
          });
        }

        messages.push({ role: 'assistant', content: assistantContent });

        const toolResults: LlmContentBlock[] = [];

        for (const toolCall of response.toolCalls) {
          if (this.isAborted) break;

          emitStep({
            id: createStepId(),
            type: 'tool_call',
            content: `Using ${toolCall.name}...`,
            toolName: toolCall.name,
            toolInput: toolCall.input,
            timestamp: Date.now(),
          });

          const result = await executeTool(toolCall, this.codebase);

          const truncatedContent = result.content.length > 15000
            ? result.content.slice(0, 15000) + '\n... (truncated)'
            : result.content;

          emitStep({
            id: createStepId(),
            type: 'tool_result',
            content: truncatedContent.slice(0, 200) + (truncatedContent.length > 200 ? '...' : ''),
            toolName: toolCall.name,
            toolOutput: truncatedContent,
            timestamp: Date.now(),
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: result.tool_use_id,
            content: truncatedContent,
            is_error: result.is_error,
          });
        }

        messages.push({ role: 'user', content: toolResults });
      }
    }

    const lastTextStep = [...steps].reverse().find(s => s.type === 'text');
    return {
      output: lastTextStep?.content || 'Agent completed without generating output.',
      steps,
      totalTokens: totalInputTokens + totalOutputTokens,
      iterations,
    };
  }

  private async callLlm(
    systemPrompt: string,
    messages: LlmMessage[],
    signal: AbortSignal
  ): Promise<LlmResponse | null> {
    const claudeApiUrl = 'https://api.anthropic.com/v1/messages';

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: QA_TOOLS,
    };

    try {
      const response = await fetch(claudeApiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('LLM API error:', response.status, errorData);
        return null;
      }

      const data = await response.json();

      const textParts: string[] = [];
      const toolCalls: ToolCall[] = [];

      for (const block of data.content || []) {
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }

      return {
        content: data.content || [],
        stop_reason: data.stop_reason,
        text: textParts.join(''),
        toolCalls,
        usage: data.usage
          ? { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens }
          : undefined,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null;
      console.error('LLM call failed:', err);
      return null;
    }
  }
}
