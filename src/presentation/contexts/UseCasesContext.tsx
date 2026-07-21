import React, { createContext, useContext, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { Database } from 'sql.js';
import { ProjectRepository, TaskRepository, MemoryRepository } from '../../data/repositories';
import { ProjectUseCases, TaskUseCases, MemoryUseCases } from '../../domain/usecases';
import { UnifiedAiService, createUnifiedAiService, type AiProvider, getDefaultModelForProvider } from '../../data/api';
import { RateLimiter } from '../../lib/rateLimiter';
import { SECURITY_CONFIG } from '../../config';

interface UseCasesContext {
  projectUseCases: ProjectUseCases;
  taskUseCases: TaskUseCases;
  memoryUseCases: MemoryUseCases;
  aiService: UnifiedAiService;
  saveDb: () => void;
  currentProvider: AiProvider;
  setCurrentProvider: (provider: AiProvider) => void;
  apiKeys: Record<AiProvider, string>;
  setApiKey: (provider: AiProvider, key: string) => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
}

const UseCasesContext = createContext<UseCasesContext | null>(null);

interface UseCasesProviderProps {
  children: React.ReactNode;
  db: Database | null;
  saveDb: () => void;
}

export function UseCasesProvider({ children, db, saveDb }: UseCasesProviderProps) {
  const [aiService] = useState<UnifiedAiService>(() => createUnifiedAiService());
  const [currentProvider, setCurrentProvider] = useState<AiProvider>('claude');
  const [apiKeys, setApiKeys] = useState<Record<AiProvider, string>>({
    claude: '',
    groq: '',
    openai: '',
    gemini: '',
    openrouter: '',
    deepseek: '',
    together: '',
    novita: '',
    lepton: '',
  });
  const [currentModel, setCurrentModel] = useState<string>(getDefaultModelForProvider('claude').id);

  const handleSetApiKey = useCallback((provider: AiProvider, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
    if (provider === currentProvider) {
      aiService.setApiKey(key);
    }
  }, [aiService, currentProvider]);

  const handleSetCurrentProvider = useCallback((provider: AiProvider) => {
    setCurrentProvider(provider);
    aiService.setProvider(provider, apiKeys[provider]);
    setCurrentModel(getDefaultModelForProvider(provider).id);
  }, [aiService, apiKeys]);

  const handleSetCurrentModel = useCallback((model: string) => {
    setCurrentModel(model);
    aiService.setModel(model);
  }, [aiService]);

  const useCases = useMemo(() => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    RateLimiter.init(SECURITY_CONFIG);

    const projectRepo = new ProjectRepository(db, saveDb);
    const taskRepo = new TaskRepository(db, saveDb);
    const memoryRepo = new MemoryRepository(db, saveDb);

    const projectUseCases = new ProjectUseCases(projectRepo);
    const taskUseCases = new TaskUseCases(taskRepo);
    const memoryUseCases = new MemoryUseCases(memoryRepo);

    return {
      projectUseCases,
      taskUseCases,
      memoryUseCases,
    };
  }, [db, saveDb]);

  const contextValue = useMemo(() => ({
    ...useCases,
    aiService,
    saveDb,
    currentProvider,
    setCurrentProvider: handleSetCurrentProvider,
    apiKeys,
    setApiKey: handleSetApiKey,
    currentModel,
    setCurrentModel: handleSetCurrentModel,
  }), [
    useCases,
    aiService,
    saveDb,
    currentProvider,
    handleSetCurrentProvider,
    apiKeys,
    handleSetApiKey,
    currentModel,
    handleSetCurrentModel,
  ]);

  return React.createElement(
    UseCasesContext.Provider,
    { value: contextValue },
    children
  );
}

export function useUseCases() {
  const context = useContext(UseCasesContext);
  if (!context) {
    throw new Error('useUseCases must be used within UseCasesProvider');
  }
  return context;
}

export function useProjectUseCases() {
  return useUseCases().projectUseCases;
}

export function useTaskUseCases() {
  return useUseCases().taskUseCases;
}

export function useMemoryUseCases() {
  return useUseCases().memoryUseCases;
}

export interface RetryInfo {
  attempt: number;
  delay: number;
  error: string;
  isRetrying: boolean;
}

export function useClaudeApi() {
  const { aiService, currentProvider, apiKeys } = useUseCases();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: 10, resetIn: 0 });
  const [retryInfo, setRetryInfo] = useState<RetryInfo | null>(null);

  const execute = useCallback(async (options: {
    apiKey?: string;
    systemPrompt: string;
    userMessage: string;
    screenshotBase64?: string | null;
    onChunk?: (text: string) => void;
    taskType?: string;
    maxRetries?: number;
  }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setRetryInfo(null);

    const apiKey = options.apiKey || apiKeys[currentProvider];
    if (currentProvider === 'claude' && !apiKey) {
      setIsLoading(false);
      return { success: false, error: 'API key is required' };
    }
    if (currentProvider === 'groq' && !apiKey) {
      setIsLoading(false);
      return { success: false, error: 'Groq API key required. Get free at https://console.groq.com' };
    }

    aiService.setApiKey(apiKey);

    let result;
    try {
      result = await aiService.executeWithRetry({
        ...options,
        signal: controller.signal,
        onRetryAttempt: (attempt, delay, err) => {
          setRetryInfo({ attempt, delay, error: err, isRetrying: true });
        },
        onChunk: options.onChunk,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsLoading(false);
      setRetryInfo(null);
      return { success: false, error: errorMsg };
    }

    setIsLoading(false);
    setRetryInfo(null);

    if (!result.success && result.error) {
      setError(result.error);
    }

    setRateLimitInfo({
      remaining: RateLimiter.getRemaining(),
      resetIn: RateLimiter.getResetTime()
    });

    return result;
  }, [aiService, currentProvider, apiKeys]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitInfo({
        remaining: RateLimiter.getRemaining(),
        resetIn: RateLimiter.getResetTime()
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { execute, abort, isLoading, error, setError, rateLimitInfo, retryInfo };
}
