import * as React from 'react';
import {
  CreateProTableCoreOptions,
  ProTableInstance,
  ProTableViewModel,
  createProTableCore,
  createProTableInstance,
  deriveViewModel,
} from '../shared/proTableCore';

interface UseStreamingProTableOptions extends Omit<CreateProTableCoreOptions, 'initialState'> {
  initialQuery?: string;
  autoStartStream?: boolean;
}

interface UseStreamingProTableResult {
  instance: ProTableInstance;
  view: ProTableViewModel;
  startStream: () => void;
  stopStream: () => void;
}

export function useStreamingProTable(options: UseStreamingProTableOptions): UseStreamingProTableResult {
  const { adapters, initialQuery = '', autoStartStream = true } = options;

  const [core] = React.useState(() =>
    createProTableCore({
      adapters,
      initialState: { query: initialQuery },
    }),
  );
  const [instance] = React.useState(() => createProTableInstance(core));

  const subscribe = React.useCallback((listener: () => void) => core.subscribe(listener), [core]);
  const getSnapshot = React.useCallback(() => core.getState(), [core]);

  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const view = React.useMemo(() => deriveViewModel(state), [state]);

  React.useEffect(() => {
    void instance.api.reload();
  }, [instance]);

  React.useEffect(() => {
    if (!autoStartStream || !instance.api.startStream) {
      return;
    }
    instance.api.startStream();
    return () => {
      instance.api.stopStream?.();
    };
  }, [autoStartStream, instance]);

  const startStream = React.useCallback(() => {
    instance.api.startStream?.();
  }, [instance]);

  const stopStream = React.useCallback(() => {
    instance.api.stopStream?.();
  }, [instance]);

  return { instance, view, startStream, stopStream };
}
