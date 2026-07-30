/**
 * Codebase connection panel (GitHub/Local)
 * @module CodebasePanel
 * @author ssrjkk
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { RippleButton } from '../ui';
import type { CodebaseProvider } from '../../data/codebase/CodebaseProvider';

interface CodebasePanelProps {
  provider: CodebaseProvider | null;
  onConnect: (provider: CodebaseProvider) => void;
  onDisconnect: () => void;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+)/,
    /^([^/]+)\/([^/]+)$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    const owner = match?.[1];
    const repo = match?.[2];
    if (owner && repo) return { owner, repo: repo.replace(/\.git$/, '') };
  }
  return null;
}

export function CodebasePanel({ provider, onConnect, onDisconnect }: CodebasePanelProps) {
  const [mode, setMode] = useState<'idle' | 'github' | 'local'>('idle');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipParserRef = useRef<Awaited<typeof import('../../lib/workers/zipParser')>['zipParser'] | null>(null);

  useEffect(() => {
    return () => {
      zipParserRef.current?.terminate();
    };
  }, []);

  const handleGithubConnect = useCallback(async () => {
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      setError('Invalid GitHub URL. Use format: owner/repo or full URL.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { GitHubProvider } = await import('../../data/codebase/GitHubProvider');
      const gh = new GitHubProvider(parsed.owner, parsed.repo, githubBranch);
      const tree = await gh.listTree('');
      if (tree.length === 0) {
        setError('Could not find repository. Check the URL and branch name.');
        setIsLoading(false);
        return;
      }
      onConnect(gh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsLoading(false);
    }
  }, [githubUrl, githubBranch, onConnect]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { LocalProvider } = await import('../../data/codebase/LocalProvider');
      const lp = new LocalProvider('Local Project');

      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        await lp.loadFromDataTransfer(items);
      }

      if (lp.isReady) {
        onConnect(lp);
      } else {
        setError('Could not read files. Try a different folder.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [onConnect]);

  const handleZipUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const mod = await import('../../lib/workers/zipParser');
      zipParserRef.current = mod.zipParser;
      const result = await mod.zipParser.parse(buffer, file.name);

      const { LocalProvider } = await import('../../data/codebase/LocalProvider');
      const lp = new LocalProvider(file.name.replace(/\.zip$/, ''));
      await lp.loadFromFiles(result.files);

      if (lp.isReady) {
        onConnect(lp);
      } else {
        setError('Could not read ZIP contents.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ZIP');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onConnect]);

  if (provider) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
        <span className="text-emerald-300 font-medium truncate">{provider.name}</span>
        <span className="text-gray-500 ml-auto">Connected</span>
        <button
          onClick={onDisconnect}
          className="text-gray-500 hover:text-red-400 transition-colors ml-1"
          title="Disconnect"
          aria-label="Disconnect codebase"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mode === 'idle' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            Connect a codebase for AI-powered analysis
          </p>
          <div className="flex gap-2">
            <RippleButton
              onClick={() => setMode('github')}
              variant="secondary"
              className="!px-3 !py-1.5 !text-xs flex-1"
            >
              GitHub Repo
            </RippleButton>
            <RippleButton
              onClick={() => setMode('local')}
              variant="secondary"
              className="!px-3 !py-1.5 !text-xs flex-1"
            >
              Local Files
            </RippleButton>
          </div>
        </div>
      )}

      {mode === 'github' && (
        <div
          className="space-y-2 animate-fadeIn"
        >
          <input
            type="text"
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
            placeholder="owner/repo or github.com/owner/repo"
            aria-label="GitHub repository URL"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 focus:border-indigo-500/50"
          />
          <input
            type="text"
            value={githubBranch}
            onChange={e => setGithubBranch(e.target.value)}
            placeholder="Branch (default: main)"
            aria-label="Branch name"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 focus:border-indigo-500/50"
          />
          <div className="flex gap-2">
            <RippleButton
              onClick={handleGithubConnect}
              disabled={!githubUrl.trim() || isLoading}
              className="!px-3 !py-1.5 !text-xs flex-1"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </RippleButton>
            <RippleButton
              onClick={() => setMode('idle')}
              variant="secondary"
              className="!px-3 !py-1.5 !text-xs"
            >
              Cancel
            </RippleButton>
          </div>
        </div>
      )}

      {mode === 'local' && (
        <div
          className="space-y-2 animate-fadeIn"
        >
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDragEnd={() => setIsDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragOver ? 'border-indigo-500/50' : 'border-white/10 hover:border-white/20'}`}
          >
            {isLoading ? (
              <p className="text-xs text-gray-400">Loading files...</p>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-2">
                  Drop a project folder here
                </p>
                <p className="text-xs text-gray-600 mb-2">or</p>
                <RippleButton
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="!px-3 !py-1.5 !text-xs"
                >
                  Upload ZIP
                </RippleButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
          <RippleButton
            onClick={() => setMode('idle')}
            variant="secondary"
            className="!px-3 !py-1.5 !text-xs w-full"
          >
            Cancel
          </RippleButton>
        </div>
      )}

      {error && (
        <p
          className="text-xs text-red-400 animate-fadeIn"
        >
          {error}
        </p>
      )}
    </div>
  );
}
