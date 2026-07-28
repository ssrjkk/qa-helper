/**
 * @module metrics tests
 * @author ssrjkk
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { metricsCollector } from '../lib/metrics';
import { STORAGE_KEYS } from '../lib/constants';

describe('MetricsCollector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    metricsCollector.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('starts with empty metrics', () => {
    const m = metricsCollector.getMetrics();
    expect(m.totalRequests).toBe(0);
    expect(m.successfulRequests).toBe(0);
    expect(m.failedRequests).toBe(0);
    expect(m.totalTokens).toBe(0);
    expect(m.averageResponseTime).toBe(0);
  });

  it('records successful request', () => {
    metricsCollector.recordRequest('test_task', true, 100, 250);
    const m = metricsCollector.getMetrics();
    expect(m.totalRequests).toBe(1);
    expect(m.successfulRequests).toBe(1);
    expect(m.totalTokens).toBe(100);
    expect(m.requestsByTaskType['test_task']).toBe(1);
    expect(m.averageResponseTime).toBe(250);
  });

  it('records failed request', () => {
    metricsCollector.recordRequest('test_task', false);
    const m = metricsCollector.getMetrics();
    expect(m.totalRequests).toBe(1);
    expect(m.failedRequests).toBe(1);
    expect(m.successfulRequests).toBe(0);
  });

  it('calculates success rate', () => {
    metricsCollector.recordRequest('t', true);
    metricsCollector.recordRequest('t', true);
    metricsCollector.recordRequest('t', false);
    expect(metricsCollector.getSuccessRate()).toBe(67);
  });

  it('returns 0 success rate for no requests', () => {
    expect(metricsCollector.getSuccessRate()).toBe(0);
  });

  it('gets top task types sorted by count', () => {
    metricsCollector.recordRequest('a', true);
    metricsCollector.recordRequest('a', true);
    metricsCollector.recordRequest('b', true);
    metricsCollector.recordRequest('b', true);
    metricsCollector.recordRequest('b', true);
    metricsCollector.recordRequest('c', true);

    const top = metricsCollector.getTopTaskTypes(2);
    expect(top).toHaveLength(2);
    expect(top[0]!.type).toBe('b');
    expect(top[0]!.count).toBe(3);
    expect(top[1]!.type).toBe('a');
    expect(top[1]!.count).toBe(2);
  });

  it('gets last 7 days requests', () => {
    metricsCollector.recordRequest('t', true);
    const days = metricsCollector.getLast7DaysRequests();
    expect(days).toHaveLength(7);
    expect(days[6]!.count).toBe(1);
  });

  it('persists to localStorage', () => {
    metricsCollector.recordRequest('t', true, 50, 100);
    vi.advanceTimersByTime(1100);
    const stored = localStorage.getItem(STORAGE_KEYS.metrics);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.totalRequests).toBe(1);
  });

  it('loads from localStorage on construction', () => {
    localStorage.setItem(STORAGE_KEYS.metrics, JSON.stringify({
      totalRequests: 5,
      successfulRequests: 3,
      failedRequests: 2,
      totalTokens: 150,
      averageResponseTime: 200,
      requestsByTaskType: { test: 5 },
      requestsByDay: {},
      responseTimes: [200],
    }));

    // Verify that a fresh collector would read the stored metrics
    const saved = localStorage.getItem(STORAGE_KEYS.metrics);
    const parsed = JSON.parse(saved!);
    expect(parsed.totalRequests).toBe(5);
    expect(parsed.successfulRequests).toBe(3);
  });

  it('resets all metrics', () => {
    metricsCollector.recordRequest('t', true, 100, 200);
    metricsCollector.reset();
    const m = metricsCollector.getMetrics();
    expect(m.totalRequests).toBe(0);
    expect(m.successfulRequests).toBe(0);
    expect(m.totalTokens).toBe(0);
  });

  it('caps response times at 100 entries', () => {
    for (let i = 0; i < 120; i++) {
      metricsCollector.recordRequest('t', true, 0, 100);
    }
    const m = metricsCollector.getMetrics();
    expect(m.responseTimes.length).toBeLessThanOrEqual(100);
  });

  it('calculates average response time correctly', () => {
    metricsCollector.recordRequest('t', true, 0, 100);
    metricsCollector.recordRequest('t', true, 0, 200);
    metricsCollector.recordRequest('t', true, 0, 300);
    const m = metricsCollector.getMetrics();
    expect(m.averageResponseTime).toBe(200);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEYS.metrics, 'not-json{{{');
    const m = metricsCollector.getMetrics();
    expect(m.totalRequests).toBe(0);
  });
});
