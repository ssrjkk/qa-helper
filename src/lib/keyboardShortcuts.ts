/**
 * Keyboard shortcuts manager with command palette support
 * @module keyboardShortcuts
 * @author ssrjkk
 */

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [];
let enabled = true;

function matchesShortcut(e: KeyboardEvent, s: Shortcut): boolean {
  if (e.key.toLowerCase() !== s.key.toLowerCase()) return false;
  if (s.ctrl && !e.ctrlKey && !e.metaKey) return false;
  if (s.shift && !e.shiftKey) return false;
  if (s.alt && !e.altKey) return false;
  if (s.ctrl && (e.ctrlKey || e.metaKey)) return true;
  if (!s.ctrl && (e.ctrlKey || e.metaKey)) return false;
  return true;
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!enabled) return;
  const target = e.target;
  const tagName = target instanceof Element ? target.tagName : '';
  const isContentEditable = target instanceof HTMLElement ? target.isContentEditable : false;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || isContentEditable) {
    if (!(e.ctrlKey || e.metaKey)) return;
  }

  for (const s of shortcuts) {
    if (matchesShortcut(e, s)) {
      e.preventDefault();
      e.stopPropagation();
      s.handler(e);
      return;
    }
  }
}

let initialized = false;

export const KeyboardShortcuts = {
  init(): void {
    if (initialized) return;
    initialized = true;
    document.addEventListener('keydown', handleKeyDown);
  },

  destroy(): void {
    document.removeEventListener('keydown', handleKeyDown);
    shortcuts.length = 0;
    initialized = false;
  },

  register(config: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    handler: ShortcutHandler;
    description: string;
    category: string;
  }): () => void {
    const shortcut: Shortcut = {
      key: config.key,
      ctrl: config.ctrl,
      shift: config.shift,
      alt: config.alt,
      handler: config.handler,
      description: config.description,
      category: config.category,
    };
    shortcuts.push(shortcut);
    return () => {
      const idx = shortcuts.indexOf(shortcut);
      if (idx >= 0) shortcuts.splice(idx, 1);
    };
  },

  getShortcuts(): Array<{ key: string; description: string; category: string }> {
    return shortcuts.map(s => ({
      key: `${s.ctrl ? 'Ctrl+' : ''}${s.shift ? 'Shift+' : ''}${s.alt ? 'Alt+' : ''}${s.key.toUpperCase()}`,
      description: s.description,
      category: s.category,
    }));
  },

  setEnabled(value: boolean): void {
    enabled = value;
  },

  isEnabled(): boolean {
    return enabled;
  },
};
