import * as React from 'react';
import type { ProTableInstance } from '../shared/proTableCore';
import { createMockLoader } from '../shared/mockServer';
import { ProTableView } from './ProTableView';
import { useProTable } from './useProTable';

const loader = createMockLoader();

export const HookRefDemo = React.forwardRef<ProTableInstance>(function HookRefDemo(_props, ref) {
  const { instance, view, actions } = useProTable({
    adapters: { loader },
    initialQuery: '',
  });

  React.useImperativeHandle(ref, () => instance, [instance]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <nav style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => actions.onReload()}>Reload</button>
        <button onClick={() => instance.api.clearSelection()} disabled={!view.hasSelection}>
          Clear selection
        </button>
      </nav>
      <ProTableView view={view} onQueryChange={actions.onQueryChange} onRowToggle={actions.onRowToggle} onReload={actions.onReload} />
    </div>
  );
});

export function HookRefPage() {
  const tableRef = React.useRef<ProTableInstance | null>(null);
  return (
    <section>
      <HookRefDemo ref={tableRef} />
      <p style={{ marginTop: 12, fontSize: 12 }}>
        External selection count: {tableRef.current?.api.getSelection().length ?? 0}
      </p>
    </section>
  );
}
