import * as React from 'react';
import {
  CreateProTableCoreOptions,
  ProTableInstance,
  ProTableState,
  ProTableViewModel,
  createProTableCore,
  createProTableInstance,
  deriveViewModel,
} from '../shared/proTableCore';
import { createMiniZustandStore, type MiniZustandStore } from './miniZustand';

interface UseZustandProTableOptions extends Omit<CreateProTableCoreOptions, 'initialState'> {
  initialQuery?: string;
}

interface UseZustandProTableResult {
  instance: ProTableInstance;
  view: ProTableViewModel;
  store: MiniZustandStore<ProTableState>;
  actions: {
    onQueryChange: (query: string) => void;
    onRowToggle: (rowId: string) => void;
    onReload: () => void;
    onClearSelection: () => void;
  };
}

export function useZustandProTable(options: UseZustandProTableOptions): UseZustandProTableResult {
  const { adapters, initialQuery = '' } = options;

  const [core] = React.useState(() =>
    createProTableCore({
      adapters,
      initialState: { query: initialQuery },
    }),
  );
  const [instance] = React.useState(() => createProTableInstance(core));

  const [bridge] = React.useState(() => {
    const store = createMiniZustandStore(core.getState());
    const unsubscribeCore = core.subscribe(() => {
      store.setState(core.getState());
    });
    return { store, unsubscribeCore };
  });

  React.useEffect(() => {
    return () => {
      bridge.unsubscribeCore();
    };
  }, [bridge]);

  const subscribe = React.useCallback((listener: () => void) => bridge.store.subscribe(listener), [bridge]);
  const getSnapshot = React.useCallback(() => bridge.store.getState(), [bridge]);

  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const view = React.useMemo(() => deriveViewModel(state), [state]);

  const actions = React.useMemo(
    () => ({
      onQueryChange: (query: string) => instance.api.setQuery(query),
      onRowToggle: (rowId: string) => instance.api.toggleRow(rowId),
      onReload: () => {
        void instance.api.reload();
      },
      onClearSelection: () => instance.api.clearSelection(),
    }),
    [instance],
  );

  React.useEffect(() => {
    void instance.api.reload();
  }, [instance]);

  return { instance, view, store: bridge.store, actions };
}
