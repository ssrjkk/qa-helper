export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  requestsByTaskType: Record<string, number>;
  requestsByDay: Record<string, number>;
  responseTimes: number[];
}

const STORAGE_KEY = 'qa-metrics';

class MetricsCollector {
  private metrics: ApiMetrics;

  constructor() {
    this.metrics = this.loadMetrics();
  }

  private loadMetrics(): ApiMetrics {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && typeof parsed.totalRequests === 'number') {
          return parsed;
        }
      }
    } catch {
      if (import.meta.env.DEV) console.warn('[metrics] Failed to load metrics from localStorage');
    }
    return this.getEmptyMetrics();
  }

  private getEmptyMetrics(): ApiMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      requestsByTaskType: {},
      requestsByDay: {},
      responseTimes: []
    };
  }

  private saveMetrics(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metrics));
    } catch {
      if (import.meta.env.DEV) console.warn('[metrics] Failed to save metrics to localStorage');
    }
  }

  recordRequest(taskType: string, success: boolean, tokens: number = 0, responseTime: number = 0): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.totalTokens += tokens;
    } else {
      this.metrics.failedRequests++;
    }

    if (taskType) {
      this.metrics.requestsByTaskType[taskType] = (this.metrics.requestsByTaskType[taskType] || 0) + 1;
    }

    this.metrics.requestsByDay[today] = (this.metrics.requestsByDay[today] || 0) + 1;

    if (responseTime > 0) {
      this.metrics.responseTimes.push(responseTime);
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes.shift();
      }
      this.metrics.averageResponseTime = Math.round(
        this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      );
    }

    this.saveMetrics();
  }

  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100);
  }

  getTopTaskTypes(limit: number = 5): { type: string; count: number }[] {
    return Object.entries(this.metrics.requestsByTaskType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getLast7DaysRequests(): { date: string; count: number }[] {
    const result: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({ date: dateStr, count: this.metrics.requestsByDay[dateStr] || 0 });
    }
    return result;
  }

  reset(): void {
    this.metrics = this.getEmptyMetrics();
    this.saveMetrics();
  }
}

export const metricsCollector = new MetricsCollector();
