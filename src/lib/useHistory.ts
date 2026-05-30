import { useCallback, useEffect, useRef, useState } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseHistoryReturn<T> {
  state: HistoryState<T>;
  setState: (newPresent: T, skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export function useHistory<T>(initialPresent: T, options?: {
  limit?: number;
  onChange?: (state: HistoryState<T>) => void;
}): UseHistoryReturn<T> {
  const { limit = 50, onChange } = options || {};
  
  const [state, setStateInternal] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });
  
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setState = useCallback((newPresent: T, skipHistory?: boolean) => {
    setStateInternal(prev => {
      if (skipHistory) {
        return { ...prev, present: newPresent };
      }
      
      const newPast = prev.past.length >= limit 
        ? [...prev.past.slice(1), prev.present]
        : [...prev.past, prev.present];
      
      const newState: HistoryState<T> = {
        past: newPast,
        present: newPresent,
        future: [],
      };
      
      setTimeout(() => onChangeRef.current?.(newState), 0);
      return newState;
    });
  }, [limit]);

  const undo = useCallback(() => {
    setStateInternal(prev => {
      if (prev.past.length === 0) return prev;
      
      const newPast = [...prev.past];
      const previous = newPast.pop()!;
      
      const newState: HistoryState<T> = {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
      
      setTimeout(() => onChangeRef.current?.(newState), 0);
      return newState;
    });
  }, []);

  const redo = useCallback(() => {
    setStateInternal(prev => {
      if (prev.future.length === 0) return prev;
      
      const newFuture = [...prev.future];
      const next = newFuture.shift()!;
      
      const newState: HistoryState<T> = {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
      
      setTimeout(() => onChangeRef.current?.(newState), 0);
      return newState;
    });
  }, []);

  const clear = useCallback(() => {
    setStateInternal(prev => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    clear,
  };
}
