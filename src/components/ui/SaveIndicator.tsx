import { motion } from 'framer-motion';

interface SaveIndicatorProps {
  saving: boolean;
}

export function SaveIndicator({ saving }: SaveIndicatorProps) {
  return (
    <motion.div
      key={saving ? "saving" : "saved"}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 text-sm ${saving ? 'text-indigo-400' : 'text-emerald-400'}`}
    >
      {saving ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full"
          />
          Saving...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </svg>
          Saved
        </>
      )}
    </motion.div>
  );
}
