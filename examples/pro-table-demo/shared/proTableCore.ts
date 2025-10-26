import type { AsyncGeneratorLike } from './types';
import { createMockDelay } from './utils';

export interface ProTableRow {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface ProTableState {
  rows: ProTableRow[];
  query: string;
  selection: string[];
  loading: boolean;
  lastLoadedAt: number | null;
  streamMessage?: string;
}

export interface ProTableAdapters {
  loader: (query: string) => Promise<ProTableRow[]>;
  streamer?: (query: string) => AsyncGeneratorLike<string>;
}

type Listener = () => void;

type Mutator = (draft: ProTableState) => void;

function cloneState(state: ProTableState): ProTableState {
  return {
    ...state,
    rows: state.rows.slice(),
    selection: state.selection.slice(),
  };
}

export interface ProTableCore {
  getState: () => ProTableState;
  subscribe: (listener: Listener) => () => void;
  commands: {
    setQuery: (query: string) => void;
    toggleRow: (rowId: string) => void;
    clearSelection: () => void;
    replaceRows: (rows: ProTableRow[]) => void;
    load: (query?: string) => Promise<void>;
    startStream?: () => void;
    stopStream?: () => void;
  };
}

export interface ProTableInstance {
  core: ProTableCore;
  api: {
    reload: (query?: string) => Promise<void>;
    setQuery: (query: string) => void;
    toggleRow: (rowId: string) => void;
    clearSelection: () => void;
    getSelection: () => string[];
    startStream?: () => void;
    stopStream?: () => void;
  };
}

export interface ProTableViewModel {
  rows: ProTableRow[];
  query: string;
  loading: boolean;
  selectedIds: string[];
  selectedCount: number;
  hasSelection: boolean;
  streamMessage?: string;
  lastLoadedAt: number | null;
}

export interface CreateProTableCoreOptions {
  initialState?: Partial<ProTableState>;
  adapters: ProTableAdapters;
}

export function createProTableCore(options: CreateProTableCoreOptions): ProTableCore {
  const { adapters } = options;
  let state: ProTableState = {
    rows: [],
    query: '',
    selection: [],
    loading: false,
    lastLoadedAt: null,
    streamMessage: undefined,
    ...options.initialState,
    rows: options.initialState?.rows ?? [],
    selection: options.initialState?.selection ?? [],
  };

  const listeners = new Set<Listener>();

  const notify = () => {
    listeners.forEach(listener => listener());
  };

  const mutate = (mutator: Mutator) => {
    const nextState = cloneState(state);
    mutator(nextState);
    state = nextState;
    notify();
  };

  let loadToken = 0;
  let stopStreaming: (() => void) | null = null;

  const commands = {
    setQuery(query: string) {
      mutate(draft => {
        draft.query = query;
      });
    },
    toggleRow(rowId: string) {
      mutate(draft => {
        if (draft.selection.includes(rowId)) {
          draft.selection = draft.selection.filter(id => id !== rowId);
        } else {
          draft.selection = draft.selection.concat(rowId);
        }
      });
    },
    clearSelection() {
      mutate(draft => {
        draft.selection = [];
      });
    },
    replaceRows(rows: ProTableRow[]) {
      mutate(draft => {
        draft.rows = rows;
        draft.lastLoadedAt = Date.now();
        draft.loading = false;
      });
    },
    async load(query?: string) {
      const effectiveQuery = typeof query === 'string' ? query : state.query;
      const token = ++loadToken;
      mutate(draft => {
        draft.loading = true;
        if (typeof query === 'string') {
          draft.query = query;
        }
      });
      try {
        const rows = await adapters.loader(effectiveQuery);
        if (token !== loadToken) {
          return;
        }
        commands.replaceRows(rows);
      } catch (error) {
        if (token !== loadToken) {
          return;
        }
        mutate(draft => {
          draft.loading = false;
          draft.streamMessage = `Failed to load: ${String(error)}`;
        });
      }
    },
    startStream: adapters.streamer
      ? () => {
          stopStreaming?.();
          let cancelled = false;
          stopStreaming = () => {
            cancelled = true;
            mutate(draft => {
              draft.streamMessage = undefined;
            });
          };
          const run = async () => {
            mutate(draft => {
              draft.streamMessage = 'connecting…';
            });
            const iterator = adapters.streamer!(state.query);
            for await (const chunk of iterator) {
              if (cancelled) {
                break;
              }
              mutate(draft => {
                draft.streamMessage = chunk;
              });
            }
          };
          void run();
        }
      : undefined,
    stopStream: adapters.streamer
      ? () => {
          stopStreaming?.();
          stopStreaming = null;
        }
      : undefined,
  } satisfies ProTableCore['commands'];

  return {
    getState: () => state,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    commands,
  };
}

export function createProTableInstance(core: ProTableCore): ProTableInstance {
  return {
    core,
    api: {
      reload: (query?: string) => core.commands.load(query),
      setQuery: (query: string) => core.commands.setQuery(query),
      toggleRow: (rowId: string) => core.commands.toggleRow(rowId),
      clearSelection: () => core.commands.clearSelection(),
      getSelection: () => core.getState().selection,
      startStream: core.commands.startStream,
      stopStream: core.commands.stopStream,
    },
  };
}

export function deriveViewModel(state: ProTableState): ProTableViewModel {
  const selectedIds = state.selection;
  return {
    rows: state.rows,
    query: state.query,
    loading: state.loading,
    selectedIds,
    selectedCount: selectedIds.length,
    hasSelection: selectedIds.length > 0,
    streamMessage: state.streamMessage,
    lastLoadedAt: state.lastLoadedAt,
  };
}

export function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) {
    return '—';
  }
  const formatter = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return formatter.format(timestamp);
}

export async function defaultLoader(): Promise<ProTableRow[]> {
  await createMockDelay(120);
  return [
    { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', status: 'active' },
    { id: '2', name: 'Grace Hopper', email: 'grace@example.com', status: 'invited' },
    { id: '3', name: 'Edsger Dijkstra', email: 'edsger@example.com', status: 'suspended' },
  ];
}

export function createMockStreamer(messages: string[]): () => AsyncGeneratorLike<string> {
  return function start() {
    return (async function* stream() {
      for (const message of messages) {
        await createMockDelay(90);
        yield message;
      }
    })();
  };
}
