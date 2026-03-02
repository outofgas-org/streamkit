# @bunstack/utils

Small utility helpers for the local workspace.

## Workspace usage

Add this package to another workspace with `"workspace:*"` and import directly from `@bunstack/utils`.

## Example

```ts
import { clamp, toTitleCase, truncate } from "@bunstack/utils";

clamp(15, 0, 10); // 10
toTitleCase("bun monorepo starter"); // "Bun Monorepo Starter"
truncate("hello world", 8); // "hello..."
```

## Tests

```bash
bun run --cwd packages/utils test
```
