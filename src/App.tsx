import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiKeyModal } from './components/features/ApiKeyModal';
import { AppContent } from './components/features/AppContent';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useDatabase } from './hooks/useDatabase';
import { loadApiKey } from './lib';
import { UseCasesProvider } from './presentation';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const store = useAppStore();
  const db = useDatabase();

  useEffect(() => {
    loadApiKey().then((decrypted) => {
      if (decrypted) {
        store.setApiKey(decrypted);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:bg-gradient-to-br dark:from-slate-100 dark:via-purple-100 dark:to-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900 dark:from-purple-200/20 dark:via-slate-200/40 dark:to-slate-200" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              QA Copilot BY ssrjkk
            </h1>
            <p className="text-gray-400">AI-Powered QA Assistant</p>
          </motion.header>

          {db.isDbReady ? (
            <UseCasesProvider db={db.db} saveDb={db.saveDb}>
              <AppContent db={db} />
            </UseCasesProvider>
          ) : (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {store.showApiKeyInput && (
          <ApiKeyModal onClose={() => store.setShowApiKeyInput(false)} />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}
