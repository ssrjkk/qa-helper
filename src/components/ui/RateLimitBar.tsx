/**
 * Rate limit progress bar
 * @module RateLimitBar
 * @author ssrjkk
 */

import { memo } from 'react';
import { SECURITY_CONFIG } from '../../config';

interface RateLimitBarProps {
  remaining: number;
}

export const RateLimitBar = memo(function RateLimitBar({ remaining }: RateLimitBarProps) {
  const max = SECURITY_CONFIG.maxRequestsPerWindow;
  const percentage = (remaining / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Rate Limit</span>
        <span>{remaining}/{max}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Rate limit: ${remaining} of ${max} remaining`}
        className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden"
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            background: percentage > 50
              ? "linear-gradient(90deg, #22c55e, #10b981)"
              : percentage > 20
                ? "linear-gradient(90deg, #f59e0b, #eab308)"
                : "linear-gradient(90deg, #ef4444, #dc2626)"
          }}
        />
      </div>
    </div>
  );
});
