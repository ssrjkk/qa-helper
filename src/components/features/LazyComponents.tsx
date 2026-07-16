import { lazy, Suspense } from 'react';
import { GlassCard } from '../ui/GlassCard';

const LoadingFallback = () => (
  <GlassCard className="flex items-center justify-center h-64 animate-pulse">
    <span className="text-sm text-gray-400">Loading module...</span>
  </GlassCard>
);

export const LazyChatArea = lazy(() =>
  import('./ChatArea').then((m) => ({ default: m.ChatArea })),
);

export const LazyCodebasePanel = lazy(() =>
  import('./CodebasePanel').then((m) => ({ default: m.CodebasePanel })),
);

export const LazySessionHistory = lazy(() =>
  import('./SessionHistory').then((m) => ({ default: m.SessionHistory })),
);

export function LazySuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}
