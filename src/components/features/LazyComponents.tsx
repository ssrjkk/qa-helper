/**
 * Lazy-loaded components for code splitting
 * @module LazyComponents
 * @author ssrjkk
 */

import { lazy, Suspense, Component, type ReactNode } from 'react';
import { GlassCard } from '../ui/GlassCard';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LazyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-red-400">Failed to load module</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
          >
            Retry
          </button>
        </GlassCard>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <GlassCard className="flex items-center justify-center h-64 animate-pulse">
    <span className="text-sm text-gray-400">Loading module...</span>
  </GlassCard>
);

export const LazyChatArea = lazy(() =>
  import('../chat/ChatArea').then((m) => ({ default: m.ChatArea })),
);

export const LazyCodebasePanel = lazy(() =>
  import('../panels/CodebasePanel').then((m) => ({ default: m.CodebasePanel })),
);

export const LazySessionHistory = lazy(() =>
  import('../panels/SessionHistory').then((m) => ({ default: m.SessionHistory })),
);

export const LazyScreenshotUploader = lazy(() =>
  import('../panels/ScreenshotUploader').then((m) => ({ default: m.ScreenshotUploader })),
);

export const LazyExportPanel = lazy(() =>
  import('../panels/ExportPanel').then((m) => ({ default: m.ExportPanel })),
);

export const LazyMetricsDashboard = lazy(() =>
  import('../panels/MetricsDashboard').then((m) => ({ default: m.MetricsDashboard })),
);

export function LazySuspense({ children }: { children: React.ReactNode }) {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </LazyErrorBoundary>
  );
}
