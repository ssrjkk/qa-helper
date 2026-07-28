/**
 * Telemetry buffer for client-side observability
 * @module telemetry
 * @author ssrjkk
 */

export interface TelemetryEvent {
  name: string;
  attributes: Record<string, string | number | boolean>;
  timestamp: number;
  severity: 'info' | 'warning' | 'error';
}

class TelemetryBuffer {
  private buffer: TelemetryEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private handleVisibility: (() => void) | null = null;
  private endpoint = '/api/telemetry';
  private maxBufferSize = 50;
  private flushMs = 30_000;

  start(): void {
    if (this.flushInterval) return;
    this.flushInterval = setInterval(() => this.flush(), this.flushMs);
    this.handleVisibility = () => {
      if (document.visibilityState === 'hidden') this.flush();
    };
    window.addEventListener('visibilitychange', this.handleVisibility);
  }

  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    if (this.handleVisibility) {
      window.removeEventListener('visibilitychange', this.handleVisibility);
      this.handleVisibility = null;
    }
    this.flush();
  }

  record(name: string, attributes: Record<string, string | number | boolean> = {}, severity: 'info' | 'warning' | 'error' = 'info'): void {
    this.buffer.push({ name, attributes, timestamp: Date.now(), severity });
    if (this.buffer.length >= this.maxBufferSize) this.flush();
  }

  recordPerformance(name: string, durationMs: number): void {
    this.record('perf', { name, durationMs }, durationMs > 1000 ? 'warning' : 'info');
  }

  recordError(code: string, message: string): void {
    this.record('error', { code, message }, 'error');
  }

  recordUserAction(action: string, target?: string): void {
    this.record('user_action', { action, target: target || '' });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const events = this.buffer.splice(0);
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch {
      // Buffer overflow — drop events, don't block UI
      if (import.meta.env.DEV) {
        console.warn(`[telemetry] Failed to flush ${events.length} events`);
      }
    }
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer.length = 0;
  }
}

export const telemetry = new TelemetryBuffer();
