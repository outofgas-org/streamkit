# @bunstack/core

Shared core helpers used by the local workspace.

## Workspace usage

This package is wired for source-first development inside the monorepo:

- `main` and `types` point to `src/index.ts`
- consuming apps should depend on it with `"workspace:*"`
- no local build step is required during development

## Example

```ts
import { formatBytes, formatNumber, retry } from "@bunstack/core";

formatNumber(1234567); // "1,234,567"
formatBytes(1024); // "1 KB"

const data = await retry(() => fetchData(), { maxAttempts: 3 });
```

## Tests

```bash
bun run --cwd packages/core test
```
