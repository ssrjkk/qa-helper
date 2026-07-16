export interface AgentStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text' | 'error';
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: string;
  timestamp: number;
  duration?: number;
}

export interface AgentResult {
  output: string;
  steps: AgentStep[];
  totalTokens?: number;
  iterations: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string | LlmContentBlock[];
}

export interface LlmContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

export interface LlmResponse {
  content: LlmContentBlock[];
  stop_reason: 'end_turn' | 'max_tokens' | 'tool_use';
  text: string;
  toolCalls: ToolCall[];
  usage?: { inputTokens: number; outputTokens: number };
}

export interface AgentExecuteOptions {
  systemPrompt: string;
  userMessage: string;
  signal?: AbortSignal;
  onChunk?: (text: string) => void;
  onStep?: (step: AgentStep) => void;
  maxIterations?: number;
}
