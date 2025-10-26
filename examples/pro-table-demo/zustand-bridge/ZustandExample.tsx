import * as React from 'react';
import type { ProTableState } from '../shared/proTableCore';
import { createMockLoader } from '../shared/mockServer';
import { ProTableView } from '../hook-ref/ProTableView';
import { useZustandProTable } from './useZustandProTable';

const loader = createMockLoader();

function useSelection(store: { subscribe: (listener: () => void) => () => void; getState: () => ProTableState }) {
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.getState().selection,
    () => store.getState().selection,
  );
}

export function ZustandBridgeExample() {
  const { instance, view, store, actions } = useZustandProTable({ adapters: { loader } });
  const selection = useSelection(store);

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <header style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            void instance.api.reload();
          }}
        >
          Reload
        </button>
        <button onClick={() => instance.api.clearSelection()} disabled={!view.hasSelection}>
          Clear selection
        </button>
        <span style={{ fontSize: 12 }}>Store subscribers see {selection.length} selected rows</span>
      </header>
      <ProTableView view={view} onQueryChange={actions.onQueryChange} onRowToggle={actions.onRowToggle} onReload={actions.onReload} />
    </section>
  );
}
