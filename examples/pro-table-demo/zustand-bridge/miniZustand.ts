export interface MiniZustandStore<T> {
  getState: () => T;
  setState: (nextState: T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createMiniZustandStore<T>(initialState: T): MiniZustandStore<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState(nextState: T) {
      if (Object.is(state, nextState)) {
        return;
      }
      state = nextState;
      listeners.forEach(listener => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
