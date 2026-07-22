import { describe, it, expect } from 'vitest';
import { TASK_TYPES } from '../config/tasks';
import { STRUCTURED_PROMPTS } from '../config/prompts';

describe('TASK_TYPES', () => {
  it('should have task types', () => {
    expect(TASK_TYPES.length).toBeGreaterThan(0);
  });

  it('should have required properties for each task', () => {
    TASK_TYPES.forEach(task => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('icon');
      expect(task).toHaveProperty('label');
      expect(task).toHaveProperty('color');
      expect(typeof task.id).toBe('string');
      expect(typeof task.icon).toBe('string');
      expect(typeof task.label).toBe('string');
      expect(task.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have unique ids', () => {
    const ids = TASK_TYPES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should include screenshot_analysis task', () => {
    const screenshotTask = TASK_TYPES.find(t => t.id === 'screenshot_analysis');
    expect(screenshotTask).toBeDefined();
    expect(screenshotTask?.icon).toBe('🖼️');
  });
});

describe('STRUCTURED_PROMPTS', () => {
  it('should have prompts for all task types', () => {
    TASK_TYPES.forEach(task => {
      expect(STRUCTURED_PROMPTS[task.id]).toBeDefined();
    });
  });

  it('should have system, userTemplate, outputFormat, qualityCriteria', () => {
    TASK_TYPES.forEach(task => {
      const prompt = STRUCTURED_PROMPTS[task.id]!;
      expect(typeof prompt.system).toBe('string');
      expect(typeof prompt.userTemplate).toBe('string');
      expect(typeof prompt.outputFormat).toBe('string');
      expect(Array.isArray(prompt.qualityCriteria)).toBe(true);
    });
  });

  it('should include context in userTemplate', () => {
    const prompt = STRUCTURED_PROMPTS['test_plan']!;
    expect(prompt.userTemplate).toContain('{context}');
  });

  it('should have specific prompts for different tasks', () => {
    expect(STRUCTURED_PROMPTS['bug_report']!.system).toBeDefined();
    expect(STRUCTURED_PROMPTS['test_cases']!.system).toBeDefined();
    expect(STRUCTURED_PROMPTS['automation_code']!.system).toBeDefined();
  });
});
