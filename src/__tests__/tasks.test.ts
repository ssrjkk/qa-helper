import { describe, it, expect } from 'vitest';
import { TASK_TYPES, TASK_PROMPTS } from '../config/tasks';

describe('TASK_TYPES', () => {
  it('should have 17 task types', () => {
    expect(TASK_TYPES).toHaveLength(17);
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

describe('TASK_PROMPTS', () => {
  it('should have prompts for all task types', () => {
    TASK_TYPES.forEach(task => {
      expect(TASK_PROMPTS[task.id]).toBeDefined();
      expect(typeof TASK_PROMPTS[task.id]).toBe('function');
    });
  });

  it('should include context in prompt', () => {
    const prompt = TASK_PROMPTS.test_plan('my context');
    expect(prompt).toContain('my context');
  });

  it('should have specific prompts for different tasks', () => {
    expect(TASK_PROMPTS.bug_report('ctx')).toContain('bug report');
    expect(TASK_PROMPTS.test_cases('ctx')).toContain('test cases');
    expect(TASK_PROMPTS.automation_code('ctx')).toContain('automation');
  });
});
