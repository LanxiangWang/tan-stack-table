import { createMockDelay, fuzzyIncludes } from './utils';
import type { ProTableRow } from './proTableCore';

const MOCK_ROWS: ProTableRow[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', status: 'active' },
  { id: '2', name: 'Grace Hopper', email: 'grace@example.com', status: 'active' },
  { id: '3', name: 'Edsger Dijkstra', email: 'edsger@example.com', status: 'suspended' },
  { id: '4', name: 'Donald Knuth', email: 'donald@example.com', status: 'active' },
  { id: '5', name: 'Barbara Liskov', email: 'barbara@example.com', status: 'invited' },
  { id: '6', name: 'Margaret Hamilton', email: 'margaret@example.com', status: 'active' },
  { id: '7', name: 'Alan Turing', email: 'alan@example.com', status: 'suspended' },
];

export function createMockLoader() {
  return async function load(query: string): Promise<ProTableRow[]> {
    await createMockDelay(80);
    if (!query) {
      return MOCK_ROWS;
    }
    return MOCK_ROWS.filter(row => fuzzyIncludes(row.name, query) || fuzzyIncludes(row.email, query));
  };
}

export function createMockStreamerSequence() {
  return async function* stream(_query: string) {
    const checkpoints = ['queueing request…', 'fetching data…', 'hydrating rows…', 'ready'];
    for (const message of checkpoints) {
      await createMockDelay(120);
      yield message;
    }
  };
}
