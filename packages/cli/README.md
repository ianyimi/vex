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
vex dev [--once] [--cwd <dir>] [convex dev flags…]
```

1. Loads your `vex.config.ts`
2. Generates Convex schema (`vex.schema.ts`) and types (`vex.types.ts`)
3. Starts `convex dev` in the background
4. Watches for config changes and regenerates on save
5. Traces import dependencies to watch only relevant files

Use it instead of `convex dev`. Every flag vex doesn't own is forwarded to `convex dev`
unchanged: `--tail-logs`, `--run`, `--configure`, `--env-file`, `--typecheck`, and the rest.
`--start '<command>'` runs your app server alongside it, so one terminal is enough:

```bash
vex dev --start 'next dev'
```

**`--once`** — Generate schema, push to Convex, and exit (no long-running watch). The push is
`convex dev --once` with `--typecheck disable --codegen disable` unless you pass your own
`--typecheck` or `--codegen`, plus every forwarded flag. When auto-migration needs interim
pushes, they skip `--run`, `--run-component` and `--start`, which run once, on the final push.

**`--cwd <dir>`** — Run as if started from `<dir>`. vex consumes it; Convex never sees it.

### `vex deploy`

Handles production deployment:

```bash
vex deploy [--cwd <dir>] [convex deploy flags…]
```

1. Generates schema for production
2. Runs auto-migration if enabled (interim schema → mutations → final schema)
3. Executes `convex deploy`

Use this instead of `convex deploy` directly to ensure VEX schema is up to date. Every flag
vex doesn't own (`--cmd`, `--preview-create`, …) is forwarded to `convex deploy`; interim
migration pushes skip `--cmd` and `--cmd-url-env-var-name`, so your build runs once.

### `vex generate`

Regenerates `vex.types.ts` from the vex config. Schema emission and deploys stay with
`vex dev` / `vex deploy`; the runtime API needs no generated files — it is registered by the
factory functions (`collectionsApi`, the globals and media factories) in your `convex/`
directory. Auth collections are never generated — the client config builds them itself via its
auth package's client-safe builder (e.g. `betterAuthCollections()` from
`@vexcms/better-auth/client`); see the [Authentication guide](https://docs.vexcms.dev/guides/auth/).

```bash
vex generate
```

### `vex telemetry`

Manages anonymous build-time telemetry, which is on by default:

```bash
vex telemetry enable
vex telemetry disable
vex telemetry status [--json]
```

`status` shows whether telemetry is enabled, why, and where the settings file lives;
`--json` prints the exact payload `vex dev` / `vex deploy` would send for the current
project, without sending it. `DO_NOT_TRACK=1` or `VEX_TELEMETRY_DISABLED=1` also disable it,
and it is always off in CI. A telemetry failure never fails a command. Every field sent is
listed in the [Telemetry guide](https://docs.vexcms.dev/guides/telemetry/).

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

`vex dev`, `vex generate`, and `vex deploy` all require a **server** config —
`vex.config.server.ts` / `.mts` / `.js` / `.mjs` — because they need server-only fields
(`auth`, `storage.adapters`). Each is searched for in the current directory, then `src/`,
before falling back to the client-only family (`vex.config.ts` / `.mts` / `.js` / `.mjs`,
searched the same way) — a client-only fallback still resolves for tooling that only needs
`VexClientConfig`, but the three commands above reject it with a clear error naming the
missing `vex.config.server.*` file. Neither family found anywhere throws, naming every path
tried. Uses **Jiti** for dynamic TypeScript loading with tsconfig path alias support.

## Peer Dependencies

- `@vexcms/core` — Core VEX CMS types and utilities
- `convex` — Convex backend (>=1.0.0)
