import { useCallback, useRef, useEffect } from 'react';
import { API_CONFIG, QA_SYSTEM_PROMPT, SCREENSHOT_SYSTEM_PROMPT, buildPrompt } from '../config';
import { SECURITY_CONFIG } from '../config';
import { RateLimiter } from './rateLimiter';
import type { Project } from '../types';
import { sleep } from './utils';

interface UseApiOptions {
  onOutputChange: (output: string) => void;
  onError: (error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onRateLimitChange: (info: { remaining: number; resetIn: number }) => void;
}

interface RequestParams {
  apiKey: string;
  selectedTask: string;
  context: string;
  screenshotBase64: string | null;
  selectedProject: number | null;
  dbService: DatabaseService | null;
  getProject: (id: number) => Project | undefined;
}

type DatabaseService = {
  createTask: (projectId: number, taskType: string, context: string, output: string) => number;
};

interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  backoff: true
};

const RETRYABLE_ERRORS = [
  'network',
  'timeout',
  'ECONNREFUSED',
  'ETIMEDOUT',
  '500',
  '502',
  '503',
  '504'
];

function isRetryableError(error: string): boolean {
  return RETRYABLE_ERRORS.some(err => error.toLowerCase().includes(err.toLowerCase()));
}

function parseSSEChunk(chunk: string): string | null {
  if (!chunk.startsWith('data: ')) return null;
  const data = chunk.slice(6);
  if (data === '[DONE]') return null;
  
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
      return parsed.delta.text;
    }
    if (parsed.type === 'message_delta' && parsed.delta?.text) {
      return parsed.delta.text;
    }
    if (parsed.type === 'content_block_start' && parsed.content_block?.text) {
      return parsed.content_block.text;
    }
  } catch { }
  return null;
}

function buildRequestBody(
  selectedTask: string,
  systemPrompt: string,
  userPrompt: string,
  screenshotBase64: string | null
): Record<string, unknown> {
  const messages: { role: 'user' | 'assistant'; content: unknown }[] = [
    { role: 'user', content: userPrompt }
  ];
  
  if (selectedTask === 'screenshot_analysis' && screenshotBase64) {
    messages[0].content = [
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } },
      { type: 'text', text: userPrompt }
    ];
  }
  
  return {
    model: API_CONFIG.model,
    max_tokens: API_CONFIG.maxTokens,
    system: systemPrompt,
    messages: messages,
    stream: true
  };
}

export function useApi({ onOutputChange, onError, onLoadingChange, onRateLimitChange }: UseApiOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const validateRequest = useCallback((params: RequestParams): string | null => {
    if (!params.selectedTask || !params.apiKey) {
      return 'Missing required parameters';
    }
    if (!navigator.onLine) {
      return 'No internet connection';
    }
    if (!RateLimiter.isAllowed()) {
      const resetIn = RateLimiter.getResetTime();
      onRateLimitChange({ remaining: 0, resetIn });
      return `Rate limit exceeded. Please wait ${resetIn} seconds.`;
    }
    if (params.context.length > SECURITY_CONFIG.maxContextLength) {
      return `Context too long (${params.context.length}/${SECURITY_CONFIG.maxContextLength}). Please shorten.`;
    }
    return null;
  }, [onRateLimitChange]);

  const executeRequest = useCallback(async (params: RequestParams, retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS) => {
    const validationError = validateRequest(params);
    if (validationError) {
      onError(validationError);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    retryCountRef.current = 0;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    onLoadingChange(true);
    onOutputChange('');
    onError(null);
    RateLimiter.recordRequest();
    onRateLimitChange({ 
      remaining: RateLimiter.getRemaining(), 
      resetIn: RateLimiter.getResetTime() 
    });

    const executeWithRetry = async (): Promise<void> => {
      try {
        let systemPrompt = QA_SYSTEM_PROMPT;
        let userPrompt = params.context;
        
        if (params.selectedTask === 'screenshot_analysis' && params.screenshotBase64) {
          systemPrompt = SCREENSHOT_SYSTEM_PROMPT;
        } else {
          const project = params.selectedProject ? params.getProject(params.selectedProject) : undefined;
          const { system, user } = buildPrompt(params.selectedTask, params.context, project?.memory);
          systemPrompt = system;
          userPrompt = user;
        }

        const requestBody = buildRequestBody(
          params.selectedTask,
          systemPrompt,
          userPrompt,
          params.screenshotBase64
        );

        const response = await fetch(API_CONFIG.baseUrl, {
          method: 'POST',
          headers: {
            'x-api-key': params.apiKey,
            'anthropic-version': API_CONFIG.anthropicVersion,
            'content-type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `API request failed: ${response.status}`;
          throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done || currentRequestId !== requestIdRef.current) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const text = parseSSEChunk(line);
            if (text && currentRequestId === requestIdRef.current) {
              fullResponse += text;
              if (isMountedRef.current) {
                onOutputChange(fullResponse);
              }
            }
          }
        }

        if (currentRequestId === requestIdRef.current && params.selectedProject && params.selectedTask) {
          params.dbService?.createTask(params.selectedProject, params.selectedTask, params.context, fullResponse);
        }

      } catch (err) {
        if ((err as Error).name === 'AbortError') return;

        const errorMessage = (err as Error).message || 'An error occurred';
        
        if (retryCountRef.current < retryOptions.maxAttempts && isRetryableError(errorMessage)) {
          retryCountRef.current++;
          const delay = retryOptions.backoff 
            ? retryOptions.delay * Math.pow(2, retryCountRef.current - 1)
            : retryOptions.delay;
          
          await sleep(delay);
          if (isMountedRef.current && currentRequestId === requestIdRef.current) {
            return executeWithRetry();
          }
        }

        if (currentRequestId === requestIdRef.current && isMountedRef.current) {
          onError(errorMessage);
        }
      }
    };

    await executeWithRetry();
    
    if (isMountedRef.current) {
      onLoadingChange(false);
    }
  }, [validateRequest, onOutputChange, onError, onLoadingChange, onRateLimitChange]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const execute = useCallback(async (params: RequestParams) => {
    await executeRequest(params);
  }, [executeRequest]);

  return { execute, abort };
}
