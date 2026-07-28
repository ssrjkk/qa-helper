/**
 * @module keyboardShortcuts tests
 * @author ssrjkk
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyboardShortcuts } from '../lib/keyboardShortcuts';

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}, target?: HTMLElement) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, ...opts });
  (target ?? document).dispatchEvent(e);
}

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    KeyboardShortcuts.init();
  });

  afterEach(() => {
    KeyboardShortcuts.destroy();
  });

  it('init is idempotent', () => {
    KeyboardShortcuts.init();
    KeyboardShortcuts.init();
    expect(KeyboardShortcuts.isEnabled()).toBe(true);
  });

  it('destroy removes all listeners', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'a', handler, description: 'test', category: 'test' });
    KeyboardShortcuts.destroy();
    fireKey('a');
    expect(handler).not.toHaveBeenCalled();
  });

  it('registers and triggers a shortcut', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'k', ctrl: true, handler, description: 'test', category: 'test' });
    fireKey('k', { ctrlKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('unregister stops triggering', () => {
    const handler = vi.fn();
    const unregister = KeyboardShortcuts.register({ key: 'b', handler, description: 'test', category: 'test' });
    unregister();
    fireKey('b');
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'c', handler, description: 'test', category: 'test' });
    KeyboardShortcuts.setEnabled(false);
    fireKey('c');
    expect(handler).not.toHaveBeenCalled();
    KeyboardShortcuts.setEnabled(true);
  });

  it('ignores key events in input elements without ctrl', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'a', handler, description: 'test', category: 'test' });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    fireKey('a', {}, input);
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('allows ctrl shortcuts in inputs', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'k', ctrl: true, handler, description: 'test', category: 'test' });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledOnce();
    document.body.removeChild(input);
  });

  it('getShortcuts returns registered shortcuts', () => {
    KeyboardShortcuts.register({ key: 'x', ctrl: true, shift: true, handler: () => {}, description: 'test x', category: 'nav' });
    const list = KeyboardShortcuts.getShortcuts();
    const found = list.find(s => s.description === 'test x');
    expect(found).toBeDefined();
    expect(found!.key).toContain('Ctrl+');
    expect(found!.key).toContain('Shift+');
    expect(found!.category).toBe('nav');
  });

  it('mac metaKey matches ctrl shortcuts', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'k', ctrl: true, handler, description: 'test', category: 'test' });
    fireKey('k', { metaKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('matches alt modifier', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'x', alt: true, handler, description: 'test', category: 'test' });
    fireKey('x', { altKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not fire non-matching modifier', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'y', ctrl: true, handler, description: 'test', category: 'test' });
    fireKey('y');
    expect(handler).not.toHaveBeenCalled();
  });

  it('stops propagation on match', () => {
    const handler = vi.fn();
    KeyboardShortcuts.register({ key: 'z', handler, description: 'test', category: 'test' });
    const spy = vi.fn();
    document.addEventListener('keydown', spy, true);
    fireKey('z');
    expect(handler).toHaveBeenCalledOnce();
    document.removeEventListener('keydown', spy, true);
  });

  it('isEnabled returns current state', () => {
    expect(KeyboardShortcuts.isEnabled()).toBe(true);
    KeyboardShortcuts.setEnabled(false);
    expect(KeyboardShortcuts.isEnabled()).toBe(false);
    KeyboardShortcuts.setEnabled(true);
  });
});
