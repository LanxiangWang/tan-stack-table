import * as React from 'react';
import {
  CreateProTableCoreOptions,
  ProTableInstance,
  createProTableCore,
  createProTableInstance,
  deriveViewModel,
} from '../shared/proTableCore';
import { ProTableRenderer } from './ProTableRenderer';

interface ProTableControllerProps extends Omit<CreateProTableCoreOptions, 'initialState'> {
  initialQuery?: string;
}

export const ProTableController = React.forwardRef<ProTableInstance, ProTableControllerProps>(
  function ProTableController({ adapters, initialQuery = '' }, ref) {
    const [core] = React.useState(() =>
      createProTableCore({
        adapters,
        initialState: { query: initialQuery },
      }),
    );
    const [instance] = React.useState(() => createProTableInstance(core));

    React.useImperativeHandle(ref, () => instance, [instance]);

    const subscribe = React.useCallback((listener: () => void) => core.subscribe(listener), [core]);
    const getSnapshot = React.useCallback(() => core.getState(), [core]);

    const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const view = React.useMemo(() => deriveViewModel(state), [state]);

    React.useEffect(() => {
      void instance.api.reload();
    }, [instance]);

    return (
      <ProTableRenderer
        view={view}
        onToggleRow={instance.api.toggleRow}
        onQueryChange={instance.api.setQuery}
        onReload={() => {
          void instance.api.reload();
        }}
        onClearSelection={instance.api.clearSelection}
      />
    );
  },
);
