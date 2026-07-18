import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { QA_SYSTEM_PROMPT, SCREENSHOT_SYSTEM_PROMPT, buildPrompt } from '../config';
import { useClaudeApi, useUseCases } from '../presentation';
import { QaAgent } from '../data/agent';
import type { CodebaseProvider } from '../data/codebase/CodebaseProvider';
import type { useDatabase } from './useDatabase';

type UseDatabaseReturn = ReturnType<typeof useDatabase>;

export function useExecution(
  selectedProject: number | null,
  codebaseProvider: CodebaseProvider | null,
  db: UseDatabaseReturn,
) {
  const setIsLoading = useAppStore((s) => s.setIsLoading);
  const setError = useAppStore((s) => s.setError);
  const setOutput = useAppStore((s) => s.setOutput);
  const setAgentSteps = useAppStore((s) => s.setAgentSteps);
  const addAgentStep = useAppStore((s) => s.addAgentStep);
  const addSession = useAppStore((s) => s.addSession);
  const resetTask = useAppStore((s) => s.resetTask);
  const { execute: executeApi, abort: abortApi } = useClaudeApi();
  const { aiService } = useUseCases();
  const { createTask, getProject } = db;
  const agentRef = useRef<QaAgent | null>(null);
  const isExecutingRef = useRef(false);

  useEffect(() => {
    return () => {
      agentRef.current?.abort();
      abortApi();
    };
  }, [abortApi]);

  const handleExecute = useCallback(async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    try {
      const s = useAppStore.getState();
      if (!s.selectedTask || !s.apiKey) return;

      if (s.mode === 'agent' && codebaseProvider) {
        setIsLoading(true);
        setError(null);
        setOutput('');
        setAgentSteps([]);

        const agent = new QaAgent(codebaseProvider, aiService);
        agentRef.current = agent;

        try {
          const result = await agent.run(s.context, {
            onChunk: (chunk) => {
              setOutput((prev) => prev + chunk);
            },
            onStep: (step) => {
              addAgentStep(step);
            },
          });

          if (result.output) {
            setOutput(result.output);
            if (selectedProject && s.selectedTask) {
              createTask({
                projectId: selectedProject,
                taskType: s.selectedTask,
                context: s.context,
                output: result.output,
              });
              addSession({
                task_type: s.selectedTask,
                context: s.context,
                output: result.output,
                created_at: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setIsLoading(false);
          agentRef.current = null;
        }
        return;
      }

      let systemPrompt = QA_SYSTEM_PROMPT;
      let userPrompt = s.context;

      if (s.selectedTask === 'screenshot_analysis' && s.screenshotBase64) {
        systemPrompt = SCREENSHOT_SYSTEM_PROMPT;
      } else {
        const project = selectedProject ? getProject(selectedProject) : undefined;
        const { system, user } = buildPrompt(s.selectedTask, s.context, project?.memory);
        systemPrompt = system;
        userPrompt = user;
      }

      const result = await executeApi({
        apiKey: s.apiKey,
        systemPrompt,
        userMessage: userPrompt,
        screenshotBase64: s.screenshotBase64,
        onChunk: (chunk) => {
          setOutput((prev) => prev + chunk);
        },
      });

      if (result.success && result.output) {
        setOutput(result.output);
        if (selectedProject && s.selectedTask) {
          createTask({
            projectId: selectedProject,
            taskType: s.selectedTask,
            context: s.context,
            output: result.output,
          });
          addSession({
            task_type: s.selectedTask,
            context: s.context,
            output: result.output,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      isExecutingRef.current = false;
    }
  }, [selectedProject, executeApi, getProject, createTask, codebaseProvider, aiService, setIsLoading, setError, setOutput, setAgentSteps, addAgentStep, addSession]);

  const handleReset = useCallback(() => {
    agentRef.current?.abort();
    abortApi();
    resetTask();
  }, [abortApi, resetTask]);

  return {
    handleExecute,
    handleReset,
    abortApi,
  };
}
