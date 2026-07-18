import { useEffect, useRef } from 'react';

interface Shortcut {
  key: string;
  modifiers?: ('ctrl' | 'meta' | 'shift' | 'alt')[];
  action: () => void;
  description: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled: boolean = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        const modifiers = shortcut.modifiers || [];

        const effectiveModifiers = isMac
          ? modifiers.map((m) => (m === 'ctrl' ? 'meta' : m))
          : modifiers;

        const metaMatch = effectiveModifiers.includes('meta') ? e.metaKey : !e.metaKey;
        const ctrlMatch = effectiveModifiers.includes('ctrl') ? e.ctrlKey : !e.ctrlKey;
        const shiftMatch = effectiveModifiers.includes('shift') ? e.shiftKey : !e.shiftKey;
        const altMatch = effectiveModifiers.includes('alt') ? e.altKey : !e.altKey;

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          if (isInput && !modifiers.includes('meta') && !modifiers.includes('ctrl')) {
            if (['k', 's'].includes(shortcut.key.toLowerCase())) continue;
          }

          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
