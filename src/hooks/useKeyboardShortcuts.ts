import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  modifiers?: ('ctrl' | 'meta' | 'shift' | 'alt')[];
  action: () => void;
  description: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    for (const shortcut of shortcuts) {
      const modifiers = shortcut.modifiers || [];
      
      const metaMatch = isMac ? (modifiers.includes('meta') ? e.metaKey : true) : (modifiers.includes('ctrl') ? e.ctrlKey : true);
      const ctrlMatch = isMac ? true : (modifiers.includes('ctrl') ? e.ctrlKey : true);
      const shiftMatch = modifiers.includes('shift') ? e.shiftKey : !e.shiftKey;
      const altMatch = modifiers.includes('alt') ? e.altKey : !e.altKey;
      
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
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
