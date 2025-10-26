import * as React from 'react';
import {
  CreateProTableCoreOptions,
  ProTableInstance,
  ProTableViewModel,
  createProTableCore,
  createProTableInstance,
  deriveViewModel,
} from '../shared/proTableCore';

interface UseProTableOptions extends Omit<CreateProTableCoreOptions, 'initialState'> {
  initialQuery?: string;
}

interface UseProTableResult {
  instance: ProTableInstance;
  view: ProTableViewModel;
  actions: {
    onQueryChange: (query: string) => void;
    onRowToggle: (rowId: string) => void;
    onReload: () => void;
  };
}

export function useProTable(options: UseProTableOptions): UseProTableResult {
  const { adapters, initialQuery = '' } = options;
  const [core] = React.useState(() =>
    createProTableCore({
      initialState: { query: initialQuery },
      adapters,
    }),
  );

  const [instance] = React.useState(() => createProTableInstance(core));

  const subscribe = React.useCallback((listener: () => void) => core.subscribe(listener), [core]);
  const getSnapshot = React.useCallback(() => core.getState(), [core]);

  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const view = React.useMemo(() => deriveViewModel(state), [state]);

  const actions = React.useMemo(
    () => ({
      onQueryChange: (query: string) => instance.api.setQuery(query),
      onRowToggle: (rowId: string) => instance.api.toggleRow(rowId),
      onReload: () => {
        void instance.api.reload();
      },
    }),
    [instance],
  );

  React.useEffect(() => {
    void instance.api.reload();
  }, [instance]);

  return { instance, view, actions };
}
