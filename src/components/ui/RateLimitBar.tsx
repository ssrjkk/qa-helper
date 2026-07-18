import { motion } from 'framer-motion';
import { SECURITY_CONFIG } from '../../config';

interface RateLimitBarProps {
  remaining: number;
}

export function RateLimitBar({ remaining }: RateLimitBarProps) {
  const max = SECURITY_CONFIG.maxRequestsPerWindow;
  const percentage = (remaining / max) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Rate Limit</span>
        <span>{remaining}/{max}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Rate limit: ${remaining} of ${max} remaining`}
        className="h-1.5 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: percentage > 50 
              ? "linear-gradient(90deg, #22c55e, #10b981)" 
              : percentage > 20 
                ? "linear-gradient(90deg, #f59e0b, #eab308)" 
                : "linear-gradient(90deg, #ef4444, #dc2626)"
          }}
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>
    </div>
  );
}
