import { useReducer, useCallback } from 'react';

const MAX_HISTORY = 50;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

type ReducerAction<T> =
  | { type: 'SET'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

function historyReducer<T>(state: HistoryState<T>, action: ReducerAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'SET': {
      if (action.payload === state.present) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: action.payload,
        future: []
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future]
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture
      };
    }
    case 'RESET': {
      return {
        past: [],
        present: action.payload,
        future: []
      };
    }
    default:
      return state;
  }
}

export function useHistory<T>(initialValue: T) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: initialValue,
    future: []
  });

  const set = useCallback((value: T) => {
    dispatch({ type: 'SET', payload: value });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback((value: T) => {
    dispatch({ type: 'RESET', payload: value });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo
  };
}
