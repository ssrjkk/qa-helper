import { useState, useCallback, useEffect, useRef } from 'react';

type Theme = 'dark' | 'light';

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    
    const saved = localStorage.getItem('qa-helper-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const themeRef = useRef(theme);
  themeRef.current = theme;

  const applyTheme = useCallback((newTheme: Theme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('qa-helper-theme', newTheme);
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
