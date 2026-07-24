import { GENERATE_PROMPTS } from './generate';
import { ANALYZE_PROMPTS } from './analyze';
import { REVIEW_PROMPTS } from './review';
import { SETUP_PROMPTS } from './setup';

export interface StructuredPrompt {
  system: string;
  userTemplate: string;
  outputFormat: string;
  qualityCriteria: string[];
}

export const STRUCTURED_PROMPTS: Record<string, StructuredPrompt> = {
  ...GENERATE_PROMPTS,
  ...ANALYZE_PROMPTS,
  ...REVIEW_PROMPTS,
  ...SETUP_PROMPTS,
};

const DEFAULT_SYSTEM = 'You are a world-class Senior QA Engineer and Test Architect.';

const buildPromptCache = new Map<string, { system: string; user: string }>();

export function buildPrompt(taskId: string, context: string, projectMemory?: string): { system: string; user: string } {
  const cacheKey = `${taskId}\0${context}\0${projectMemory ?? ''}`;
  const cached = buildPromptCache.get(cacheKey);
  if (cached) return cached;

  const prompt = STRUCTURED_PROMPTS[taskId];

  if (!prompt) {
    const result = { system: DEFAULT_SYSTEM, user: context };
    if (buildPromptCache.size > 100) buildPromptCache.clear();
    buildPromptCache.set(cacheKey, result);
    return result;
  }

  let userPrompt = prompt.userTemplate.replace(/\{context\}/g, context);

  if (projectMemory) {
    userPrompt = `## Project Memory/Context\n${projectMemory}\n\n${userPrompt}`;
  }

  if (prompt.outputFormat) {
    userPrompt = `${userPrompt}\n\n## Output Format\n${prompt.outputFormat}`;
  }

  if (prompt.qualityCriteria.length > 0) {
    userPrompt = `${userPrompt}\n\n## Quality Criteria\n${prompt.qualityCriteria.map(c => `- ${c}`).join('\n')}`;
  }

  const result = { system: prompt.system, user: userPrompt };
  if (buildPromptCache.size > 100) buildPromptCache.clear();
  buildPromptCache.set(cacheKey, result);
  return result;
}
