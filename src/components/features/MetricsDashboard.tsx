import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { metricsCollector } from '../../lib/metrics';

interface MetricsDashboardProps {
  onClose?: () => void;
}

export function MetricsDashboard({ onClose }: MetricsDashboardProps) {
  const metrics = metricsCollector.getMetrics();
  const successRate = metricsCollector.getSuccessRate();
  const topTasks = metricsCollector.getTopTaskTypes(5);
  const last7Days = metricsCollector.getLast7DaysRequests();

  const maxDayCount = Math.max(...last7Days.map(d => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Usage Metrics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => metricsCollector.reset()}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            Reset Stats
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-white">{metrics.totalRequests}</div>
          <div className="text-xs text-gray-400">Total Requests</div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-emerald-400">{metrics.successfulRequests}</div>
          <div className="text-xs text-gray-400">Successful</div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-rose-400">{metrics.failedRequests}</div>
          <div className="text-xs text-gray-400">Failed</div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-purple-400">{successRate}%</div>
          <div className="text-xs text-gray-400">Success Rate</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-amber-400">{metrics.totalTokens.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Tokens Used</div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-cyan-400">{metrics.averageResponseTime}ms</div>
          <div className="text-xs text-gray-400">Avg Response Time</div>
        </GlassCard>
      </div>

      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Requests (Last 7 Days)</h3>
        <div className="flex items-end gap-1 h-24">
          {last7Days.map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.count / maxDayCount) * 100}%` }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gradient-to-t from-purple-500 to-indigo-500 rounded-t-sm min-h-[2px]"
                />
              </div>
              <span className="text-[10px] text-gray-500">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
              <span className="text-[10px] text-gray-400">{day.count}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {topTasks.length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Top Task Types</h3>
          <div className="space-y-2">
            {topTasks.map((task, i) => (
              <div key={task.type} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topTasks[0] ? (task.count / topTasks[0].count) * 100 : 0}%` }}
                    transition={{ delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
                <span className="text-xs text-gray-300 w-32 truncate">{task.type}</span>
                <span className="text-xs text-gray-500 w-8 text-right">{task.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
}
