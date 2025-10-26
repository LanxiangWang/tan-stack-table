import * as React from 'react';
import type { ProTableViewModel } from '../shared/proTableCore';

interface ProTableRendererProps {
  view: ProTableViewModel;
  onToggleRow: (rowId: string) => void;
  onQueryChange: (query: string) => void;
  onReload: () => void;
  onClearSelection: () => void;
}

export function ProTableRenderer({ view, onToggleRow, onQueryChange, onReload, onClearSelection }: ProTableRendererProps) {
  return (
    <article style={{ border: '1px solid #d4d4d8', borderRadius: 8, padding: 16 }}>
      <header style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Search"
          value={view.query}
          onChange={event => onQueryChange(event.target.value)}
          style={{ flex: 1, padding: 4 }}
        />
        <button onClick={onReload} disabled={view.loading}>
          {view.loading ? 'Loading…' : 'Reload'}
        </button>
        <button onClick={onClearSelection} disabled={!view.hasSelection}>
          Clear selection ({view.selectedCount})
        </button>
      </header>
      <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cell}>#</th>
            <th style={cell}>Name</th>
            <th style={cell}>Email</th>
            <th style={cell}>Status</th>
          </tr>
        </thead>
        <tbody>
          {view.rows.map(row => (
            <tr key={row.id}>
              <td style={cell}>
                <input type="checkbox" checked={view.selectedIds.includes(row.id)} onChange={() => onToggleRow(row.id)} />
              </td>
              <td style={cell}>{row.name}</td>
              <td style={cell}>{row.email}</td>
              <td style={cell}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {view.streamMessage ? <p style={{ marginTop: 12, fontSize: 12 }}>{view.streamMessage}</p> : null}
    </article>
  );
}

const cell: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: '1px solid #e4e4e7',
};
