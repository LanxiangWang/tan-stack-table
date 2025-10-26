import * as React from 'react';
import type { ProTableInstance } from '../shared/proTableCore';
import { createMockLoader } from '../shared/mockServer';
import { ProTableController } from './ProTableController';

const loader = createMockLoader();

export function ControllerExample() {
  const ref = React.useRef<ProTableInstance | null>(null);

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <ProTableController ref={ref} adapters={{ loader }} />
      <div style={{ fontSize: 12, color: '#334155' }}>
        Selected IDs: {ref.current?.api.getSelection().join(', ') ?? 'none'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            void ref.current?.api.reload();
          }}
        >
          Force reload
        </button>
        <button onClick={() => ref.current?.api.clearSelection()} disabled={!ref.current?.api.getSelection().length}>
          Clear selection
        </button>
      </div>
    </section>
  );
}
