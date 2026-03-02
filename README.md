# Bun Monorepo Starter

A practical Bun monorepo starter for building shared packages and apps in one workspace.

## What is included

- `apps/playground`: a Vite + React playground app
- `packages/core`: shared core helpers
- `packages/utils`: utility helpers
- `packages/hooks`: reusable React hooks

## Project model

This starter uses a simple split:

- library packages in `packages/*` build to `dist` with `tsup`
- apps in `apps/*` use their own app bundler (`Vite` in this repo)
- root scripts run across all workspaces with Bun

That gives you a clean default for reusable packages while keeping app development straightforward.

## Getting started

Install dependencies:

```bash
bun install
```

Start the playground:

```bash
bun run dev
```

## Default commands

```bash
bun run lint
bun run test
bun run typecheck
bun run build
bun run check
bun run clean
```

`bun run check` runs lint, tests, typecheck, and builds for all workspaces that define those scripts.

`bun run clean` removes generated output, coverage folders, all `node_modules`, and `*.tsbuildinfo` files.

## Add a new package

1. Create a folder under `packages/<name>`.
2. Add a `package.json` with `"name": "@bunstack/<name>"` and `"type": "module"`.
3. Add a `build` script using `tsup src/index.ts --dts --format esm --clean`.
4. Point `main`, `types`, and `exports` to `dist`.
5. Add a `tsconfig.json` that extends the root [tsconfig.base.json](/Users/c9/code/bun-monorepo-starter/tsconfig.base.json).
6. Export the package from `src/index.ts`.
7. Use `"workspace:*"` when another workspace depends on it.

## Add a new app

1. Create a folder under `apps/<name>`.
2. Add a `package.json` with local dependencies using `"workspace:*"`.
3. Add the app's own `dev`, `build`, and `typecheck` scripts.
4. Reuse the root TypeScript path aliases or extend them in [tsconfig.base.json](/Users/c9/code/bun-monorepo-starter/tsconfig.base.json).

## Tooling choices

- Bun for package management, scripts, and tests
- TypeScript for shared typing
- `tsup` for library package builds
- Biome for linting and formatting
- GitHub Actions for CI

## Releases

Changesets is included for future package versioning:

```bash
bun run changeset
bun run version-packages
bun run release
```

## CI

The repository includes a GitHub Actions workflow at [.github/workflows/ci.yml](/Users/c9/code/bun-monorepo-starter/.github/workflows/ci.yml) that runs `bun run check` on pushes to `main` and on pull requests.
