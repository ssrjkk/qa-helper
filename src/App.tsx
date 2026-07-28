/**
 * Root application component
 * @module App
 * @author ssrjkk
 */

import { useEffect, useState, lazy } from 'react';
import { AppContent } from './components/features/AppContent';
import { MasterPasswordModal } from './components/modals/MasterPasswordModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SkeletonCard } from './components/ui/Skeleton';
import { ToastProvider, useToast } from './components/ui/Toast';
import { FadeIn } from './components/ui/Transitions';
import { useDatabase } from './hooks/useDatabase';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { loadApiKey } from './lib';
import { ErrorService } from './lib/errorService';
import { keyManager } from './lib/keyManagement';
import { sanitizeErrorForDisplay } from './lib/utils';
import { UseCasesProvider } from './presentation';
import { useAppStore } from './store/useAppStore';
import { APP_NAME, APP_HEADER_SUBTITLE, APP_HEADER_BYLINE, APP_FOOTER } from './lib/constants';
import { LazySuspense } from './components/features/LazyComponents';

const ApiKeyModal = lazy(() => import('./components/modals/ApiKeyModal').then(m => ({ default: m.ApiKeyModal })));
const CommandPalette = lazy(() => import('./components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })));

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AppInner() {
  const showApiKeyInput = useAppStore((s) => s.showApiKeyInput);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const setShowApiKeyInput = useAppStore((s) => s.setShowApiKeyInput);
  const db = useDatabase();
  const [keyReady, setKeyReady] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const { addToast } = useToast();

  useAppLifecycle();

  useEffect(() => {
    const unsub = ErrorService.subscribe((error) => {
      if (!error.recoverable) {
        addToast(`${error.code}: ${sanitizeErrorForDisplay(error.message)}`, 'error');
      }
    });
    return unsub;
  }, [addToast]);

  useEffect(() => {
    const handleToggle = () => setShowCommandPalette(prev => !prev);
    const handleClose = () => setShowCommandPalette(false);
    window.addEventListener('toggle-command-palette', handleToggle);
    window.addEventListener('close-all-modals', handleClose);
    return () => {
      window.removeEventListener('toggle-command-palette', handleToggle);
      window.removeEventListener('close-all-modals', handleClose);
    };
  }, []);

  useEffect(() => {
    keyManager.hasStoredSalt().then(has => {
      if (!has) setKeyReady(true);
    }).catch((err) => {
      ErrorService.report('DB_INIT', `salt-check: ${err instanceof Error ? err.message : String(err)}`);
      setKeyReady(true);
    });
  }, []);

  const handleMasterPasswordSuccess = () => {
    setKeyReady(true);
    loadApiKey().then((decrypted) => {
      if (decrypted) setApiKey(decrypted);
    }).catch((err) => {
      ErrorService.report('DECRYPT', `post-master-load: ${err instanceof Error ? err.message : String(err)}`);
    });
  };

  if (!keyReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-100 to-slate-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/20 via-slate-200/40 to-slate-200 dark:from-purple-900/20 dark:via-slate-900/40 dark:to-slate-900" />
        <MasterPasswordModal onSuccess={handleMasterPasswordSuccess} />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-100 to-slate-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/20 via-slate-200/40 to-slate-200 dark:from-purple-900/20 dark:via-slate-900/40 dark:to-slate-900" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <FadeIn delay={0} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
            {APP_NAME}
          </h1>
          <p className="text-gray-400">{APP_HEADER_SUBTITLE}</p>
          <p className="text-gray-600 text-xs mt-1">{APP_HEADER_BYLINE}</p>
        </FadeIn>

        {db.error ? (
          <div className="text-center py-20" role="alert" aria-live="assertive">
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
          <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading database">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
      </div>
      <footer className="relative z-10 text-center pb-8 text-xs text-gray-600">
        {APP_FOOTER}
      </footer>
    </div>
    {showApiKeyInput && (
      <LazySuspense>
        <ApiKeyModal onClose={() => setShowApiKeyInput(false)} />
      </LazySuspense>
    )}
    <LazySuspense>
      <CommandPalette
        commands={[
          { id: 'api-key', label: 'Set API Key', description: 'Configure your AI provider API key', category: 'Settings', action: () => setShowApiKeyInput(true), icon: '🔑' },
          { id: 'reset', label: 'Reset Task', description: 'Clear current context and output', category: 'Task', action: () => window.dispatchEvent(new CustomEvent('reset-task')), icon: '↺' },
          { id: 'execute', label: 'Execute Task', description: 'Generate output for current task', category: 'Task', action: () => window.dispatchEvent(new CustomEvent('execute-task')), icon: '🚀' },
          { id: 'copy', label: 'Copy Output', description: 'Copy generated output to clipboard', category: 'Task', action: () => window.dispatchEvent(new CustomEvent('copy-output')), icon: '📋' },
        ]}
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </LazySuspense>
    </>
  );
}
