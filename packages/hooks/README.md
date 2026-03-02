# @outofgas/react-stream

React hooks for the local workspace.

## Workspace usage

This package is intended for source-first usage inside the monorepo. Consumers should reference it with `"workspace:*"` and let the app bundler resolve the TypeScript source.

## Example

```tsx
import { useSubscribe } from "@outofgas/react-stream";

function Feed() {
  const state = useSubscribe({
    key: ["feed", "latest"],
    subscribe: async ({ onData, onError }) => {
      const socket = connectFeed();

      socket.onmessage = (event) => onData(JSON.parse(event.data));
      socket.onerror = () => onError(new Error("feed disconnected"));

      return {
        unsubscribe: () => socket.close(),
      };
    },
  });

  if (state.error) return <p>{state.error}</p>;
  if (!state.ready) return <p>Loading...</p>;

  return <pre>{JSON.stringify(state.data, null, 2)}</pre>;
}
```

## Tests

```bash
bun run --cwd packages/hooks test
```
