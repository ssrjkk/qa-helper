export interface ParsedToolCall {
  name: string;
  input: Record<string, unknown>;
}

export function parseToolCall(response: string): ParsedToolCall | null {
  const match = response.match(/```tool\s*\n([\s\S]*?)\n```/);
  if (!match) return null;

  try {
    const captured = match[1];
    if (!captured) return null;
    const parsed = JSON.parse(captured);
    if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string' && parsed.input) {
      return { name: parsed.name, input: parsed.input as Record<string, unknown> };
    }
  } catch {
    return null;
  }
  return null;
}
