import * as React from 'react';
import { createMockLoader, createMockStreamerSequence } from '../shared/mockServer';
import { StreamingView } from './StreamingView';
import { useStreamingProTable } from './useStreamingProTable';

const loader = createMockLoader();
const streamer = createMockStreamerSequence();

export function StreamingExample() {
  const { instance, view, startStream, stopStream } = useStreamingProTable({
    adapters: { loader, streamer },
    autoStartStream: true,
  });

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <StreamingView
        view={view}
        onQueryChange={instance.api.setQuery}
        onToggleRow={instance.api.toggleRow}
        onReload={() => {
          void instance.api.reload();
        }}
        onStartStream={startStream}
        onStopStream={stopStream}
      />
      <footer style={{ fontSize: 12 }}>
        Stream API available: {instance.api.startStream ? 'yes' : 'no'}
      </footer>
    </section>
  );
}
