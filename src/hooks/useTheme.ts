/**
 * Dark/light theme toggle hook
 * @module useTheme
 * @author ssrjkk
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../lib/constants';

type Theme = 'dark' | 'light';

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

function safeLsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeLsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    
    const saved = safeLsGet(STORAGE_KEYS.theme);
    if (saved === 'dark' || saved === 'light') return saved;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const themeRef = useRef(theme);
  themeRef.current = theme;

  const applyTheme = useCallback((newTheme: Theme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    safeLsSet(STORAGE_KEYS.theme, newTheme);
    setThemeState(newTheme);
  }, []);

  useEffect(() => {
    applyTheme(themeRef.current);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    applyTheme(themeRef.current === 'dark' ? 'light' : 'dark');
  }, [applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    applyTheme(newTheme);
  }, [applyTheme]);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark'
  };
}
