import * as React from 'react';
import type { ProTableViewModel } from '../shared/proTableCore';

interface StreamingViewProps {
  view: ProTableViewModel;
  onQueryChange: (query: string) => void;
  onToggleRow: (rowId: string) => void;
  onReload: () => void;
  onStartStream: () => void;
  onStopStream: () => void;
}

export function StreamingView({
  view,
  onQueryChange,
  onToggleRow,
  onReload,
  onStartStream,
  onStopStream,
}: StreamingViewProps) {
  return (
    <div style={{ border: '1px solid #c4b5fd', borderRadius: 12, padding: 16 }}>
      <header style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Search"
          value={view.query}
          onChange={event => onQueryChange(event.target.value)}
          style={{ flex: 1, padding: 4 }}
        />
        <button onClick={onReload}>{view.loading ? 'Loading…' : 'Reload'}</button>
        <button onClick={onStartStream}>Stream</button>
        <button onClick={onStopStream}>Stop</button>
      </header>
      {view.streamMessage ? (
        <pre style={{ background: '#ede9fe', padding: 8, marginTop: 12, fontSize: 12 }}>{view.streamMessage}</pre>
      ) : null}
      <table style={{ marginTop: 12, width: '100%', borderCollapse: 'collapse' }}>
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
    </div>
  );
}

const cell: React.CSSProperties = {
  borderBottom: '1px solid #ddd6fe',
  textAlign: 'left',
  padding: '6px 8px',
};
