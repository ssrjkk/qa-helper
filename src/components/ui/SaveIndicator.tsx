/**
 * Auto-save indicator
 * @module SaveIndicator
 * @author ssrjkk
 */

import { memo } from 'react';

interface SaveIndicatorProps {
  saving: boolean;
}

export const SaveIndicator = memo(function SaveIndicator({ saving }: SaveIndicatorProps) {
  return (
    <div
      key={saving ? "saving" : "saved"}
      className={`flex items-center gap-2 text-sm transition-opacity duration-200 ${saving ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}
      role="status"
      aria-live="polite"
    >
      {saving ? (
        <>
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Saved
        </>
      )}
    </div>
  );
});
