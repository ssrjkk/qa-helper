import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { CodebaseProvider } from '../data/codebase/CodebaseProvider';

export function useCodebase() {
  const setCodebaseLoaded = useAppStore((s) => s.setCodebaseLoaded);
  const [codebaseProvider, setCodebaseProvider] = useState<CodebaseProvider | null>(null);

  const handleConnect = useCallback((provider: CodebaseProvider) => {
    setCodebaseProvider(provider);
    setCodebaseLoaded(true);
  }, [setCodebaseLoaded]);

  const handleDisconnect = useCallback(() => {
    setCodebaseProvider(null);
    setCodebaseLoaded(false);
  }, [setCodebaseLoaded]);

  return {
    codebaseProvider,
    handleConnect,
    handleDisconnect,
  };
}
