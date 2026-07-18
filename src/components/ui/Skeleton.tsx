import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  lines?: number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const reduced = useReducedMotion();

  const base = 'bg-white/5 rounded';
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} aria-busy="true" aria-label="Loading">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className={`${base} ${variants.text}`}
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              ...(width ? { width } : {}),
              ...(height ? { height } : {}),
            }}
            {...(reduced
              ? {}
              : {
                  animate: { opacity: [0.4, 0.7, 0.4] },
                  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                })}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-busy="true"
      aria-label="Loading"
      {...(reduced
        ? {}
        : {
            animate: { opacity: [0.4, 0.7, 0.4] },
            transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          })}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 ${className}`} aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="2rem" height="2rem" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" className="h-3" />
        </div>
      </div>
      <Skeleton lines={2} />
    </div>
  );
}
