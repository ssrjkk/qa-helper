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

export function buildPrompt(taskId: string, context: string, projectMemory?: string): { system: string; user: string } {
  const prompt = STRUCTURED_PROMPTS[taskId];

  if (!prompt) {
    return {
      system: DEFAULT_SYSTEM,
      user: context,
    };
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

  return {
    system: prompt.system,
    user: userPrompt,
  };
}
