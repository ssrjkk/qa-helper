import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiKeyModal } from './components/features/ApiKeyModal';
import { AppContent } from './components/features/AppContent';
import { MasterPasswordModal } from './components/features/MasterPasswordModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SkeletonCard } from './components/ui/Skeleton';
import { ToastProvider } from './components/ui/Toast';
import { useDatabase } from './hooks/useDatabase';
import { loadApiKey } from './lib';
import { keyManager } from './lib/keyManagement';
import { UseCasesProvider } from './presentation';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const showApiKeyInput = useAppStore((s) => s.showApiKeyInput);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const setShowApiKeyInput = useAppStore((s) => s.setShowApiKeyInput);
  const db = useDatabase();
  const [keyReady, setKeyReady] = useState(false);

  useEffect(() => {
    keyManager.hasStoredSalt().then(has => {
      if (!has) setKeyReady(true);
    }).catch(() => {
      if (import.meta.env.DEV) console.warn('[App] Failed to check stored salt');
      setKeyReady(true);
    });
  }, []);

  const handleMasterPasswordSuccess = () => {
    setKeyReady(true);
    loadApiKey().then((decrypted) => {
      if (decrypted) setApiKey(decrypted);
    }).catch(() => {
      if (import.meta.env.DEV) console.warn('[App] Failed to load API key after master password');
    });
  };

  if (!keyReady) {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-100 to-slate-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/20 via-slate-200/40 to-slate-200 dark:from-purple-900/20 dark:via-slate-900/40 dark:to-slate-900" />
            <MasterPasswordModal onSuccess={handleMasterPasswordSuccess} />
          </div>
        </ToastProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-100 to-slate-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/20 via-slate-200/40 to-slate-200 dark:from-purple-900/20 dark:via-slate-900/40 dark:to-slate-900" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              QA Copilot
            </h1>
            <p className="text-gray-400">AI-Powered QA Assistant</p>
            <p className="text-gray-600 text-xs mt-1">by ssrjkk</p>
          </motion.header>

          {db.error ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-lg font-medium text-red-400 mb-2">Database Error</h2>
              <p className="text-sm text-gray-500 mb-4">{db.error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Retry
              </button>
            </div>
          ) : db.isDbReady ? (
            <UseCasesProvider db={db.db} saveDb={db.saveDb}>
              <AppContent db={db} />
            </UseCasesProvider>
          ) : (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
        </div>
        <footer className="relative z-10 text-center pb-8 text-xs text-gray-600">
          QA Copilot by ssrjkk | MIT License
        </footer>
      </div>

      <AnimatePresence>
        {showApiKeyInput && (
          <ApiKeyModal onClose={() => setShowApiKeyInput(false)} />
        )}
      </AnimatePresence>
      </ToastProvider>
    </ErrorBoundary>
  );
}
