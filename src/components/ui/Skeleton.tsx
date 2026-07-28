/**
 * Skeleton loading components
 * @module Skeleton
 * @author ssrjkk
 */

interface SkeletonProps {
  className?: string;
  count?: number;
}

function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`animate-pulse bg-white/5 rounded ${className}`} />
        ))}
      </div>
    );
  }
  return <div className={`animate-pulse bg-white/5 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
