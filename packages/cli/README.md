# @vexcms/cli

The CLI tool for [VEX CMS](https://github.com/ianyimi/vex) — handles schema generation, type generation, file watching, auto-migration, and Convex process management during development and deployment.

## Installation

```bash
pnpm add -D @vexcms/cli
```

The CLI is exposed as the `vex` binary.

## Commands

### `vex dev`

Starts the development workflow:

```bash
vex dev [--once]
```

1. Loads your `vex.config.ts`
2. Generates Convex schema (`vex.schema.ts`) and types (`vex.types.ts`)
3. Starts `convex dev` in the background
4. Watches for config changes and regenerates on save
5. Traces import dependencies to watch only relevant files

**`--once`** — Generate schema, push to Convex, and exit (no long-running watch).

### `vex deploy`

Handles production deployment:

```bash
vex deploy
```

1. Generates schema for production
2. Runs auto-migration if enabled (interim schema → mutations → final schema)
3. Executes `convex deploy`

Use this instead of `convex deploy` directly to ensure VEX schema is up to date.

### `vex generate`

Regenerates `vex.types.ts` from the vex config. Schema emission and deploys
stay with `vex dev` / `vex deploy`; the runtime API needs no generated files —
it is registered by the factory functions (`collectionsApi`, the globals and
media factories) in your `convex/` directory.

```bash
vex generate
```

## What It Generates

| Output | Path | Description |
|--------|------|-------------|
| VEX Schema | `convex/vex.schema.ts` | Convex `defineTable()` exports for all collections |
| VEX Types | `convex/vex.types.ts` | TypeScript types for all collections |
| Schema sync | `convex/schema.ts` | Auto-updated to import VEX tables |

## File Watching

- Uses **Chokidar** for file system monitoring with debouncing
- Traces imports from `vex.config.ts` to build a dependency tree
- Only watches files that your config actually imports
- Re-traces imports after each regeneration to pick up new dependencies

## Auto-Migration

When schema changes are detected during `vex dev` or `vex deploy`:

1. Diffs old vs new schema
2. Creates an interim schema (new required fields become optional, removed fields re-added as optional)
3. Deploys interim schema
4. Executes field removal and backfill mutations
5. Deploys final schema

## Config Resolution

Looks for config files in this order: `vex.config.ts`, `vex.config.mts`, `vex.config.js`, `vex.config.mjs`. Uses **Jiti** for dynamic TypeScript loading with tsconfig path alias support.

## Peer Dependencies

- `@vexcms/core` — Core VEX CMS types and utilities
- `convex` — Convex backend (>=1.0.0)
