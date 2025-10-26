import * as React from 'react';
import type { ProTableViewModel } from '../shared/proTableCore';
import { formatTimestamp } from '../shared/proTableCore';

interface ProTableViewProps {
  view: ProTableViewModel;
  onQueryChange: (query: string) => void;
  onRowToggle: (rowId: string) => void;
  onReload: () => void;
}

export function ProTableView({ view, onQueryChange, onRowToggle, onReload }: ProTableViewProps) {
  return (
    <section style={{ border: '1px solid #cbd5f5', padding: 16, borderRadius: 12 }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          aria-label="Search rows"
          placeholder="Filter by name or email"
          value={view.query}
          onChange={event => onQueryChange(event.target.value)}
          style={{ flex: 1, padding: '4px 8px' }}
        />
        <button onClick={onReload} disabled={view.loading}>
          {view.loading ? 'Loading…' : 'Reload'}
        </button>
        <span style={{ fontSize: 12, color: '#4c4f69' }}>
          {view.lastLoadedAt ? `Loaded ${formatTimestamp(view.lastLoadedAt)}` : 'No data yet'}
        </span>
      </header>
      {view.streamMessage ? (
        <p style={{ marginBottom: 8, fontSize: 12, color: '#2563eb' }}>{view.streamMessage}</p>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cellStyles}>Selected</th>
            <th style={cellStyles}>Name</th>
            <th style={cellStyles}>Email</th>
            <th style={cellStyles}>Status</th>
          </tr>
        </thead>
        <tbody>
          {view.rows.map(row => (
            <tr key={row.id}>
              <td style={cellStyles}>
                <input
                  type="checkbox"
                  checked={view.selectedIds.includes(row.id)}
                  onChange={() => onRowToggle(row.id)}
                />
              </td>
              <td style={cellStyles}>{row.name}</td>
              <td style={cellStyles}>{row.email}</td>
              <td style={cellStyles}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer style={{ marginTop: 12, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span>Selected: {view.selectedCount}</span>
        <span>Total rows: {view.rows.length}</span>
      </footer>
    </section>
  );
}

const cellStyles: React.CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  padding: '6px 8px',
  textAlign: 'left',
};
