---
status: draft
spec_id: 2026-10-26-build-time-telemetry
touches:
  - packages/telemetry/**
  - packages/cli/src/**
  - packages/cli/package.json
  - packages/create-vexcms/src/**
  - packages/create-vexcms/package.json
  - apps/test/src/vexcms/collections/**
  - apps/test/src/db/constants/index.ts
  - apps/test/src/vex.config.ts
  - apps/test/src/auth/access.ts
  - apps/test/convex/http.ts
  - apps/test/convex/telemetry/**
  - apps/test/package.json
  - apps/test/vitest.config.ts
  - apps/docs/src/content/docs/guides/telemetry.mdx
  - .changeset/**
  - scripts/verify-scaffold.mjs
  - scripts/vex-dev.mjs
prompt_version: 1
---

# 2026-10-26-build-time-telemetry — Spec

## Overview

Launch-plan item **M**. The `vex` CLI and `create-vexcms` send one anonymous event per run. Each event carries the **shape** of the project's vex config (every name replaced by a number), the scaffold choices, vex-owned timings and a coarse run outcome. The goal is to aim 0.1.x work at what real projects build and where setups break. The pattern follows Next.js, Astro and Turborepo: opt-out, a first-run notice, `DO_NOT_TRACK`, off in CI, and a public field list. While the developer confirms the pipeline, the receiver lives in `apps/test`. It keeps a raw event log plus one row per project with flat columns, so declared list views can filter and sort by feature and size. Input: `../2026-10-24-telemetry/stem.md` (T1–T9). Tier: low-care.

## Design Decisions

1. **One event per run, from `vex dev` (once per process, after the first generation attempt, ok or failed), `vex deploy` and `create-vexcms`.** Watch reloads and `vex generate` send nothing. Why: counts projects and command use without one event per watch reload.
2. **Private workspace package `@vexcms/telemetry` (`"private": true`), bundled into `@vexcms/cli` and `create-vexcms` at build time via tsup's `noExternal`.** Both consumers list it as a `devDependency`, never a real `dependency`, because tsup inlines its code into each CLI's own `dist` output — npm consumers of the published `@vexcms/cli`/`create-vexcms` packages never need to resolve the private package themselves. Why: one notice, one settings file, one sender, so the two binaries can't drift, without publishing a third package.
3. **Payload = the allowlisted config shape with numbered names** (`collection1`, `field2`, `block3`). Booleans, numeric limits and known enum literals are kept. Select options become `optionCount`. Functions become `true`. Every other string and any unknown key is dropped. Why: keeps the config insight that bare counts lose; an allowlist means a new config key leaks nothing until it is reviewed.
4. **Names are dropped, never hashed.** Why: a hash of a guessable name can be reversed with a dictionary.
5. **Ids: a random `machineId`; `projectId` = sha256(per-machine random salt + realpath of the project).** Why: can't be reversed or linked across machines. The rejected option, a hash of the git remote with a global salt, would let anyone match public repos by hashing their URLs.
6. **Settings live at `$XDG_CONFIG_HOME/vexcms/telemetry.json` (fallback `~/.config/vexcms/telemetry.json`).** Precedence: `DO_NOT_TRACK` → `VEX_TELEMETRY_DISABLED` → CI → stored setting → default on. Env vars can only turn telemetry off. Why: the standard XDG location, and nothing in the environment can switch telemetry on against the user's setting.
7. **In-process `fetch` with a 1.5s `AbortSignal.timeout`; errors swallowed.** `dev` doesn't await; `deploy` and `create` await, bounded at 1.5s. Why: Next.js's detached-flush process has open leak reports ([#97716](https://github.com/vercel/next.js/issues/97716), [discussion #92805](https://github.com/vercel/next.js/discussions/92805)). `vex dev` lives long enough to finish an in-process send.
8. **Timings are vex-owned only:** `configLoadMs`, `schemaGenMs`, `schemaChanged`. Why: Convex push and deploy times mostly measure the network and Convex.
9. **`VEX_TELEMETRY_DEBUG=1` prints the payload and doesn't send; `VEX_TELEMETRY_ENDPOINT` overrides the URL; `vex telemetry status --json` prints the exact payload.** Why: local testing against the receiver, and the transparency T8 promises.
10. **The receiver lives in `apps/test` for now.** An HTTP action at `POST /telemetry/events` with a 512KB (`524_288` byte) body cap, a `schemaVersion` check and a strict Convex validator; no IP is read or stored. No rate limiting. The final home (`apps/www` or a dedicated app) and the real `DEFAULT_TELEMETRY_ENDPOINT` are a developer decision taken before release, outside this spec. Why: confirm the full pipeline on an unpublished app before committing to a deployment.
11. **Two collections: a raw `telemetryEvents` log and a `telemetryProjects` summary, one row per `projectId`.** The ingest mutation derives the project row's flat checkbox, number and select columns from the payload. Only the columns that views sort on are indexed. Declared `admin.views` give a starter set of analyses. Why: vexcms list views can't filter or sort `json` fields; per-project rows count apps rather than `vex dev` runs; and because the columns are derived on the server, a new column is an app change plus a backfill from stored payloads, with no CLI release.
12. **The payload is the stable contract; collection columns are not.** Old CLIs keep sending their `schemaVersion` forever, so the payload carries every analysis dimension now: full anonymized shape, access-rule breakdown (boolean/callback/field-map/query-constraint), lifecycle hook counts, framework, auth adapter kind, storage adapter kinds and list-view usage. Why: data missing from the payload can't be recovered later.
13. **`outcome` is a coarse category: `ok`, or `failed` with a vex-owned stage (`resolveConfig`/`loadConfig`/`generateSchema`/`scaffold`) and an allowlisted error code taken from core's config-error class names.** No messages, stacks, paths or values. Why: shows which configuration shapes fail without becoming crash reporting.
14. **Retention is indefinite, documented on the docs page; only the vendor team can read the data.** Why: the payload is anonymous under decisions 3–5, so GDPR's storage-limitation rule doesn't apply. The docs page also states that a schema's shape is a fingerprint.
15. **Legal review is a `[dev]` gate before release, not before implementation.** Why: wording can change without code changes.
16. **No package versioning in this spec.** `@vexcms/telemetry` is private and unpublished, so it needs no changeset of its own; running `changeset version` for `@vexcms/cli` and `create-vexcms`, choosing the version line and joining the `fixed` group are left to the developer after confirmation.

## Out of Scope

- `vex telemetry link` and any linking to a customer (post-0.1.0, opt-in, licence-bound; T9).
- Runtime, browser or Convex-deployment telemetry.
- Error and crash reporting beyond `outcome`'s stage and error category: no messages, stacks or Convex push/deploy failures.
- Charts or custom dashboard screens; analysis is done with declared and saved list views.
- Choosing and deploying the final receiver (`apps/www` or a dedicated app).
- Linking telemetry to issues or feedback (backlog: "Link telemetry snapshots to issue reports").
- Convex push/deploy timing, and rate limiting on the endpoint.

## Implementation

### Step 1 — `@vexcms/telemetry` package scaffold [agent]

Why: `vex` and `create-vexcms` share one notice, one settings file and one sender; the package has to exist before either can use it.

- [ ] `packages/telemetry/package.json`
- [ ] `packages/telemetry/tsup.config.ts`
- [ ] `packages/telemetry/tsconfig.json`
- [ ] `packages/telemetry/tsconfig.build.json`
- [ ] `packages/telemetry/tsconfig.check.json`
- [ ] `packages/telemetry/vitest.config.ts`
- [ ] `packages/telemetry/src/constants.ts`
- [ ] `packages/telemetry/src/types.ts`
- [ ] `packages/telemetry/src/index.ts`

No other repo files change: `turbo.json` runs tasks by script name across every workspace package, so a new package is picked up automatically. The root `tsconfig.json` holds no `references` array (no project-reference graph in this repo), so nothing there needs the new package either. `@vexcms/telemetry` is private and unpublished, so it needs no changeset of its own, and `.changeset/config.json`'s `fixed` group only lists packages that currently exist — it is edited once `@vexcms/cli` and `create-vexcms` start shipping version bumps that depend on telemetry's bundled code, and `.changeset/pre.json` is maintained by the `changeset`/`changeset version` CLI itself, never hand-edited.

#### packages/telemetry/package.json

Mirrors `packages/cli/package.json`'s fields minus `bin` and `keywords`/`files`, and depends on nothing beyond Node built-ins and the global `fetch` — so no runtime `dependencies` at all. `"private": true`: unlike `@vexcms/cli` and `create-vexcms`, this package is never published; it is bundled into both of them at build time via tsup `noExternal` (Step 6/Step 9), so it carries no `publishConfig`. `@vexcms/core` is a type-only peer (per the shared contract), matched by a `workspace:*` devDependency per P-013/P-014. Two export subpaths: `.` for the barrel and `./config` for the settings/config entry point added in Step 2.

```json
{
  "name": "@vexcms/telemetry",
  "version": "0.1.0-alpha.27",
  "description": "VexCMS anonymous build-time telemetry: settings, anonymization and the event sender shared by vex and create-vexcms",
  "license": "Apache-2.0",
  "author": "Isaiah Anyimi",
  "homepage": "https://docs.vexcms.dev",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ianyimi/vex.git",
    "directory": "packages/telemetry"
  },
  "private": true,
  "sideEffects": false,
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./config": {
      "import": "./dist/config.js",
      "types": "./dist/config.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup && tsc -p tsconfig.build.json --emitDeclarationOnly",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit -p tsconfig.check.json",
    "test": "vitest run"
  },
  "peerDependencies": {
    "@vexcms/core": "workspace:^"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "@vexcms/core": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

#### packages/telemetry/tsup.config.ts

Same shape as `packages/cli/tsup.config.ts` minus the `banner` (this package ships no executable). Declarations come from the `tsc --emitDeclarationOnly` step in `build`, per P-011 / ADR-005.

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/config.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
  sourcemap: true,
  clean: true,
  external: ["@vexcms/core"],
});
```

#### packages/telemetry/tsconfig.json

Copied from `packages/cli/tsconfig.json`, repointed at `packages/telemetry`.

```json
{
  "extends": "@vexcms/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": [
      "node"
    ],
    "paths": {
      "@vexcms/core": [
        "../../packages/core/src/index.ts"
      ]
    }
  },
  "include": [
    "src"
  ]
}
```

#### packages/telemetry/tsconfig.build.json

Copied from `packages/cli/tsconfig.build.json`.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "paths": {},
    // Resolve workspace deps through their published `types` entry (dist/*.d.ts)
    // rather than the `source` condition. Consuming sibling *source* here would
    // pull those files into this program, outside `rootDir` (TS6059), and is why
    // declaration emit was previously disabled. Turbo's `dependsOn: ["^build"]`
    // guarantees upstream dist/ exists first.
    "customConditions": []
  },
  "exclude": [
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/test/**"
  ]
}
```

#### packages/telemetry/tsconfig.check.json

Copied from `packages/cli/tsconfig.check.json`.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "paths": {},
    "noEmit": true,
    "rootDir": "..",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

#### packages/telemetry/vitest.config.ts

Copied from `packages/cli/vitest.config.ts`.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Threads, not `forks`: fork workers outlive a crashed/interrupted run.
    // See packages/core/vitest.config.ts.
    pool: "threads",
    globals: true,
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
```

#### packages/telemetry/src/constants.ts

Every literal is a named constant per P-003; `TELEMETRY_ENV` centralizes the env var names so later steps never inline them.

```ts
/** Current shape version stamped on every outgoing `TelemetryEvent`. */
export const TELEMETRY_SCHEMA_VERSION = 1;

/** Public docs page explaining what telemetry collects and how to disable it. */
export const TELEMETRY_DOCS_URL = "https://docs.vexcms.dev/guides/telemetry/";

/** HTTP endpoint telemetry events are POSTed to unless overridden by `VEX_TELEMETRY_ENDPOINT`. */
export const DEFAULT_TELEMETRY_ENDPOINT = "https://telemetry.vexcms.dev/events";

/** Maximum time, in milliseconds, a telemetry send is allowed to block the caller. */
export const TELEMETRY_TIMEOUT_MS = 1500;

/** Maximum serialized event body size, in bytes, before `fitTelemetryEvent` truncates or drops the payload. */
export const TELEMETRY_MAX_BODY_BYTES = 524_288;

/** Environment variable names telemetry reads, keyed by their purpose. */
export const TELEMETRY_ENV = {
  doNotTrack: "DO_NOT_TRACK",
  disabled: "VEX_TELEMETRY_DISABLED",
  debug: "VEX_TELEMETRY_DEBUG",
  endpoint: "VEX_TELEMETRY_ENDPOINT",
  xdgConfigHome: "XDG_CONFIG_HOME",
} as const;

/** CLI commands that each emit at most one telemetry event per invocation. */
export const TELEMETRY_EVENTS = ["dev", "deploy", "create"] as const;
```

#### packages/telemetry/src/types.ts

Per the shared contract: every type this step owns, with `TelemetryEvent["config"]` left as `unknown` until step 4 narrows it to `AnonymizedConfig` (shown there as a numbered edit to this file).

```ts
import type { TELEMETRY_EVENTS, TELEMETRY_SCHEMA_VERSION } from "./constants";

/** Subset of process environment variables telemetry reads; never the full `process.env`. */
export type TelemetryEnv = Record<string, string | undefined>;

/** Derived from {@link TELEMETRY_EVENTS}. */
export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number];

/** Per-machine telemetry state persisted to the settings file. */
export interface TelemetrySettings {
  enabled?: boolean;
  machineId: string;
  salt: string;
  noticeShownAt?: string;
}

/** Runtime/toolchain facts recorded on every telemetry event. */
export interface TelemetryEnvironment {
  vexVersions: Record<string, string>;
  nodeVersion: string;
  os: NodeJS.Platform;
  arch: string;
  packageManager: "pnpm" | "npm" | "yarn" | "bun" | "unknown";
  framework: "next" | "tanstack" | "unknown";
}

/** Vex-owned timing data for one `dev`/`deploy` run's config load and schema generation. */
export interface TelemetryTimings {
  configLoadMs: number;
  schemaGenMs: number;
  schemaChanged: boolean;
}

/** Scaffold choices recorded on a `create-vexcms` run's telemetry event. */
export interface TelemetryCreateOptions {
  framework: string;
  template: "base" | "marketing";
  bare: boolean;
  auth: {
    emailPassword: boolean;
    oauthProviderCount: number;
    orgs: boolean;
  };
  monorepo: boolean;
  initGit: boolean;
  installDependencies: boolean;
}

/** Pipeline stage a `dev`/`deploy`/`create` run failed at — vex-owned stages only, never the Convex push/deploy itself. */
export const TELEMETRY_FAILURE_STAGES = ["resolveConfig", "loadConfig", "generateSchema", "scaffold"] as const;

/** Derived from {@link TELEMETRY_FAILURE_STAGES}. */
export type TelemetryFailureStage = (typeof TELEMETRY_FAILURE_STAGES)[number];

/** Allowlisted classification of a caught error, resolved by `classifyTelemetryError` from the error's `name` — never its message. */
export const TELEMETRY_ERROR_CODES = [
  "configError",
  "accessConfigError",
  "authConfigError",
  "componentConfigError",
  "storageConfigError",
  "unknown",
] as const;

/** Derived from {@link TELEMETRY_ERROR_CODES}. */
export type TelemetryErrorCode = (typeof TELEMETRY_ERROR_CODES)[number];

/** Whether a run completed or failed, and if it failed, where and with what allowlisted error code. */
export type TelemetryOutcome =
  | { status: "ok" }
  | { status: "failed"; stage: TelemetryFailureStage; errorCode: TelemetryErrorCode };

/** The full payload one `vex dev`/`vex deploy`/`create-vexcms` run sends to the telemetry endpoint. */
export interface TelemetryEvent {
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  event: TelemetryEventName;
  machineId: string;
  projectId: string;
  sentAt: string;
  environment: TelemetryEnvironment;
  outcome: TelemetryOutcome;
  config?: unknown;
  timings?: TelemetryTimings;
  create?: TelemetryCreateOptions;
}
```

#### packages/telemetry/src/index.ts

Barrel re-exporting everything this step ships; later steps add their own re-exports here.

```ts
export * from "./constants";
export * from "./types";
```

Verify: `pnpm --filter @vexcms/telemetry run build && pnpm --filter @vexcms/telemetry run test && pnpm --filter @vexcms/telemetry run typecheck && node scripts/check-packed-manifests.mjs --sweep` green.

### Step 2 — Settings file and enablement [agent]

Why: every later step asks "may I send?" and needs the machine settings file.

- [ ] `packages/telemetry/src/settings.ts`
- [ ] `packages/telemetry/src/settings.test.ts`
- [ ] `packages/telemetry/src/isCi.ts`
- [ ] `packages/telemetry/src/isCi.test.ts`
- [ ] `packages/telemetry/src/isTelemetryEnabled.ts`
- [ ] `packages/telemetry/src/isTelemetryEnabled.test.ts`
- [ ] `packages/telemetry/src/index.ts` (edit)

#### packages/telemetry/src/settings.ts

Resolves the per-machine settings file path and reads/writes it. A missing, corrupt, or unreadable file is treated as absent and replaced with a freshly generated `machineId`/`salt` pair; persistence failures (e.g. an unwritable directory) are swallowed so telemetry never breaks a command.

```ts
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { TELEMETRY_ENV } from "./constants";
import type { TelemetryEnv, TelemetrySettings } from "./types";

/**
 * Resolve the per-machine telemetry settings file path, honoring
 * `XDG_CONFIG_HOME` before falling back to the user's home directory.
 * @param props.env - Environment to read `XDG_CONFIG_HOME` from.
 * @returns Absolute path to `telemetry.json`.
 */
export function resolveSettingsPath(props: { env: TelemetryEnv }): string {
  const xdgConfigHome = props.env[TELEMETRY_ENV.xdgConfigHome];
  const configHome =
    xdgConfigHome && xdgConfigHome.length > 0 ? xdgConfigHome : join(homedir(), ".config");
  return join(configHome, "vexcms", "telemetry.json");
}

function isTelemetrySettings(value: unknown): value is TelemetrySettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "machineId" in value &&
    typeof value.machineId === "string" &&
    "salt" in value &&
    typeof value.salt === "string"
  );
}

function createDefaultSettings(): TelemetrySettings {
  return {
    machineId: randomUUID(),
    salt: randomBytes(32).toString("hex"),
  };
}

function readExistingSettings(props: { path: string }): TelemetrySettings | undefined {
  if (!existsSync(props.path)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(props.path, "utf8"));
    return isTelemetrySettings(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read the per-machine telemetry settings, generating and persisting a new
 * `machineId`/`salt` pair when the file is missing, corrupt, or unreadable.
 * @param props.env - Environment used to resolve the settings path.
 * @returns The stored settings, or newly generated ones.
 */
export function readTelemetrySettings(props: { env: TelemetryEnv }): TelemetrySettings {
  const path = resolveSettingsPath({ env: props.env });
  const existing = readExistingSettings({ path });
  if (existing) {
    return existing;
  }
  const settings = createDefaultSettings();
  writeTelemetrySettings({ env: props.env, settings });
  return settings;
}

/**
 * Persist telemetry settings to the resolved settings path. Never throws —
 * an unwritable directory or file silently leaves this process's state
 * unpersisted.
 * @param props.env - Environment used to resolve the settings path.
 * @param props.settings - Settings to write.
 */
export function writeTelemetrySettings(props: { env: TelemetryEnv; settings: TelemetrySettings }): void {
  const path = resolveSettingsPath({ env: props.env });
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(props.settings, null, 2));
  } catch {
    return;
  }
}
```

#### packages/telemetry/src/settings.test.ts

Follows the `mkdtempSync`/`XDG_CONFIG_HOME` pattern from `packages/cli/src/lib/resolveConfigPath.test.ts`. The "unwritable directory" case is produced portably by pointing `XDG_CONFIG_HOME` at a path segment that is a regular file, so `mkdirSync` fails with `ENOTDIR` regardless of user/permission setup.

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readTelemetrySettings, resolveSettingsPath, writeTelemetrySettings } from "./settings";
import type { TelemetrySettings } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SALT_PATTERN = /^[0-9a-f]{64}$/;

describe("resolveSettingsPath", () => {
  it("uses XDG_CONFIG_HOME when set", () => {
    expect(resolveSettingsPath({ env: { XDG_CONFIG_HOME: "/xdg" } })).toBe(
      join("/xdg", "vexcms", "telemetry.json"),
    );
  });

  it("falls back to ~/.config when XDG_CONFIG_HOME is unset", () => {
    expect(resolveSettingsPath({ env: {} })).toBe(join(homedir(), ".config", "vexcms", "telemetry.json"));
  });
});

describe("readTelemetrySettings / writeTelemetrySettings", () => {
  let tmpDir: string;
  let env: { XDG_CONFIG_HOME: string };

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vex-telemetry-settings-"));
    env = { XDG_CONFIG_HOME: tmpDir };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generates and persists a new machineId and salt when no file exists", () => {
    const settings = readTelemetrySettings({ env });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(settings.salt).toMatch(SALT_PATTERN);
    const path = resolveSettingsPath({ env });
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(settings);
  });

  it("returns stored settings unchanged when the file is valid", () => {
    const stored: TelemetrySettings = {
      machineId: "11111111-1111-1111-1111-111111111111",
      salt: "a".repeat(64),
      enabled: false,
      noticeShownAt: "2026-01-01T00:00:00.000Z",
    };
    mkdirSync(join(tmpDir, "vexcms"), { recursive: true });
    writeFileSync(resolveSettingsPath({ env }), JSON.stringify(stored));
    expect(readTelemetrySettings({ env })).toEqual(stored);
  });

  it("recovers from a corrupt settings file by generating a new one", () => {
    const path = resolveSettingsPath({ env });
    mkdirSync(join(tmpDir, "vexcms"), { recursive: true });
    writeFileSync(path, "{ not json");
    const settings = readTelemetrySettings({ env });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(settings.salt).toMatch(SALT_PATTERN);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(settings);
  });

  it("recovers from a settings file missing machineId/salt", () => {
    const path = resolveSettingsPath({ env });
    mkdirSync(join(tmpDir, "vexcms"), { recursive: true });
    writeFileSync(path, JSON.stringify({ enabled: true }));
    const settings = readTelemetrySettings({ env });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(settings.salt).toMatch(SALT_PATTERN);
  });

  it("readTelemetrySettings does not throw when the settings directory cannot be created", () => {
    const blockerPath = join(tmpDir, "blocker");
    writeFileSync(blockerPath, "not a directory");
    const blockedEnv = { XDG_CONFIG_HOME: blockerPath };
    expect(() => readTelemetrySettings({ env: blockedEnv })).not.toThrow();
    const settings = readTelemetrySettings({ env: blockedEnv });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(existsSync(resolveSettingsPath({ env: blockedEnv }))).toBe(false);
  });

  it("writeTelemetrySettings does not throw when the directory cannot be created", () => {
    const blockerPath = join(tmpDir, "blocker2");
    writeFileSync(blockerPath, "not a directory");
    const blockedEnv = { XDG_CONFIG_HOME: blockerPath };
    expect(() =>
      writeTelemetrySettings({ env: blockedEnv, settings: { machineId: "x", salt: "y" } }),
    ).not.toThrow();
  });
});
```

#### packages/telemetry/src/isCi.ts

Detects common CI providers by the presence of a non-empty environment variable they set.

```ts
import type { TelemetryEnv } from "./types";

const CI_ENV_KEYS = [
  "CI",
  "CONTINUOUS_INTEGRATION",
  "BUILD_NUMBER",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "VERCEL",
  "NETLIFY",
] as const;

/**
 * Detect whether the process is running in a known CI environment.
 * @param props.env - Environment to inspect.
 * @returns `true` when any known CI environment variable is set to a non-empty value.
 */
export function isCi(props: { env: TelemetryEnv }): boolean {
  return CI_ENV_KEYS.some((key) => {
    const value = props.env[key];
    return value !== undefined && value.length > 0;
  });
}
```

#### packages/telemetry/src/isCi.test.ts

```ts
import { describe, expect, it } from "vitest";

import { isCi } from "./isCi";

describe("isCi", () => {
  it("returns false when no CI environment variable is set", () => {
    expect(isCi({ env: {} })).toBe(false);
  });

  it.each([
    "CI",
    "CONTINUOUS_INTEGRATION",
    "BUILD_NUMBER",
    "GITHUB_ACTIONS",
    "GITLAB_CI",
    "VERCEL",
    "NETLIFY",
  ])("returns true when %s is set", (key) => {
    expect(isCi({ env: { [key]: "true" } })).toBe(true);
  });

  it("ignores an empty string value", () => {
    expect(isCi({ env: { CI: "" } })).toBe(false);
  });
});
```

#### packages/telemetry/src/isTelemetryEnabled.ts

Resolves the enable/disable precedence: `DO_NOT_TRACK` and `VEX_TELEMETRY_DISABLED` (any non-empty value other than `"0"`/`"false"`) beat CI detection, which beats the stored per-machine setting; the default is enabled.

```ts
import { TELEMETRY_ENV } from "./constants";
import { isCi } from "./isCi";
import type { TelemetryEnv, TelemetrySettings } from "./types";

export const TELEMETRY_STATUS_REASONS = [
  "doNotTrack",
  "envDisabled",
  "ci",
  "userDisabled",
  "userEnabled",
  "default",
] as const;

export type TelemetryStatusReason = (typeof TELEMETRY_STATUS_REASONS)[number];

function isEnvFlagSet(props: { env: TelemetryEnv; key: string }): boolean {
  const value = props.env[props.key];
  return value !== undefined && value !== "" && value !== "0" && value.toLowerCase() !== "false";
}

/**
 * Resolve whether telemetry should fire, and which rule decided it.
 * @param props.env - Environment to read the override variables from.
 * @param props.settings - Stored per-machine telemetry settings.
 * @returns `enabled` and the deciding `reason`.
 */
export function isTelemetryEnabled(props: {
  env: TelemetryEnv;
  settings: TelemetrySettings;
}): { enabled: boolean; reason: TelemetryStatusReason } {
  if (isEnvFlagSet({ env: props.env, key: TELEMETRY_ENV.doNotTrack })) {
    return { enabled: false, reason: "doNotTrack" };
  }
  if (isEnvFlagSet({ env: props.env, key: TELEMETRY_ENV.disabled })) {
    return { enabled: false, reason: "envDisabled" };
  }
  if (isCi({ env: props.env })) {
    return { enabled: false, reason: "ci" };
  }
  if (props.settings.enabled === false) {
    return { enabled: false, reason: "userDisabled" };
  }
  if (props.settings.enabled === true) {
    return { enabled: true, reason: "userEnabled" };
  }
  return { enabled: true, reason: "default" };
}
```

#### packages/telemetry/src/isTelemetryEnabled.test.ts

```ts
import { describe, expect, it } from "vitest";

import { isTelemetryEnabled } from "./isTelemetryEnabled";
import type { TelemetrySettings } from "./types";

const baseSettings: TelemetrySettings = { machineId: "machine-1", salt: "salt-1" };

describe("isTelemetryEnabled", () => {
  it("disables for DO_NOT_TRACK=1 even when settings and CI would otherwise allow it", () => {
    expect(
      isTelemetryEnabled({
        env: { DO_NOT_TRACK: "1", CI: "true" },
        settings: { ...baseSettings, enabled: true },
      }),
    ).toEqual({ enabled: false, reason: "doNotTrack" });
  });

  it("treats DO_NOT_TRACK=0 as unset", () => {
    expect(isTelemetryEnabled({ env: { DO_NOT_TRACK: "0" }, settings: baseSettings })).toEqual({
      enabled: true,
      reason: "default",
    });
  });

  it("treats DO_NOT_TRACK=false as unset", () => {
    expect(isTelemetryEnabled({ env: { DO_NOT_TRACK: "false" }, settings: baseSettings })).toEqual({
      enabled: true,
      reason: "default",
    });
  });

  it("disables for VEX_TELEMETRY_DISABLED=1", () => {
    expect(
      isTelemetryEnabled({
        env: { VEX_TELEMETRY_DISABLED: "1" },
        settings: { ...baseSettings, enabled: true },
      }),
    ).toEqual({ enabled: false, reason: "envDisabled" });
  });

  it("does not let VEX_TELEMETRY_DISABLED=0 override a stored false", () => {
    expect(
      isTelemetryEnabled({
        env: { VEX_TELEMETRY_DISABLED: "0" },
        settings: { ...baseSettings, enabled: false },
      }),
    ).toEqual({ enabled: false, reason: "userDisabled" });
  });

  it("disables in CI", () => {
    expect(
      isTelemetryEnabled({ env: { CI: "true" }, settings: { ...baseSettings, enabled: true } }),
    ).toEqual({ enabled: false, reason: "ci" });
  });

  it("disables for a stored enabled: false", () => {
    expect(isTelemetryEnabled({ env: {}, settings: { ...baseSettings, enabled: false } })).toEqual({
      enabled: false,
      reason: "userDisabled",
    });
  });

  it("enables for a stored enabled: true", () => {
    expect(isTelemetryEnabled({ env: {}, settings: { ...baseSettings, enabled: true } })).toEqual({
      enabled: true,
      reason: "userEnabled",
    });
  });

  it("defaults to enabled when nothing overrides it", () => {
    expect(isTelemetryEnabled({ env: {}, settings: baseSettings })).toEqual({
      enabled: true,
      reason: "default",
    });
  });
});
```

#### packages/telemetry/src/index.ts

1 edit — everything else from Step 1's barrel is unchanged.

**1 — add the Step 2 exports beside the existing `export * from "./constants";` / `export * from "./types";` lines.**

```ts
export * from "./isCi";
export * from "./isTelemetryEnabled";
export * from "./settings";
```

Verify: `pnpm --filter @vexcms/telemetry test -- settings isCi isTelemetryEnabled`

### Step 3 — Anonymous ids [agent]

Why: T6, so repeat runs of one project aren't double-counted, without anything linkable.

#### packages/telemetry/src/projectId.ts

New file. Derives a stable, non-reversible project identifier from the machine's secret `salt` (from settings) and the project's real (symlink-resolved) absolute path, so the same project always yields the same id and nothing in the payload reveals the path itself.

```ts
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Derives a stable, non-reversible identifier for a project directory.
 *
 * The id is a sha256 hex digest of the machine-local `salt` concatenated
 * with the project's real (symlink-resolved) absolute path, so the same
 * project on the same machine always produces the same id, different
 * machines (different salts) never produce the same id for the same
 * project, and the id cannot be reversed back into a filesystem path.
 *
 * @param props.salt - Machine-local secret from `TelemetrySettings.salt`.
 * @param props.projectDir - Absolute or relative path to the project root.
 * @returns A 64-character lowercase hex sha256 digest.
 */
export function createProjectId(props: { salt: string; projectDir: string }): string {
  const resolvedPath = resolveProjectPath(props.projectDir);
  return createHash("sha256").update(`${props.salt}\0${resolvedPath}`).digest("hex");
}

function resolveProjectPath(projectDir: string): string {
  try {
    return realpathSync(projectDir);
  } catch {
    return resolve(projectDir);
  }
}
```

#### packages/telemetry/src/projectId.test.ts

New file. A fixed salt still yields a path-dependent digest, so exact hex values aren't asserted — instead the test locks in the properties that matter: determinism, salt sensitivity, path sensitivity, symlink-equivalence, and the 64-char hex shape.

```ts
import { mkdtempSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createProjectId } from "./projectId";

describe("createProjectId", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "vex-telemetry-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("returns a 64-character lowercase hex string", () => {
    const id = createProjectId({ salt: "fixed-salt", projectDir });

    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same salt and project directory", () => {
    const first = createProjectId({ salt: "fixed-salt", projectDir });
    const second = createProjectId({ salt: "fixed-salt", projectDir });

    expect(first).toBe(second);
  });

  it("differs when the salt differs", () => {
    const withSaltA = createProjectId({ salt: "salt-a", projectDir });
    const withSaltB = createProjectId({ salt: "salt-b", projectDir });

    expect(withSaltA).not.toBe(withSaltB);
  });

  it("differs when the project directory differs", () => {
    const otherDir = mkdtempSync(join(tmpdir(), "vex-telemetry-other-"));

    try {
      const idForProjectDir = createProjectId({ salt: "fixed-salt", projectDir });
      const idForOtherDir = createProjectId({ salt: "fixed-salt", projectDir: otherDir });

      expect(idForProjectDir).not.toBe(idForOtherDir);
    } finally {
      rmSync(otherDir, { recursive: true, force: true });
    }
  });

  it("produces the same id for a symlink and its real target", () => {
    const linkPath = join(tmpdir(), `vex-telemetry-link-${process.pid}-${Date.now()}`);
    symlinkSync(projectDir, linkPath);

    try {
      const idForRealPath = createProjectId({ salt: "fixed-salt", projectDir });
      const idForSymlink = createProjectId({ salt: "fixed-salt", projectDir: linkPath });

      expect(idForSymlink).toBe(idForRealPath);
    } finally {
      unlinkSync(linkPath);
    }
  });
});
```

#### packages/telemetry/src/index.ts

1 edit — barrel export. Everything else in the file (exports from steps 1, 2, and later steps) is unchanged; add the `projectId` export alongside the other named exports.

```ts
export { createProjectId } from "./projectId";
```

Verify: `pnpm --filter @vexcms/telemetry test projectId.test.ts` green.

### Step 4 — Anonymized config payload [agent]

Why: T5 plus the interview decision: full config shape with numbered names and allowlisted keys only.
Verify: `pnpm --filter @vexcms/telemetry test anonymizeConfig` green, including the leak test.

- [ ] `src/types.ts` — add `AnonymizedField`, `AnonymizedBlock`, `AnonymizedResource`, `AnonymizedMediaCollection`, `AnonymizedConfig`; narrow `TelemetryEvent.config` from `unknown` to `AnonymizedConfig`
- [ ] `src/anonymizeConfig.ts`
- [ ] `src/anonymizeConfig.test.ts`
- [ ] `src/config.ts` — new file, re-exports `anonymizeConfig` as the `@vexcms/telemetry/config` subpath entry (see Step 1's `package.json` `exports` map); `anonymizeConfig` is NOT exported from the root `src/index.ts` barrel

Numbering scheme (binding on the implementer): collections, globals, media collections, and blocks each get their OWN counter (`collectionN`, `globalN`, `mediaN`, `blockN`), counted in the order they appear in `config.collections` / `config.globals` / `config.mediaCollections` / each `blocks()` field's `blocks` array as the whole config is walked depth-first (collections, then globals, then media collections). Fields share ONE counter (`fieldN`) across every resource and every nesting depth, incremented in the same depth-first traversal order, so a field inside an `array()` item or a block gets the next number exactly where it is encountered. `relationship()` and `upload()` targets are resolved through the already-assigned `collectionN` / `mediaN` name — never dropped, never the original slug — because collection and media names are assigned in a first pass (they don't depend on field traversal), before any field is visited.

#### packages/telemetry/src/types.ts

2 edits to the file Step 1 created — everything else unchanged.

**1 — new interfaces.** Add above the `TelemetryEvent` interface, and add a new `import type { ... } from "@vexcms/core";` line for the enum/literal types these interfaces reference:

```ts
import type {
  AdminFieldType,
  Alignment,
  ColorFormat,
  CommitTsFieldAdminFormat,
  CommitTsFieldOn,
  SelectDisplay,
  StorageAdapterProtocol,
} from "@vexcms/core";

/**
 * One field inside an {@link AnonymizedConfig} payload. Every property is
 * either the field's `type`, a generated name (`field1`), a count, a
 * boolean, or an allowlisted enum literal — never a label, description,
 * default value, option value, mask pattern, or URL.
 */
export interface AnonymizedField {
  name: string;
  type: AdminFieldType;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  position?: "main" | "sidebar";
  cellAlignment?: Alignment;
  hasValidate?: boolean;
  hasIndex?: boolean;
  hasSearchIndex?: boolean;
  hasMask?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  defaultValue?: boolean;
  format?: ColorFormat | CommitTsFieldAdminFormat;
  themeColors?: boolean;
  time?: {
    hidden: boolean;
    use12HourFormat: boolean;
    timePicker: { hour: boolean; minute: boolean; second: boolean };
  };
  hasMany?: boolean;
  optionCount?: number;
  display?: SelectDisplay;
  searchable?: boolean;
  target?: string;
  hasAccept?: boolean;
  hasMediaTarget?: boolean;
  defaultCollapsed?: boolean;
  items?: AnonymizedField;
  fields?: AnonymizedField[];
  blocks?: AnonymizedBlock[];
  tabCount?: number;
  tabs?: { fieldCount: number; fields: AnonymizedField[] }[];
  hasCustomCell?: boolean;
  enableSorting?: boolean;
  enableHiding?: boolean;
  on?: CommitTsFieldOn;
}

/** One block definition inside an anonymized `blocks()` field. */
export interface AnonymizedBlock {
  name: string;
  fieldCount: number;
  defaultCollapsed?: boolean;
  fields: AnonymizedField[];
}

/** One anonymized collection or global. */
export interface AnonymizedResource {
  name: string;
  fieldCount: number;
  fields: AnonymizedField[];
  hasDrafts: boolean;
  hasLivePreview: boolean;
  indexCount?: number;
  timestamps: boolean;
  savedViewCount?: number;
  defaultSortIsCustom?: boolean;
  bulkDelete?: boolean;
  hookCounts: Record<"beforeChange" | "beforeDelete" | "afterChange" | "afterDelete", number>;
}

/** One anonymized media collection — an {@link AnonymizedResource} plus its storage adapter kind. */
export interface AnonymizedMediaCollection extends AnonymizedResource {
  storageAdapterKind?: StorageAdapterProtocol;
}

/**
 * Privacy-reviewed shape of `VexConfig` sent as `TelemetryEvent.config`.
 * Collection, global, media collection, and block NAMES are replaced with
 * `collectionN` / `globalN` / `mediaN` / `blockN`; field names with `fieldN`
 * — each counter running in traversal order.
 * No collection, field, block, or role NAME ever appears in this shape, only
 * counts, booleans, numbers, and allowlisted enum literals.
 */
export interface AnonymizedConfig {
  collectionCount: number;
  globalCount: number;
  mediaCollectionCount: number;
  blockCount: number;
  fieldCount: number;
  collections: AnonymizedResource[];
  globals: AnonymizedResource[];
  mediaCollections: AnonymizedMediaCollection[];
  features: {
    drafts: boolean;
    livePreview: boolean;
    conditions: boolean;
    slots: boolean;
    inputMasks: boolean;
    /**
     * Always `false` — `@vexcms/core` has no localization feature yet
     * (richtext is deliberately locale-agnostic). Reserved so the docs page
     * and this shape don't change again the day core adds one.
     */
    localization: false;
    auth: boolean;
    authAdapter: "none" | "betterAuth" | "custom";
    access: {
      enabled: boolean;
      roleCount: number;
      ruleCount: number;
      fieldPermissionRuleCount: number;
      queryConstraintRuleCount: number;
      callbackRuleCount: number;
      customActionCount: number;
      customResourceCount: number;
      organizations: boolean;
    };
    hookCount: number;
  };
  storageAdapterKinds: StorageAdapterProtocol[];
  /** Set only when `fitTelemetryEvent` dropped the per-resource arrays to fit the size cap; every count and `features` field still reflects the real config. */
  truncated?: true;
}
```

**2 — narrow `TelemetryEvent.config`.** Replace the `config?: unknown;` property on `TelemetryEvent` with:

```ts
  config?: AnonymizedConfig;
```

#### packages/telemetry/src/anonymizeConfig.ts

Walks a resolved `VexConfig` depth-first and produces the numbered, allowlisted-only `AnonymizedConfig` described above. Collection and media names are assigned up front (independent of field order) so `relationship()`/`upload()` targets resolve correctly regardless of which field is visited first; block and field names are assigned as the single depth-first walk encounters them.

```ts
import {
  ADMIN_CUSTOM_SUBJECTS,
  ADMIN_FIELDS,
  type AdminDataField,
  type AdminField,
  type AdminUIField,
  type BlockConfig,
  type CollectionConfig,
  type GlobalConfig,
  type MediaCollectionConfig,
  type StorageAdapterProtocol,
  type VexAccessConfig,
  type VexConfig,
} from "@vexcms/core";
import type {
  AnonymizedBlock,
  AnonymizedConfig,
  AnonymizedField,
  AnonymizedMediaCollection,
  AnonymizedResource,
} from "./types";

interface AnonymizeContext {
  collectionNames: Map<string, string>;
  mediaNames: Map<string, string>;
  counters: { block: number; field: number };
  flags: { conditions: boolean; slots: boolean; inputMasks: boolean };
}

function buildSlugNameMap(props: { slugs: string[]; prefix: string }): Map<string, string> {
  const map = new Map<string, string>();
  props.slugs.forEach((slug, index) => {
    map.set(slug, `${props.prefix}${index + 1}`);
  });
  return map;
}

function nextName(props: { context: AnonymizeContext; kind: "block" | "field" }): string {
  props.context.counters[props.kind] += 1;
  return `${props.kind}${props.context.counters[props.kind]}`;
}

function isInjectedUpdatedAt(props: { key: string; field: AdminField }): boolean {
  const meta = props.field.meta as Record<string, unknown> | undefined;
  return (
    props.key === "updatedAt" &&
    props.field.type === ADMIN_FIELDS.commitTs.type &&
    meta?.locked !== true
  );
}

function hasSlotOverrides(components: {
  Input: unknown[];
  Field: unknown[];
  Cell: unknown[];
  Label: unknown[];
  Description: unknown[];
  beforeInput: unknown[];
  afterInput: unknown[];
}): boolean {
  return (
    components.Input.length > 0 ||
    components.Field.length > 0 ||
    components.Cell.length > 0 ||
    components.Label.length > 0 ||
    components.Description.length > 0 ||
    components.beforeInput.length > 0 ||
    components.afterInput.length > 0
  );
}

function hasRootSlotOverrides(admin: VexConfig["admin"]): boolean {
  const perTypeOverride = Object.values(admin.components.fields).some(
    (entry) => (entry?.Input.length ?? 0) > 0 || (entry?.Field.length ?? 0) > 0 || (entry?.Cell.length ?? 0) > 0,
  );
  return (
    perTypeOverride ||
    admin.components.blocks.itemActions.length > 0 ||
    admin.components.blocks.headerActions.length > 0 ||
    admin.components.array.itemActions.length > 0
  );
}

const RESOURCE_HOOK_NAMES = ["beforeChange", "beforeDelete", "afterChange", "afterDelete"] as const;

function buildHookCounts(hooks: object): AnonymizedResource["hookCounts"] {
  const record = hooks as Record<string, unknown>;
  return Object.fromEntries(
    RESOURCE_HOOK_NAMES.map((name) => [name, typeof record[name] === "function" ? 1 : 0]),
  ) as AnonymizedResource["hookCounts"];
}

const AUTH_ADAPTER_KINDS = {
  "better-auth": "betterAuth",
} as const;

function anonymizeAuthAdapter(auth: VexConfig["auth"]): "none" | "betterAuth" | "custom" {
  if (!auth) {
    return "none";
  }
  return AUTH_ADAPTER_KINDS[auth.adapter.name as keyof typeof AUTH_ADAPTER_KINDS] ?? "custom";
}

function anonymizeAccess(access: VexAccessConfig | undefined): AnonymizedConfig["features"]["access"] {
  if (!access) {
    return {
      enabled: false,
      roleCount: 0,
      ruleCount: 0,
      fieldPermissionRuleCount: 0,
      queryConstraintRuleCount: 0,
      callbackRuleCount: 0,
      customActionCount: 0,
      customResourceCount: 0,
      organizations: false,
    };
  }

  const knownSubjects = new Set<string>([
    ...access.resources.map((resource) => resource.slug),
    access.userCollectionSlug,
    ...(access.orgCollectionSlug ? [access.orgCollectionSlug] : []),
    ...Object.keys(ADMIN_CUSTOM_SUBJECTS),
  ]);
  const subjectKeys = new Set<string>();
  for (const subjectChecks of Object.values(access.permissions)) {
    for (const subjectKey of Object.keys(subjectChecks)) {
      subjectKeys.add(subjectKey);
    }
  }
  const customResourceCount = [...subjectKeys].filter((subjectKey) => !knownSubjects.has(subjectKey)).length;

  let ruleCount = 0;
  let fieldPermissionRuleCount = 0;
  let queryConstraintRuleCount = 0;
  let callbackRuleCount = 0;
  for (const subjectChecks of Object.values(access.permissions)) {
    for (const subjectValue of Object.values(subjectChecks)) {
      const checks =
        typeof subjectValue === "boolean" ? [subjectValue] : Object.values(subjectValue as Record<string, unknown>);
      for (const check of checks) {
        ruleCount += 1;
        if (typeof check === "function") {
          callbackRuleCount += 1;
        } else if (check !== null && typeof check === "object") {
          if ("where" in check || "withIndex" in check) {
            queryConstraintRuleCount += 1;
          } else {
            fieldPermissionRuleCount += 1;
          }
        }
      }
    }
  }

  const customActionCount = Object.values(access.customActions ?? {}).reduce(
    (sum, customAction) => sum + (customAction?.query?.length ?? 0) + (customAction?.mutation?.length ?? 0),
    0,
  );

  return {
    enabled: access.enabled,
    roleCount: access.roles.length,
    ruleCount,
    fieldPermissionRuleCount,
    queryConstraintRuleCount,
    callbackRuleCount,
    customActionCount,
    customResourceCount,
    organizations: access.organizations,
  };
}

function dataFieldBase(props: { field: AdminDataField; name: string; context: AnonymizeContext }): AnonymizedField {
  const { field, name, context } = props;
  if (typeof field.admin.condition === "function") {
    context.flags.conditions = true;
  }
  if (hasSlotOverrides(field.admin.components)) {
    context.flags.slots = true;
  }
  return {
    name,
    type: field.type,
    required: field.required,
    hidden: field.admin.hidden,
    readOnly: field.admin.readOnly,
    position: field.admin.position,
    cellAlignment: field.admin.cellAlignment,
    hasValidate: typeof field.validate === "function",
    hasIndex: field.index !== undefined,
    enableSorting: field.admin.enableSorting,
    enableHiding: field.admin.enableHiding,
  };
}

function uiFieldBase(props: { field: AdminUIField; name: string; context: AnonymizeContext }): AnonymizedField {
  const { field, name, context } = props;
  if (typeof field.admin.condition === "function") {
    context.flags.conditions = true;
  }
  return {
    name,
    type: field.type,
    hidden: field.admin.hidden,
    readOnly: field.admin.readOnly,
    position: field.admin.position,
  };
}

function anonymizeField(props: { field: AdminField; context: AnonymizeContext }): AnonymizedField {
  const { field, context } = props;
  const name = nextName({ context, kind: "field" });

  switch (field.type) {
    case ADMIN_FIELDS.text.type:
    case ADMIN_FIELDS.email.type: {
      const hasMask = field.admin.mask !== undefined && field.admin.mask !== false;
      if (hasMask) context.flags.inputMasks = true;
      return {
        ...dataFieldBase({ field, name, context }),
        hasMask,
        min: field.min?.[0],
        max: field.max?.[0],
        hasSearchIndex: field.searchIndex !== undefined,
      };
    }
    case ADMIN_FIELDS.url.type: {
      const hasMask = field.admin.mask !== undefined && field.admin.mask !== false;
      if (hasMask) context.flags.inputMasks = true;
      return {
        ...dataFieldBase({ field, name, context }),
        hasMask,
        min: field.min?.[0],
        max: field.max?.[0],
      };
    }
    case ADMIN_FIELDS.number.type: {
      const hasMask = field.admin.mask !== undefined && field.admin.mask !== false;
      if (hasMask) context.flags.inputMasks = true;
      return {
        ...dataFieldBase({ field, name, context }),
        hasMask,
        min: field.min?.[0],
        max: field.max?.[0],
        step: field.step,
      };
    }
    case ADMIN_FIELDS.textarea.type:
      return {
        ...dataFieldBase({ field, name, context }),
        min: field.min?.[0],
        max: field.max?.[0],
        rows: field.rows,
        hasSearchIndex: field.searchIndex !== undefined,
      };
    case ADMIN_FIELDS.color.type:
      return { ...dataFieldBase({ field, name, context }), format: field.format, themeColors: field.themeColors };
    case ADMIN_FIELDS.checkbox.type:
      return { ...dataFieldBase({ field, name, context }), defaultValue: field.defaultValue };
    case ADMIN_FIELDS.date.type:
      return {
        ...dataFieldBase({ field, name, context }),
        min: field.min?.[0],
        max: field.max?.[0],
        time: {
          hidden: field.time.hidden,
          use12HourFormat: field.time.use12HourFormat,
          timePicker: field.time.timePicker,
        },
      };
    case ADMIN_FIELDS.select.type:
      return {
        ...dataFieldBase({ field, name, context }),
        hasMany: field.hasMany,
        optionCount: field.options.length,
        display: field.admin.display,
        searchable: field.admin.searchable,
      };
    case ADMIN_FIELDS.relationship.type:
      return {
        ...dataFieldBase({ field, name, context }),
        hasMany: field.hasMany,
        min: field.min?.[0],
        max: field.max?.[0],
        target: context.collectionNames.get(field.collection.slug),
      };
    case ADMIN_FIELDS.upload.type:
      return {
        ...dataFieldBase({ field, name, context }),
        hasMany: field.hasMany,
        min: field.min?.[0],
        max: field.max?.[0],
        hasAccept: field.accept.length > 0,
        target: context.mediaNames.get(field.to),
      };
    case ADMIN_FIELDS.richtext.type:
      return { ...dataFieldBase({ field, name, context }), hasMediaTarget: field.mediaCollectionSlug !== undefined };
    case ADMIN_FIELDS.json.type:
      return dataFieldBase({ field, name, context });
    case ADMIN_FIELDS.array.type:
      return {
        ...dataFieldBase({ field, name, context }),
        min: field.min?.[0],
        max: field.max?.[0],
        items: anonymizeField({ field: field.items, context }),
      };
    case ADMIN_FIELDS.group.type:
      return {
        ...dataFieldBase({ field, name, context }),
        defaultCollapsed: field.admin.defaultCollapsed,
        fields: Object.values(field.fields).map((child) => anonymizeField({ field: child, context })),
      };
    case ADMIN_FIELDS.blocks.type:
      return {
        ...dataFieldBase({ field, name, context }),
        defaultCollapsed: field.admin.defaultCollapsed,
        min: field.min?.[0],
        max: field.max?.[0],
        blocks: field.blocks.map((block) => anonymizeBlock({ block, context })),
      };
    case ADMIN_FIELDS.tabs.type:
      return {
        ...uiFieldBase({ field, name, context }),
        tabCount: field.tabs.length,
        tabs: field.tabs.map((tab) => {
          if (typeof tab.admin?.condition === "function") {
            context.flags.conditions = true;
          }
          const tabFields = Object.values(tab.fields).map((child) => anonymizeField({ field: child, context }));
          return { fieldCount: tabFields.length, fields: tabFields };
        }),
      };
    case ADMIN_FIELDS.row.type:
      return {
        ...uiFieldBase({ field, name, context }),
        fields: Object.values(field.fields).map((child) => anonymizeField({ field: child, context })),
      };
    case ADMIN_FIELDS.collapsible.type:
      return {
        ...uiFieldBase({ field, name, context }),
        defaultCollapsed: field.admin.defaultCollapsed,
        fields: Object.values(field.fields).map((child) => anonymizeField({ field: child, context })),
      };
    case ADMIN_FIELDS.ui.type:
      return { ...uiFieldBase({ field, name, context }), hasCustomCell: typeof field.admin.components.Cell === "function" };
    case ADMIN_FIELDS.commitTs.type:
      return { ...dataFieldBase({ field, name, context }), on: field.on, format: field.admin.format };
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}

function anonymizeBlock(props: { block: BlockConfig; context: AnonymizeContext }): AnonymizedBlock {
  const { block, context } = props;
  const name = nextName({ context, kind: "block" });
  const fields = Object.values(block.fields).map((field) => anonymizeField({ field, context }));
  return { name, fieldCount: fields.length, defaultCollapsed: block.admin?.defaultCollapsed, fields };
}

function anonymizeResourceFields(props: { fields: Record<string, AdminField>; context: AnonymizeContext }): AnonymizedField[] {
  return Object.entries(props.fields)
    .filter(([key, field]) => !isInjectedUpdatedAt({ key, field }))
    .map(([, field]) => anonymizeField({ field, context: props.context }));
}

function hasTimestamps(fields: Record<string, AdminField>): boolean {
  return Object.entries(fields).some(([key, field]) => isInjectedUpdatedAt({ key, field }));
}

function resourceFieldCount(fields: Record<string, AdminField>): number {
  return Object.entries(fields).filter(([key, field]) => !isInjectedUpdatedAt({ key, field })).length;
}

function anonymizeCollectionLike(props: {
  resource: CollectionConfig;
  name: string;
  context: AnonymizeContext;
}): AnonymizedResource {
  const { resource, name, context } = props;
  return {
    name,
    fieldCount: resourceFieldCount(resource.fields),
    fields: anonymizeResourceFields({ fields: resource.fields, context }),
    hasDrafts: resource.versions.drafts,
    hasLivePreview: resource.admin.livePreview !== undefined,
    indexCount: resource.indexes?.length ?? 0,
    timestamps: hasTimestamps(resource.fields),
    savedViewCount: resource.admin.views?.length ?? 0,
    defaultSortIsCustom: resource.admin.view.state.sort.field !== "_creationTime",
    bulkDelete: resource.admin.view.state.bulkActions.delete,
    hookCounts: buildHookCounts(resource.hooks),
  };
}

function anonymizeGlobal(props: { global: GlobalConfig; name: string; context: AnonymizeContext }): AnonymizedResource {
  const { global, name, context } = props;
  return {
    name,
    fieldCount: resourceFieldCount(global.fields),
    fields: anonymizeResourceFields({ fields: global.fields, context }),
    hasDrafts: global.versions.drafts,
    hasLivePreview: global.admin.livePreview !== undefined,
    timestamps: hasTimestamps(global.fields),
    hookCounts: buildHookCounts(global.hooks),
  };
}

function anonymizeMediaCollection(props: {
  media: MediaCollectionConfig;
  name: string;
  context: AnonymizeContext;
  storageAdapterKind?: StorageAdapterProtocol;
}): AnonymizedMediaCollection {
  return {
    ...anonymizeCollectionLike({ resource: props.media, name: props.name, context: props.context }),
    storageAdapterKind: props.storageAdapterKind,
  };
}

/**
 * Reduces a resolved `VexConfig` to the privacy-reviewed shape sent as
 * `TelemetryEvent.config` — numbered collection/global/media/block/field
 * names, allowlisted booleans/numbers/enums, and top-level feature flags.
 * No collection, field, block, or role name ever appears in the result.
 *
 * @param props.config - The project's fully-resolved `VexConfig`.
 * @returns The anonymized payload.
 */
export function anonymizeConfig(props: { config: VexConfig }): AnonymizedConfig {
  const { config } = props;
  const collectionNames = buildSlugNameMap({
    slugs: config.collections.map((collection) => collection.slug),
    prefix: "collection",
  });
  const mediaNames = buildSlugNameMap({
    slugs: config.mediaCollections.map((media) => media.slug),
    prefix: "media",
  });
  const context: AnonymizeContext = {
    collectionNames,
    mediaNames,
    counters: { block: 0, field: 0 },
    flags: { conditions: false, slots: false, inputMasks: false },
  };

  const collections = config.collections.map((collection) =>
    anonymizeCollectionLike({ resource: collection, name: collectionNames.get(collection.slug) as string, context }),
  );
  const globals = config.globals.map((global, index) =>
    anonymizeGlobal({ global, name: `global${index + 1}`, context }),
  );
  const mediaCollections = config.mediaCollections.map((media) => {
    const adapter = config.storage.adapters.find((candidate) => candidate.name === media.meta.storageAdapter);
    return anonymizeMediaCollection({
      media,
      name: mediaNames.get(media.slug) as string,
      context,
      storageAdapterKind: adapter?.type,
    });
  });

  return {
    collectionCount: config.collections.length,
    globalCount: config.globals.length,
    mediaCollectionCount: config.mediaCollections.length,
    blockCount: context.counters.block,
    fieldCount: context.counters.field,
    collections,
    globals,
    mediaCollections,
    features: {
      drafts: collections.some((collection) => collection.hasDrafts) || globals.some((global) => global.hasDrafts),
      livePreview:
        config.admin.livePreview.allowedOrigins.length > 0 ||
        Object.keys(config.admin.livePreview.collections).length > 0 ||
        Object.keys(config.admin.livePreview.globals).length > 0 ||
        collections.some((collection) => collection.hasLivePreview) ||
        globals.some((global) => global.hasLivePreview),
      conditions: context.flags.conditions,
      slots: context.flags.slots || hasRootSlotOverrides(config.admin),
      inputMasks: context.flags.inputMasks || Object.keys(config.fields.inputMasks).length > 0,
      localization: false,
      auth: config.auth !== undefined,
      authAdapter: anonymizeAuthAdapter(config.auth),
      access: anonymizeAccess(config.access),
      hookCount: [...collections, ...globals, ...mediaCollections].reduce(
        (sum, resource) => sum + Object.values(resource.hookCounts).reduce((a, b) => a + b, 0),
        0,
      ),
    },
    storageAdapterKinds: [...new Set(config.storage.adapters.map((adapter) => adapter.type))],
  };
}
```

#### packages/telemetry/src/anonymizeConfig.test.ts

Three groups: an exact-shape test on a minimal config, a dedicated test proving a field's framework-injected `meta` (an unlisted key) never survives, and the leak test — a realistic config built entirely from `@vexcms/core`'s real builders, with secrets in every string-bearing position, asserting every string in the output is either a generated name or an allowlisted literal and that `JSON.stringify` of the output contains none of the secrets.

```ts
import { describe, expect, it } from "vitest";
import {
  ADMIN_FIELDS,
  afterChangeHook,
  array,
  beforeChangeHook,
  blocks,
  checkbox,
  collapsible,
  color,
  commitTs,
  date,
  defineBlock,
  defineCollection,
  defineConfig,
  defineGlobal,
  defineServerConfig,
  email,
  globalBeforeChangeHook,
  group,
  json,
  number,
  relationship,
  richtext,
  row,
  select,
  tabs,
  text,
  textarea,
  ui,
  upload,
  url,
  type MediaCollectionConfig,
  type VexAuthAdapter,
  type VexConfig,
  type VexStorageAdapter,
} from "@vexcms/core";
import { anonymizeConfig } from "./anonymizeConfig";
import type { AnonymizedConfig } from "./types";

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, acc));
  } else if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStrings(item, acc));
  }
  return acc;
}

const GENERATED_NAME_PATTERN = /^(collection|global|media|block|field)\d+$/;
const ALLOWED_FIELD_TYPES = new Set(Object.values(ADMIN_FIELDS).map((entry) => entry.type as string));
const ALLOWED_ENUM_VALUES = new Set([
  "dropdown",
  "radio",
  "hex",
  "rgb",
  "hsl",
  "oklch",
  "main",
  "sidebar",
  "left",
  "right",
  "center",
  "presigned-url",
  "save",
  "publish",
  "all",
  "relative",
  "datetime",
  "none",
  "betterAuth",
  "custom",
]);

describe("anonymizeConfig — exact shape", () => {
  it("matches the full expected payload for a minimal config", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        title: text({ required: true, min: 3, max: 100 }),
        featured: checkbox({ defaultValue: true }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const expected: AnonymizedConfig = {
      collectionCount: 1,
      globalCount: 0,
      mediaCollectionCount: 0,
      blockCount: 0,
      fieldCount: 2,
      collections: [
        {
          name: "collection1",
          fieldCount: 2,
          hasDrafts: false,
          hasLivePreview: false,
          indexCount: 0,
          timestamps: false,
          savedViewCount: 0,
          defaultSortIsCustom: false,
          bulkDelete: true,
          hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 0, afterDelete: 0 },
          fields: [
            {
              name: "field1",
              type: "text",
              required: true,
              hidden: false,
              readOnly: false,
              position: "main",
              cellAlignment: "left",
              hasValidate: false,
              hasIndex: false,
              hasMask: false,
              min: 3,
              max: 100,
              hasSearchIndex: false,
              enableSorting: false,
              enableHiding: true,
            },
            {
              name: "field2",
              type: "checkbox",
              required: false,
              hidden: false,
              readOnly: false,
              position: "main",
              cellAlignment: "left",
              hasValidate: false,
              hasIndex: false,
              enableSorting: false,
              enableHiding: true,
              defaultValue: true,
            },
          ],
        },
      ],
      globals: [],
      mediaCollections: [],
      features: {
        drafts: false,
        livePreview: false,
        conditions: false,
        slots: false,
        inputMasks: false,
        localization: false,
        auth: false,
        authAdapter: "none",
        access: {
          enabled: false,
          roleCount: 0,
          ruleCount: 0,
          fieldPermissionRuleCount: 0,
          queryConstraintRuleCount: 0,
          callbackRuleCount: 0,
          customActionCount: 0,
          customResourceCount: 0,
          organizations: false,
        },
        hookCount: 0,
      },
      storageAdapterKinds: [],
    };

    expect(anonymizeConfig({ config })).toEqual(expected);
  });
});

describe("anonymizeConfig — unknown keys", () => {
  it("never includes a field's framework-injected meta", () => {
    const collection = defineCollection({
      slug: "unknownKeyCollection",
      timestamps: false,
      fields: { headline: text({ required: true }) },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    expect(Object.keys(output.collections[0]!.fields[0]!)).not.toContain("meta");
    expect(JSON.stringify(output)).not.toContain("unknownKeyCollection");
  });
});

describe("anonymizeConfig — injected updatedAt", () => {
  it("a collection without timestamps: false gets timestamps: true, no updatedAt-derived field, and an unchanged fieldCount", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true, min: 3, max: 100 }),
        featured: checkbox({ defaultValue: true }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    expect(output.collections[0]!.timestamps).toBe(true);
    expect(output.collections[0]!.fieldCount).toBe(2);
    expect(output.collections[0]!.fields).toHaveLength(2);
    expect(output.fieldCount).toBe(2);
    expect(output.collections[0]!.fields.some((field) => field.type === "commitTs")).toBe(false);
  });

  it("a user-declared commitTs field survives with its own on/format, not mistaken for the injected updatedAt", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        title: text({ required: true }),
        publishedCommitTs: commitTs({ on: "publish", admin: { format: "relative" } }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });
    const commitTsField = output.collections[0]!.fields.find((field) => field.type === "commitTs")!;

    expect(commitTsField).toBeDefined();
    expect(commitTsField.on).toBe("publish");
    expect(commitTsField.format).toBe("relative");
    expect(output.collections[0]!.fieldCount).toBe(2);
  });
});

describe("anonymizeConfig — lifecycle hooks", () => {
  it("counts declared hooks per resource and sums them into features.hookCount", () => {
    const collection = defineCollection({
      slug: "hookedPosts",
      timestamps: false,
      fields: { title: text({ required: true }) },
      hooks: {
        beforeChange: beforeChangeHook("hookedPosts", async ({ doc }) => doc),
        afterChange: afterChangeHook("hookedPosts", () => {}),
      },
    });
    const global = defineGlobal({
      slug: "hookedSettings",
      label: "Hooked Settings",
      fields: { tagline: text() },
      hooks: {
        beforeChange: globalBeforeChangeHook("hookedSettings", async ({ doc }) => doc),
      },
    });
    const config = defineServerConfig({
      config: defineConfig({ collections: [collection], globals: [global] }),
    });

    const output = anonymizeConfig({ config });

    expect(output.collections[0]!.hookCounts).toEqual({
      beforeChange: 1,
      beforeDelete: 0,
      afterChange: 1,
      afterDelete: 0,
    });
    expect(output.globals[0]!.hookCounts).toEqual({
      beforeChange: 1,
      beforeDelete: 0,
      afterChange: 0,
      afterDelete: 0,
    });
    expect(output.features.hookCount).toBe(3);
  });
});

describe("anonymizeConfig — access detail", () => {
  it("classifies every rule and counts custom actions/resources exactly", () => {
    const collection = defineCollection({
      slug: "docs",
      timestamps: false,
      fields: { title: text({ required: true }) },
    });
    const config: VexConfig = {
      ...defineServerConfig({ config: defineConfig({ collections: [collection] }) }),
      access: {
        enabled: true,
        roles: ["admin", "editor"],
        resources: [collection],
        customActions: { docs: { query: ["search"], mutation: ["archive", "restore"] } },
        defaultPermissionMode: "deny",
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: undefined,
        organizations: false,
        permissions: {
          admin: {
            docs: {
              read: true,
              create: () => true,
              update: { where: { field: "title", op: "neq", value: "" } },
              delete: { title: true, body: false },
            },
            apiKeys: { create: true },
          },
        },
      } as unknown as VexConfig["access"],
    };

    const output = anonymizeConfig({ config });

    expect(output.features.access).toEqual({
      enabled: true,
      roleCount: 2,
      ruleCount: 5,
      fieldPermissionRuleCount: 1,
      queryConstraintRuleCount: 1,
      callbackRuleCount: 1,
      customActionCount: 3,
      customResourceCount: 1,
      organizations: false,
    });
  });
});

describe("anonymizeConfig — leak test", () => {
  const CLIENTS_SLUG = "secretProjectClients";
  const POSTS_SLUG = "secretProjectPosts";
  const SETTINGS_SLUG = "secretCompanySettings";
  const ASSETS_SLUG = "secretCompanyAssets";

  const SECRETS = [
    CLIENTS_SLUG,
    POSTS_SLUG,
    SETTINGS_SLUG,
    ASSETS_SLUG,
    "secretSavedViewName",
    "secret-view-where-value",
    "Codename Phoenix",
    "classifiedTierAlpha",
    "Internal only — do not share externally",
    "https://secret-internal.example.com/launch-codes",
    "secretLaunchBlock",
    "Secret Launch Block",
    "secretBoardMember",
    "secretStorageAdapterXYZ",
    "do-not-leak-this-mask-999",
    "secret-mask",
    "Meta title secret",
    "SEO Codename Phoenix",
    "Launch heading",
    "Confidential Advanced Settings",
    "Internal tag",
    "Alt text (secret keywords)",
  ];

  const clientsCollection = defineCollection({
    slug: CLIENTS_SLUG,
    fields: { name: text({ required: true, label: "Codename Phoenix" }) },
    admin: {
      views: [
        {
          viewId: "secretView",
          name: "secretSavedViewName",
          state: { where: { field: "name", op: "eq", value: "secret-view-where-value" } },
        },
      ],
    },
  });

  const postsCollection = defineCollection({
    slug: POSTS_SLUG,
    timestamps: false,
    admin: { useAsTitle: "title" },
    fields: {
      title: text({
        required: true,
        label: "Internal only — do not share externally",
        min: 3,
        max: 100,
        searchIndex: { name: "search_title", filterFields: [] },
        admin: { mask: "do-not-leak-this-mask-999", condition: () => true },
      }),
      contactEmail: email({ admin: { mask: "secret-mask" } }),
      bio: textarea({ rows: 6 }),
      website: url({ defaultValue: "https://secret-internal.example.com/launch-codes" }),
      brandColor: color({ format: "oklch", themeColors: true }),
      priority: number({ min: 0, max: 10, step: 1 }),
      featured: checkbox({ defaultValue: true }),
      publishedAt: date({ time: { use12HourFormat: false } }),
      tier: select({
        hasMany: true,
        options: [
          { label: "Codename Phoenix Tier", value: "classifiedTierAlpha" },
          { label: "Public", value: "public" },
        ],
        admin: { display: "radio", searchable: true },
      }),
      client: relationship({ collection: { slug: CLIENTS_SLUG }, hasMany: false }),
      tags: array({ items: text({ label: "Internal tag" }), min: 1, max: 5 }),
      seo: group({
        label: "SEO Codename Phoenix",
        admin: { defaultCollapsed: true },
        fields: { metaTitle: text({ label: "Meta title secret" }) },
      }),
      sections: blocks({
        admin: { defaultCollapsed: true },
        blocks: [
          defineBlock({
            slug: "secretLaunchBlock",
            label: "Secret Launch Block",
            fields: { heading: text({ label: "Launch heading" }) },
          }),
        ],
      }),
      heroImage: upload({ to: ASSETS_SLUG, accept: "image/*" }),
      body: richtext({ mediaCollectionSlug: ASSETS_SLUG }),
      settingsBlob: json(),
      info: tabs({
        tabs: [
          { label: "Content", fields: { summary: textarea() } },
          { label: "SEO", name: "seoTab", fields: { keywords: text() } },
        ],
      }),
      layout: row({ fields: { left: text(), right: text() } }),
      advanced: collapsible({
        label: "Confidential Advanced Settings",
        admin: { defaultCollapsed: true },
        fields: { note: text() },
      }),
      customWidget: ui({ admin: { components: { Field: () => null, Cell: () => null } } }),
    },
  });

  const settingsGlobal = defineGlobal({
    slug: SETTINGS_SLUG,
    label: "Secret Company Settings",
    fields: { tagline: text({ label: "Secret tagline" }) },
  });

  const assetsMediaCollection = {
    ...defineCollection({
      slug: ASSETS_SLUG,
      timestamps: false,
      fields: {
        alt: text({ required: true, label: "Alt text (secret keywords)" }),
        filename: text({ required: true }),
      },
      meta: { storageAdapter: "secretStorageAdapterXYZ" },
    }),
  } as unknown as MediaCollectionConfig;

  const storageAdapter = {
    name: "secretStorageAdapterXYZ",
    type: "presigned-url",
    mediaCollections: [assetsMediaCollection],
    admin: { softDelete: false },
    generateUploadUrl: async () => ({ url: "" }),
    createMediaDocument: async () => "",
    deleteMedia: async () => true,
    getUrl: async () => ({ url: "" }),
    uploadFile: async () => ({ storageId: "" }),
  } as unknown as VexStorageAdapter;

  const authAdapter = {
    name: "secretAuthAdapterName",
    collections: [],
    userCollection: CLIENTS_SLUG,
  } as unknown as VexAuthAdapter;

  const config: VexConfig = {
    ...defineServerConfig({
      config: defineConfig({
        collections: [clientsCollection, postsCollection],
        globals: [settingsGlobal],
        mediaCollections: [assetsMediaCollection],
      }),
      server: { auth: { adapter: authAdapter }, storage: { adapters: [storageAdapter] } },
    }),
    access: {
      enabled: true,
      roles: ["admin", "secretBoardMember"],
      resources: [],
      customActions: undefined,
      defaultPermissionMode: "deny",
      userCollectionSlug: CLIENTS_SLUG,
      userRolesField: "roles",
      orgCollectionSlug: undefined,
      permissions: {},
    } as unknown as VexConfig["access"],
  };

  it("maps relationship and upload targets to the generated names", () => {
    const output = anonymizeConfig({ config });
    const posts = output.collections[1]!;
    const relationshipField = posts.fields.find((field) => field.type === "relationship")!;
    const uploadField = posts.fields.find((field) => field.type === "upload")!;

    expect(relationshipField.target).toBe("collection1");
    expect(uploadField.target).toBe("media1");
  });

  it("never includes a collection, field, block, or role name — every string is a generated name or an allowlisted literal", () => {
    const output = anonymizeConfig({ config });
    const serialized = JSON.stringify(output);

    for (const secret of SECRETS) {
      expect(serialized).not.toContain(secret);
    }

    const strings = collectStrings(output);
    for (const value of strings) {
      const allowed =
        GENERATED_NAME_PATTERN.test(value) || ALLOWED_FIELD_TYPES.has(value) || ALLOWED_ENUM_VALUES.has(value);
      expect(allowed).toBe(true);
    }
  });
});
```

#### packages/telemetry/src/config.ts

New file — the entire `@vexcms/telemetry/config` subpath entry (see Step 1's `package.json` `exports` map and `tsup.config.ts` `entry` list). `anonymizeConfig` is reached only through this subpath; the root barrel (`src/index.ts`) never exports it, since it's the one function in the package that needs a runtime `@vexcms/core` import and callers that don't anonymize a config shouldn't pay for it.

```ts
export { anonymizeConfig } from "./anonymizeConfig";
```

Verify: `pnpm --filter @vexcms/telemetry test anonymizeConfig`

### Step 5 — Sender and first-run notice [agent]
Why: T2, T7, T8. Telemetry never delays or fails a command.

- [ ] `packages/telemetry/src/collectEnvironment.ts`
- [ ] `packages/telemetry/src/collectEnvironment.test.ts`
- [ ] `packages/telemetry/src/sendTelemetryEvent.ts`
- [ ] `packages/telemetry/src/sendTelemetryEvent.test.ts`
- [ ] `packages/telemetry/src/showTelemetryNotice.ts`
- [ ] `packages/telemetry/src/showTelemetryNotice.test.ts`
- [ ] `packages/telemetry/src/recordTelemetryEvent.ts`
- [ ] `packages/telemetry/src/recordTelemetryEvent.test.ts`
- [ ] `packages/telemetry/src/classifyTelemetryError.ts`
- [ ] `packages/telemetry/src/classifyTelemetryError.test.ts`
- [ ] `packages/telemetry/src/fitTelemetryEvent.ts`
- [ ] `packages/telemetry/src/fitTelemetryEvent.test.ts`
- [ ] `packages/telemetry/src/index.ts`

#### packages/telemetry/src/collectEnvironment.ts

Reads the project's `package.json` for `@vexcms/*` / `create-vexcms` version strings, detects the package manager from a lockfile in `projectDir` (falling back to `npm_config_user_agent`), and detects the framework from the same dependency fields.

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { TelemetryEnvironment } from "./types";

const LOCKFILE_PACKAGE_MANAGERS = {
  "pnpm-lock.yaml": "pnpm",
  "package-lock.json": "npm",
  "yarn.lock": "yarn",
  "bun.lockb": "bun",
} as const;

function readProjectPackageJson(projectDir: string): Record<string, unknown> {
  const path = join(projectDir, "package.json");
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function collectVexVersions(packageJson: Record<string, unknown>): Record<string, string> {
  const versions: Record<string, string> = {};
  const dependencyFields = ["dependencies", "devDependencies"] as const;
  for (const field of dependencyFields) {
    const deps = packageJson[field];
    if (typeof deps !== "object" || deps === null) {
      continue;
    }
    for (const [name, version] of Object.entries(deps as Record<string, string>)) {
      if (name.startsWith("@vexcms/") || name === "create-vexcms") {
        versions[name] = version;
      }
    }
  }
  return versions;
}

const FRAMEWORK_DEPENDENCIES = {
  next: "next",
  "@tanstack/react-start": "tanstack",
} as const;

function detectFramework(packageJson: Record<string, unknown>): TelemetryEnvironment["framework"] {
  const dependencyFields = ["dependencies", "devDependencies"] as const;
  const depNames = new Set<string>();
  for (const field of dependencyFields) {
    const deps = packageJson[field];
    if (typeof deps !== "object" || deps === null) {
      continue;
    }
    for (const name of Object.keys(deps as Record<string, string>)) {
      depNames.add(name);
    }
  }
  for (const [dependency, framework] of Object.entries(FRAMEWORK_DEPENDENCIES)) {
    if (depNames.has(dependency)) {
      return framework;
    }
  }
  return "unknown";
}

function detectPackageManager(props: {
  projectDir: string;
  env: NodeJS.ProcessEnv;
}): TelemetryEnvironment["packageManager"] {
  for (const [lockfile, packageManager] of Object.entries(LOCKFILE_PACKAGE_MANAGERS)) {
    if (existsSync(join(props.projectDir, lockfile))) {
      return packageManager;
    }
  }
  const userAgent = props.env.npm_config_user_agent;
  if (userAgent?.startsWith("pnpm/")) {
    return "pnpm";
  }
  if (userAgent?.startsWith("yarn/")) {
    return "yarn";
  }
  if (userAgent?.startsWith("npm/")) {
    return "npm";
  }
  if (userAgent?.startsWith("bun/")) {
    return "bun";
  }
  return "unknown";
}

/**
 * Collects the build/runtime environment facts recorded on every telemetry
 * event: installed `@vexcms/*` versions, the Node runtime, the OS and the
 * package manager in use.
 *
 * @param props.projectDir Absolute path to the project whose `package.json`
 *   is inspected for `@vexcms/*` / `create-vexcms` dependency versions.
 * @returns The populated {@link TelemetryEnvironment}.
 */
export function collectEnvironment(props: { projectDir: string }): TelemetryEnvironment {
  const packageJson = readProjectPackageJson(props.projectDir);
  return {
    vexVersions: collectVexVersions(packageJson),
    nodeVersion: process.version,
    os: process.platform,
    arch: process.arch,
    packageManager: detectPackageManager({ projectDir: props.projectDir, env: process.env }),
    framework: detectFramework(packageJson),
  };
}
```

#### packages/telemetry/src/collectEnvironment.test.ts

```ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectEnvironment } from "./collectEnvironment";

describe("collectEnvironment", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "vex-telemetry-env-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("collects @vexcms/* and create-vexcms versions from dependencies and devDependencies", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        dependencies: { "@vexcms/core": "0.1.0-alpha.27", react: "19.0.0" },
        devDependencies: { "create-vexcms": "0.1.0-alpha.12", typescript: "5.6.0" },
      }),
    );

    const environment = collectEnvironment({ projectDir });

    expect(environment.vexVersions).toEqual({
      "@vexcms/core": "0.1.0-alpha.27",
      "create-vexcms": "0.1.0-alpha.12",
    });
    expect(environment.nodeVersion).toBe(process.version);
    expect(environment.os).toBe(process.platform);
    expect(environment.arch).toBe(process.arch);
  });

  it("detects pnpm from a pnpm-lock.yaml", () => {
    writeFileSync(join(projectDir, "package.json"), JSON.stringify({}));
    writeFileSync(join(projectDir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

    expect(collectEnvironment({ projectDir }).packageManager).toBe("pnpm");
  });

  it("falls back to unknown with no lockfile and no npm_config_user_agent", () => {
    writeFileSync(join(projectDir, "package.json"), JSON.stringify({}));
    const previousUserAgent = process.env.npm_config_user_agent;
    delete process.env.npm_config_user_agent;

    try {
      expect(collectEnvironment({ projectDir }).packageManager).toBe("unknown");
    } finally {
      if (previousUserAgent !== undefined) {
        process.env.npm_config_user_agent = previousUserAgent;
      }
    }
  });

  it("returns empty vexVersions and no throw for a missing package.json", () => {
    const environment = collectEnvironment({ projectDir });
    expect(environment.vexVersions).toEqual({});
  });

  it("detects the framework from a next dependency", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ dependencies: { next: "15.0.0" } }),
    );

    expect(collectEnvironment({ projectDir }).framework).toBe("next");
  });

  it("detects the framework from a @tanstack/react-start dependency", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ dependencies: { "@tanstack/react-start": "1.0.0" } }),
    );

    expect(collectEnvironment({ projectDir }).framework).toBe("tanstack");
  });

  it("falls back to unknown framework with neither dependency present", () => {
    writeFileSync(join(projectDir, "package.json"), JSON.stringify({ dependencies: { react: "19.0.0" } }));

    expect(collectEnvironment({ projectDir }).framework).toBe("unknown");
  });
});
```

#### packages/telemetry/src/sendTelemetryEvent.ts

Fire-and-forget POST, bounded by `AbortSignal.timeout`. Every failure (network error, timeout, non-2xx) is swallowed — a command's exit code and timing must never depend on the network. `fitTelemetryEvent` runs first so oversize events are shrunk or dropped before either the debug or send path; `VEX_TELEMETRY_DEBUG` then short-circuits to a stderr dump with no request.

```ts
import { DEFAULT_TELEMETRY_ENDPOINT, TELEMETRY_ENV, TELEMETRY_TIMEOUT_MS } from "./constants";
import { fitTelemetryEvent } from "./fitTelemetryEvent";
import type { TelemetryEnv, TelemetryEvent } from "./types";

function isDebugEnabled(env: TelemetryEnv): boolean {
  const value = env[TELEMETRY_ENV.debug];
  return value !== undefined && value !== "0" && value !== "false" && value !== "";
}

/**
 * Sends one telemetry event over HTTP, never throwing and never delaying the
 * caller beyond {@link TELEMETRY_TIMEOUT_MS}. In debug mode the event is
 * printed to stderr instead of being sent. Oversize events are shrunk or
 * dropped by {@link fitTelemetryEvent} before either path runs, so debug
 * mode always shows exactly what would be sent.
 *
 * @param props.event The event to send.
 * @param props.env Environment used to resolve `VEX_TELEMETRY_ENDPOINT` and
 *   `VEX_TELEMETRY_DEBUG`.
 */
export async function sendTelemetryEvent(props: { event: TelemetryEvent; env: TelemetryEnv }): Promise<void> {
  const fittedEvent = fitTelemetryEvent({ event: props.event });
  if (!fittedEvent) {
    return;
  }

  if (isDebugEnabled(props.env)) {
    process.stderr.write(`[vex telemetry] ${JSON.stringify(fittedEvent, null, 2)}\n`);
    return;
  }

  const endpoint = props.env[TELEMETRY_ENV.endpoint] ?? DEFAULT_TELEMETRY_ENDPOINT;
  const body = JSON.stringify(fittedEvent);

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(TELEMETRY_TIMEOUT_MS),
    });
  } catch {
    return;
  }
}
```

#### packages/telemetry/src/sendTelemetryEvent.test.ts

Uses a real `node:http` server for the happy path, and a server that accepts the TCP connection but never responds for the timeout path, asserting resolution within 1.6s.

```ts
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TELEMETRY_SCHEMA_VERSION } from "./constants";
import { sendTelemetryEvent } from "./sendTelemetryEvent";
import type { TelemetryEnv, TelemetryEvent } from "./types";

function buildEvent(): TelemetryEvent {
  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    event: "dev",
    machineId: "machine-1",
    projectId: "project-1",
    sentAt: new Date().toISOString(),
    environment: {
      vexVersions: {},
      nodeVersion: process.version,
      os: process.platform,
      arch: process.arch,
      packageManager: "pnpm",
    },
  };
}

describe("sendTelemetryEvent", () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = undefined;
    }
  });

  it("POSTs the event body to the configured endpoint", async () => {
    const received: { body: string } = { body: "" };
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received.body = Buffer.concat(chunks).toString("utf8");
        res.writeHead(204);
        res.end();
      });
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = { VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events` };

    const event = buildEvent();
    await sendTelemetryEvent({ event, env });

    expect(JSON.parse(received.body)).toEqual(event);
  });

  it("resolves within 1.6s and never throws against an endpoint that accepts but never responds", async () => {
    server = createServer(() => {
      // Intentionally never calls res.end() — simulates a blackholed endpoint.
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = { VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events` };

    const start = Date.now();
    await expect(sendTelemetryEvent({ event: buildEvent(), env })).resolves.toBeUndefined();
    expect(Date.now() - start).toBeLessThanOrEqual(1600);
  });

  it("prints to stderr and makes no request when VEX_TELEMETRY_DEBUG is set", async () => {
    let requested = false;
    server = createServer((_req, res) => {
      requested = true;
      res.writeHead(204);
      res.end();
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
      VEX_TELEMETRY_DEBUG: "1",
    };
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const event = buildEvent();
    await sendTelemetryEvent({ event, env });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy.mock.calls[0]?.[0]).toContain(JSON.stringify(event, null, 2));
    expect(requested).toBe(false);

    writeSpy.mockRestore();
  });
});
```

#### packages/telemetry/src/showTelemetryNotice.ts

Printed once per machine, stamping `noticeShownAt` so every later call is silent.

```ts
import { TELEMETRY_DOCS_URL, TELEMETRY_ENV } from "./constants";
import { writeTelemetrySettings } from "./settings";
import type { TelemetryEnv, TelemetrySettings } from "./types";

function buildNoticeText(): string {
  return [
    "vex collects anonymous build-time telemetry: config shape (field types and",
    "enabled features, never collection/field/block names), environment (OS, Node,",
    "package manager, @vexcms/* versions) and a random per-machine, per-project id.",
    "No personal data, file contents, or project names are ever sent.",
    `Docs: ${TELEMETRY_DOCS_URL}`,
    `Disable with "vex telemetry disable" or by setting ${TELEMETRY_ENV.doNotTrack}=1.`,
  ].join("\n");
}

/**
 * Prints the first-run telemetry notice exactly once per machine and
 * persists the stamp that suppresses it afterward.
 *
 * @param props.env Environment used to resolve the settings file path.
 * @param props.settings The settings loaded for this run.
 * @returns The settings, stamped with `noticeShownAt` when the notice was
 *   just shown; unchanged otherwise.
 */
export function showTelemetryNotice(props: { env: TelemetryEnv; settings: TelemetrySettings }): TelemetrySettings {
  if (props.settings.noticeShownAt) {
    return props.settings;
  }

  process.stderr.write(`${buildNoticeText()}\n`);

  const stamped: TelemetrySettings = { ...props.settings, noticeShownAt: new Date().toISOString() };
  writeTelemetrySettings({ env: props.env, settings: stamped });
  return stamped;
}
```

#### packages/telemetry/src/showTelemetryNotice.test.ts

```ts
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TELEMETRY_DOCS_URL } from "./constants";
import { showTelemetryNotice } from "./showTelemetryNotice";
import type { TelemetryEnv, TelemetrySettings } from "./types";

describe("showTelemetryNotice", () => {
  let configHome: string;
  let env: TelemetryEnv;
  let settings: TelemetrySettings;

  beforeEach(() => {
    configHome = mkdtempSync(join(tmpdir(), "vex-telemetry-notice-"));
    env = { XDG_CONFIG_HOME: configHome };
    settings = { machineId: randomUUID(), salt: randomBytes(32).toString("hex") };
  });

  afterEach(() => {
    rmSync(configHome, { recursive: true, force: true });
  });

  it("prints the complete notice text once and stamps noticeShownAt", () => {
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const stamped = showTelemetryNotice({ env, settings });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const printed = writeSpy.mock.calls[0]?.[0] as string;
    expect(printed).toContain("anonymous build-time telemetry");
    expect(printed).toContain(TELEMETRY_DOCS_URL);
    expect(printed).toContain("vex telemetry disable");
    expect(printed).toContain("DO_NOT_TRACK");
    expect(stamped.noticeShownAt).toBeDefined();

    writeSpy.mockRestore();
  });

  it("is silent on a second call once noticeShownAt is set", () => {
    const first = showTelemetryNotice({ env, settings });
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const second = showTelemetryNotice({ env, settings: first });

    expect(writeSpy).not.toHaveBeenCalled();
    expect(second).toEqual(first);

    writeSpy.mockRestore();
  });
});
```

#### packages/telemetry/src/recordTelemetryEvent.ts

The single entry point used by the CLI and `create-vexcms`: checks enablement, shows the notice, builds the event and sends it. Never rejects.

```ts
import { collectEnvironment } from "./collectEnvironment";
import { createProjectId } from "./projectId";
import { readTelemetrySettings } from "./settings";
import { sendTelemetryEvent } from "./sendTelemetryEvent";
import { showTelemetryNotice } from "./showTelemetryNotice";
import { isTelemetryEnabled } from "./isTelemetryEnabled";
import { TELEMETRY_SCHEMA_VERSION } from "./constants";
import type {
  AnonymizedConfig,
  TelemetryCreateOptions,
  TelemetryEnv,
  TelemetryEvent,
  TelemetryEventName,
  TelemetryOutcome,
  TelemetrySettings,
  TelemetryTimings,
} from "./types";

/**
 * Assembles the full telemetry payload for one event, deterministic given
 * its inputs so the CLI can also use it for `vex telemetry status --json`.
 *
 * @param props.event The event name.
 * @param props.projectDir Absolute path to the project directory.
 * @param props.settings The machine's telemetry settings.
 * @param props.outcome Whether the run succeeded, or failed with a stage and error code.
 * @param props.config Optional already-anonymized project config.
 * @param props.timings Optional build/dev timing data.
 * @param props.create Optional `create-vexcms` scaffold options.
 * @returns The complete {@link TelemetryEvent}.
 */
export function buildTelemetryEvent(props: {
  event: TelemetryEventName;
  projectDir: string;
  settings: TelemetrySettings;
  outcome: TelemetryOutcome;
  config?: AnonymizedConfig;
  timings?: TelemetryTimings;
  create?: TelemetryCreateOptions;
}): TelemetryEvent {
  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    event: props.event,
    machineId: props.settings.machineId,
    projectId: createProjectId({ salt: props.settings.salt, projectDir: props.projectDir }),
    sentAt: new Date().toISOString(),
    environment: collectEnvironment({ projectDir: props.projectDir }),
    outcome: props.outcome,
    ...(props.config ? { config: props.config } : {}),
    ...(props.timings ? { timings: props.timings } : {}),
    ...(props.create ? { create: props.create } : {}),
  };
}

/**
 * Records one telemetry event: resolves enablement, shows the first-run
 * notice when needed, builds the payload and sends it. Never rejects and
 * never throws — a telemetry failure never affects the calling command.
 *
 * @param props.event The event name.
 * @param props.projectDir Absolute path to the project directory.
 * @param props.outcome Whether the run succeeded, or failed with a stage and error code.
 * @param props.env Environment to resolve settings/enablement against;
 *   defaults to `process.env`.
 * @param props.config Optional already-anonymized project config.
 * @param props.timings Optional build/dev timing data.
 * @param props.create Optional `create-vexcms` scaffold options.
 */
export async function recordTelemetryEvent(props: {
  event: TelemetryEventName;
  projectDir: string;
  outcome: TelemetryOutcome;
  env?: TelemetryEnv;
  config?: AnonymizedConfig;
  timings?: TelemetryTimings;
  create?: TelemetryCreateOptions;
}): Promise<void> {
  const env = props.env ?? process.env;
  const settings = readTelemetrySettings({ env });
  const { enabled } = isTelemetryEnabled({ env, settings });
  if (!enabled) {
    return;
  }

  const noticedSettings = showTelemetryNotice({ env, settings });
  const event = buildTelemetryEvent({
    event: props.event,
    projectDir: props.projectDir,
    settings: noticedSettings,
    outcome: props.outcome,
    config: props.config,
    timings: props.timings,
    create: props.create,
  });
  await sendTelemetryEvent({ event, env });
}
```

#### packages/telemetry/src/recordTelemetryEvent.test.ts

```ts
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TELEMETRY_SCHEMA_VERSION } from "./constants";
import { recordTelemetryEvent } from "./recordTelemetryEvent";
import type { TelemetryEnv } from "./types";

describe("recordTelemetryEvent", () => {
  let configHome: string;
  let projectDir: string;

  beforeEach(() => {
    configHome = mkdtempSync(join(tmpdir(), "vex-telemetry-config-"));
    projectDir = mkdtempSync(join(tmpdir(), "vex-telemetry-project-"));
  });

  afterEach(() => {
    rmSync(configHome, { recursive: true, force: true });
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("makes no request when DO_NOT_TRACK is set", async () => {
    let requested = false;
    const server = createServer((_req, res) => {
      requested = true;
      res.writeHead(204);
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      DO_NOT_TRACK: "1",
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" } });

    expect(requested).toBe(false);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("sends an event with schemaVersion 1 and no project path string when enabled", async () => {
    const received: { body: string } = { body: "" };
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received.body = Buffer.concat(chunks).toString("utf8");
        res.writeHead(204);
        res.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" } });

    expect(received.body).not.toContain(projectDir);
    const event = JSON.parse(received.body);
    expect(event.schemaVersion).toBe(TELEMETRY_SCHEMA_VERSION);
    expect(event.event).toBe("dev");
    expect(typeof event.projectId).toBe("string");

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
```

#### packages/telemetry/src/classifyTelemetryError.ts

Classifies a caught error into a fixed {@link TelemetryErrorCode} by its `name` only — never its message, which may carry project-specific details. Checks `error.name` against an allowlist of core's config-error class names so no runtime `@vexcms/core` import is needed (those classes already set `this.name` in their constructors).

```ts
import type { TelemetryErrorCode } from "./types";

const ERROR_CODE_BY_NAME: Record<string, TelemetryErrorCode> = {
  VexConfigError: "configError",
  VexAccessConfigError: "accessConfigError",
  VexAuthConfigError: "authConfigError",
  VexComponentConfigError: "componentConfigError",
  VexStorageConfigError: "storageConfigError",
};

/**
 * Classifies a caught error into a fixed {@link TelemetryErrorCode} for the
 * telemetry payload, by its `name` — never its message, which may carry
 * project-specific details. Unrecognized error names map to `"unknown"`.
 *
 * @param props.error - The error caught at a vex-owned pipeline stage.
 * @returns The matching allowlisted code, or `"unknown"`.
 */
export function classifyTelemetryError(props: { error: unknown }): TelemetryErrorCode {
  const { error } = props;
  if (error instanceof Error && error.name in ERROR_CODE_BY_NAME) {
    return ERROR_CODE_BY_NAME[error.name] as TelemetryErrorCode;
  }
  return "unknown";
}
```

#### packages/telemetry/src/classifyTelemetryError.test.ts

```ts
import { describe, expect, it } from "vitest";
import { classifyTelemetryError } from "./classifyTelemetryError";

function namedError(name: string): Error {
  const error = new Error("boom");
  error.name = name;
  return error;
}

describe("classifyTelemetryError", () => {
  it("maps VexConfigError to configError", () => {
    expect(classifyTelemetryError({ error: namedError("VexConfigError") })).toBe("configError");
  });

  it("maps VexAccessConfigError to accessConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexAccessConfigError") })).toBe("accessConfigError");
  });

  it("maps VexAuthConfigError to authConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexAuthConfigError") })).toBe("authConfigError");
  });

  it("maps VexComponentConfigError to componentConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexComponentConfigError") })).toBe("componentConfigError");
  });

  it("maps VexStorageConfigError to storageConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexStorageConfigError") })).toBe("storageConfigError");
  });

  it("returns unknown for an unrecognized Error name", () => {
    expect(classifyTelemetryError({ error: namedError("SyntaxError") })).toBe("unknown");
  });

  it("returns unknown for a non-Error value", () => {
    expect(classifyTelemetryError({ error: "boom" })).toBe("unknown");
  });
});
```

#### packages/telemetry/src/fitTelemetryEvent.ts

Shrinks a telemetry event's `config` to fit {@link TELEMETRY_MAX_BODY_BYTES}: first tries the event unchanged, then with `config`'s per-resource arrays dropped (every count and `features` field kept, `truncated: true` set), then gives up and returns `undefined` if it's still oversize.

```ts
import { TELEMETRY_MAX_BODY_BYTES } from "./constants";
import type { TelemetryEvent } from "./types";

/**
 * Shrinks a telemetry event's `config` to fit {@link TELEMETRY_MAX_BODY_BYTES}:
 * first tries the event unchanged, then with `config`'s per-resource arrays
 * dropped (every count and `features` field kept, `truncated: true` set),
 * then gives up and returns `undefined` if it's still oversize.
 *
 * @param props.event The event to fit.
 * @returns The event (possibly with a truncated `config`), or `undefined`
 *   when even a truncated `config` doesn't fit the cap.
 */
export function fitTelemetryEvent(props: { event: TelemetryEvent }): TelemetryEvent | undefined {
  const { event } = props;
  if (Buffer.byteLength(JSON.stringify(event), "utf8") <= TELEMETRY_MAX_BODY_BYTES) {
    return event;
  }
  if (!event.config) {
    return undefined;
  }

  const truncatedEvent: TelemetryEvent = {
    ...event,
    config: { ...event.config, collections: [], globals: [], mediaCollections: [], truncated: true },
  };
  if (Buffer.byteLength(JSON.stringify(truncatedEvent), "utf8") <= TELEMETRY_MAX_BODY_BYTES) {
    return truncatedEvent;
  }
  return undefined;
}
```

#### packages/telemetry/src/fitTelemetryEvent.test.ts

Covers the three outcomes: unchanged, truncated-and-fits, and dropped (both when truncation still doesn't fit and when there's no `config` to truncate at all).

```ts
import { describe, expect, it } from "vitest";
import { TELEMETRY_MAX_BODY_BYTES, TELEMETRY_SCHEMA_VERSION } from "./constants";
import { fitTelemetryEvent } from "./fitTelemetryEvent";
import type { AnonymizedConfig, AnonymizedResource, TelemetryEvent } from "./types";

function buildEnvironment(): TelemetryEvent["environment"] {
  return {
    vexVersions: {},
    nodeVersion: process.version,
    os: process.platform,
    arch: process.arch,
    packageManager: "pnpm",
    framework: "unknown",
  };
}

function buildBaseEvent(config: AnonymizedConfig): TelemetryEvent {
  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    event: "dev",
    machineId: "machine-1",
    projectId: "project-1",
    sentAt: new Date().toISOString(),
    environment: buildEnvironment(),
    outcome: { status: "ok" },
    config,
  };
}

function buildSmallConfig(): AnonymizedConfig {
  return {
    collectionCount: 1,
    globalCount: 0,
    mediaCollectionCount: 0,
    blockCount: 0,
    fieldCount: 1,
    collections: [
      {
        name: "collection1",
        fieldCount: 1,
        fields: [{ name: "field1", type: "text", required: true }],
        hasDrafts: false,
        hasLivePreview: false,
        timestamps: false,
        hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 0, afterDelete: 0 },
      },
    ],
    globals: [],
    mediaCollections: [],
    features: {
      drafts: false,
      livePreview: false,
      conditions: false,
      slots: false,
      inputMasks: false,
      localization: false,
      auth: false,
      authAdapter: "none",
      access: {
        enabled: false,
        roleCount: 0,
        ruleCount: 0,
        fieldPermissionRuleCount: 0,
        queryConstraintRuleCount: 0,
        callbackRuleCount: 0,
        customActionCount: 0,
        customResourceCount: 0,
        organizations: false,
      },
      hookCount: 0,
    },
    storageAdapterKinds: [],
  };
}

function buildOversizeResources(count: number): AnonymizedResource[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `collection${index + 1}`,
    fieldCount: 1,
    fields: [
      {
        name: `field${index + 1}`,
        type: "text",
        required: true,
        hidden: false,
        readOnly: false,
        position: "main",
        cellAlignment: "left",
        hasValidate: false,
        hasIndex: false,
        hasMask: false,
        min: 3,
        max: 100,
        hasSearchIndex: false,
        enableSorting: false,
        enableHiding: true,
      },
    ],
    hasDrafts: false,
    hasLivePreview: false,
    indexCount: 0,
    timestamps: false,
    savedViewCount: 0,
    defaultSortIsCustom: false,
    bulkDelete: true,
    hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 0, afterDelete: 0 },
  }));
}

function buildOversizeConfig(): AnonymizedConfig {
  const collections = buildOversizeResources(3000);
  return {
    collectionCount: collections.length,
    globalCount: 0,
    mediaCollectionCount: 0,
    blockCount: 0,
    fieldCount: collections.length,
    collections,
    globals: [],
    mediaCollections: [],
    features: {
      drafts: false,
      livePreview: false,
      conditions: false,
      slots: false,
      inputMasks: false,
      localization: false,
      auth: false,
      authAdapter: "none",
      access: {
        enabled: false,
        roleCount: 0,
        ruleCount: 0,
        fieldPermissionRuleCount: 0,
        queryConstraintRuleCount: 0,
        callbackRuleCount: 0,
        customActionCount: 0,
        customResourceCount: 0,
        organizations: false,
      },
      hookCount: 0,
    },
    storageAdapterKinds: [],
  };
}

describe("fitTelemetryEvent", () => {
  it("returns an under-cap event unchanged", () => {
    const event = buildBaseEvent(buildSmallConfig());

    expect(fitTelemetryEvent({ event })).toEqual(event);
  });

  it("truncates an oversize config's per-resource arrays, keeping every count and features, and fits the cap", () => {
    const oversizeConfig = buildOversizeConfig();
    const event = buildBaseEvent(oversizeConfig);
    expect(Buffer.byteLength(JSON.stringify(event), "utf8")).toBeGreaterThan(TELEMETRY_MAX_BODY_BYTES);

    const fitted = fitTelemetryEvent({ event });

    expect(fitted).toBeDefined();
    expect(fitted?.config).toEqual({
      ...oversizeConfig,
      collections: [],
      globals: [],
      mediaCollections: [],
      truncated: true,
    });
    expect(fitted?.config?.collectionCount).toBe(3000);
    expect(fitted?.config?.fieldCount).toBe(3000);
    expect(fitted?.config?.features).toEqual(oversizeConfig.features);
    expect(Buffer.byteLength(JSON.stringify(fitted), "utf8")).toBeLessThanOrEqual(TELEMETRY_MAX_BODY_BYTES);
  });

  it("drops an event that is still oversize after truncation", () => {
    const hugeStorageAdapterKinds = Array.from({ length: 60_000 }, () => "presigned-url" as const);
    const config: AnonymizedConfig = { ...buildSmallConfig(), storageAdapterKinds: hugeStorageAdapterKinds };
    const event = buildBaseEvent(config);
    expect(Buffer.byteLength(JSON.stringify(event), "utf8")).toBeGreaterThan(TELEMETRY_MAX_BODY_BYTES);

    const truncatedStillOversize: TelemetryEvent = {
      ...event,
      config: { ...config, collections: [], globals: [], mediaCollections: [], truncated: true },
    };
    expect(Buffer.byteLength(JSON.stringify(truncatedStillOversize), "utf8")).toBeGreaterThan(
      TELEMETRY_MAX_BODY_BYTES,
    );

    expect(fitTelemetryEvent({ event })).toBeUndefined();
  });

  it("drops an oversize event with no config at all", () => {
    const hugeEnvironment = { ...buildEnvironment(), vexVersions: { "@vexcms/huge": "x".repeat(600_000) } };
    const event: TelemetryEvent = { ...buildBaseEvent(buildSmallConfig()), config: undefined, environment: hugeEnvironment };
    expect(Buffer.byteLength(JSON.stringify(event), "utf8")).toBeGreaterThan(TELEMETRY_MAX_BODY_BYTES);

    expect(fitTelemetryEvent({ event })).toBeUndefined();
  });
});
```

#### packages/telemetry/src/index.ts

Edits are additive: 6 new export lines beside the barrel entries from steps 1–3 (Step 4 did not touch this file — `anonymizeConfig` lives in `src/config.ts` instead); nothing else in the file changes.

**1 — exports.** Add alongside the existing barrel entries from steps 1–3 (`anonymizeConfig` is NOT re-exported here — it lives only in `src/config.ts`, the `@vexcms/telemetry/config` subpath, per Step 4):

```ts
export * from "./collectEnvironment";
export * from "./sendTelemetryEvent";
export * from "./showTelemetryNotice";
export * from "./recordTelemetryEvent";
export * from "./classifyTelemetryError";
export * from "./fitTelemetryEvent";
```

Verify: `pnpm --filter @vexcms/telemetry test -- collectEnvironment sendTelemetryEvent showTelemetryNotice recordTelemetryEvent classifyTelemetryError fitTelemetryEvent`

### Step 6 — CLI wiring [agent]

Why: `vex dev` / `vex deploy` emit events; `vex telemetry` controls them.

- [ ] `packages/cli/package.json` adds `@vexcms/telemetry` (`workspace:*`) as a `devDependency` — `tsup.config.ts`'s `noExternal` bundles it into `dist`, so it's never a real runtime dependency
- [ ] `packages/cli/tsup.config.ts` adds `@vexcms/telemetry` to `noExternal` (it stays out of `external`, unlike `@vexcms/core`)
- [ ] `packages/cli/src/commands/telemetry.ts`: `enable` / `disable` / `status [--json]`
- [ ] `packages/cli/src/commands/dev.ts`: time `loadConfig` and `generateAndWrite`, record one `dev` event after the first generation (not on reloads), don't await
- [ ] `packages/cli/src/commands/deploy.ts`: record a `deploy` event and await it (bounded at 1.5s) before exit
- [ ] `packages/cli/src/index.ts`: `telemetry` subcommand plus usage text

#### packages/cli/package.json

1 edit — everything else unchanged.

**1 — `devDependencies`.** Add the new workspace dependency alongside the existing ones. `packages/cli/tsup.config.ts`'s `noExternal: ["@vexcms/telemetry"]` bundles it straight into `dist/index.js`, so published `@vexcms/cli` consumers never need to resolve the private `@vexcms/telemetry` package — it's a build-time-only devDependency, not a runtime `dependencies` entry:

```json
  "devDependencies": {
    "@types/node": "catalog:",
    "@vexcms/core": "workspace:*",
    "@vexcms/telemetry": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
    "convex": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  },
```

#### packages/cli/tsup.config.ts

1 edit — everything else unchanged.

**1 — `noExternal`.** `@vexcms/telemetry` is a private workspace package (unlike `@vexcms/core`, which stays in `external`) — tsup must bundle it into the CLI's `dist` output so npm consumers of `@vexcms/cli` never need to resolve it:

```ts
  external: ["@vexcms/core", "prettier"],
  noExternal: ["@vexcms/telemetry"],
```

#### packages/cli/src/commands/telemetry.ts

New file. Implements `vex telemetry enable|disable|status [--json]`. `status --json` loads the project's config the same way `vex dev` does, builds the exact `dev`-event payload via `buildTelemetryEvent` (anonymizing the config first), passes it through `fitTelemetryEvent` to apply the same size cap the sender uses, and prints the fitted payload without sending it.

```ts
import { resolve } from "node:path";

import {
  buildTelemetryEvent,
  fitTelemetryEvent,
  isTelemetryEnabled,
  readTelemetrySettings,
  resolveSettingsPath,
  writeTelemetrySettings,
} from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";

/**
 * `vex telemetry enable|disable|status [--json]` — manage the per-machine
 * telemetry setting and show what would be sent.
 * @param props.action - `"enable"`, `"disable"`, or `"status"`; anything else prints an error and exits 1.
 * @param props.json - For `status`, print the exact `TelemetryEvent` payload instead of a human summary.
 * @param props.cwd - Run as if started from this directory (defaults to `process.cwd()`).
 * @returns Resolves once the requested action has completed.
 */
export async function telemetryCommand(props: {
  action: string | undefined;
  json: boolean;
  cwd?: string;
}): Promise<void> {
  const cwd = props.cwd ? resolve(process.cwd(), props.cwd) : process.cwd();
  const env = process.env;
  const settingsPath = resolveSettingsPath({ env });

  switch (props.action) {
    case "enable": {
      const settings = readTelemetrySettings({ env });
      writeTelemetrySettings({ env, settings: { ...settings, enabled: true } });
      logger.success("Telemetry enabled");
      return;
    }

    case "disable": {
      const settings = readTelemetrySettings({ env });
      writeTelemetrySettings({ env, settings: { ...settings, enabled: false } });
      logger.success("Telemetry disabled");
      return;
    }

    case "status": {
      const settings = readTelemetrySettings({ env });
      const { enabled, reason } = isTelemetryEnabled({ env, settings });

      if (props.json) {
        const configPath = resolveConfigPath(cwd);
        if (!isServerConfigPath(configPath)) {
          logger.error(
            `vex telemetry status --json requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
          );
          process.exit(1);
        }
        const config = await loadConfig(configPath);
        const event = buildTelemetryEvent({
          event: "dev",
          projectDir: cwd,
          settings,
          config: anonymizeConfig({ config }),
          outcome: { status: "ok" },
        });
        const fittedEvent = fitTelemetryEvent({ event });
        if (!fittedEvent) {
          logger.error("Telemetry payload exceeds the size cap even after truncation — nothing would be sent.");
          process.exit(1);
        }
        console.log(JSON.stringify(fittedEvent, null, 2));
        return;
      }

      logger.info(`Telemetry: ${enabled ? "enabled" : "disabled"} (${reason})`);
      logger.info(`Settings file: ${settingsPath}`);
      return;
    }

    default:
      logger.error(
        `Unknown telemetry action: ${props.action ?? "(none)"}. Use enable, disable, or status.`,
      );
      process.exit(1);
  }
}
```

#### packages/cli/src/commands/dev.ts

2 edits — everything else unchanged. The file keeps its existing `// @ts-nocheck`.

**1 — imports.** Add the `node:perf_hooks` import beside the existing `node:path` import, and the telemetry imports (the main entrypoint plus the `/config` subpath for `anonymizeConfig`) above the local `../lib/*` imports:

```ts
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

import { classifyTelemetryError, recordTelemetryEvent } from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { generateAndWrite, getOutputPath } from "../lib/generateSchema.js";
```

**2 — from the function body through the initial generation block.** Replace the body from `const configPath = resolveConfigPath(cwd);` through the end of the `if (result.written) { … }` block. `resolveConfigPath`, `loadConfig`, and `generateAndWrite` are the three vex-owned stages — each failure records one `failed` `dev` event (awaited, so the process does not exit before it sends) and rethrows unchanged; the `if (!isServerConfigPath(...))` branch's existing `process.exit(1)` behavior is untouched. A successful first generation records one `ok` `dev` event, fire-and-forget, right after:

```ts
  let configPath: string;
  try {
    configPath = resolveConfigPath(cwd);
  } catch (error) {
    await recordTelemetryEvent({
      event: "dev",
      projectDir: cwd,
      outcome: { status: "failed", stage: "resolveConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  if (!isServerConfigPath(configPath)) {
    logger.error(
      `vex dev requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
    );
    process.exit(1);
  }
  logger.info(`Config found: ${configPath}`);

  // Initial generation
  const configLoadStart = performance.now();
  let config;
  try {
    config = await loadConfig(configPath);
  } catch (error) {
    await recordTelemetryEvent({
      event: "dev",
      projectDir: cwd,
      outcome: { status: "failed", stage: "loadConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  const configLoadMs = performance.now() - configLoadStart;
  const outputPath = getOutputPath(config, cwd);

  const schemaGenStart = performance.now();
  let result;
  try {
    result = await generateAndWrite(config, cwd, configPath);
  } catch (error) {
    await recordTelemetryEvent({
      event: "dev",
      projectDir: cwd,
      outcome: { status: "failed", stage: "generateSchema", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  const schemaGenMs = performance.now() - schemaGenStart;
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  void recordTelemetryEvent({
    event: "dev",
    projectDir: cwd,
    config: anonymizeConfig({ config }),
    timings: { configLoadMs, schemaGenMs, schemaChanged: result.written },
    outcome: { status: "ok" },
  });
```

The `regenerate()` function later in the file (used by the file watcher on every change) is untouched, so reloads never record a second event.

#### packages/cli/src/commands/deploy.ts

The whole function body changes throughout (three wrapped stages plus the success event), so `deployCommand` is shown complete — everything else in the file (imports beside the new telemetry import, and the rest of the file) is unchanged:

```ts
import { classifyTelemetryError, recordTelemetryEvent } from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { generateAndWrite, type GenerateResult } from "../lib/generateSchema.js";
import { deployToProduction } from "../lib/convexProcess.js";
import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";

import type { VexConfig } from "@vexcms/core";

/**
 * `vex deploy` — generate schema, auto-migrate if enabled, then run
 * `convex deploy` to push to production. Replaces `convex deploy` in CI.
 */
export async function deployCommand(): Promise<void> {
  const cwd = process.cwd();

  let configPath: string;
  try {
    configPath = resolveConfigPath(cwd);
  } catch (error) {
    await recordTelemetryEvent({
      event: "deploy",
      projectDir: cwd,
      outcome: { status: "failed", stage: "resolveConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  if (!isServerConfigPath(configPath)) {
    logger.error(
      `vex deploy requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
    );
    process.exit(1);
  }
  logger.info(`Config found: ${configPath}`);

  let config: VexConfig;
  try {
    config = await loadConfig(configPath);
  } catch (error) {
    await recordTelemetryEvent({
      event: "deploy",
      projectDir: cwd,
      outcome: { status: "failed", stage: "loadConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }

  // Use `convex deploy` for all schema pushes (interim + final)
  const pushSchema = (pushCwd: string) => deployToProduction(pushCwd);

  let result: GenerateResult;
  try {
    result = await generateAndWrite(config, cwd, configPath, { pushSchema });
  } catch (error) {
    await recordTelemetryEvent({
      event: "deploy",
      projectDir: cwd,
      outcome: { status: "failed", stage: "generateSchema", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  // Final deploy — push everything to production
  if (!deployToProduction(cwd)) {
    logger.error("convex deploy failed");
    process.exit(1);
  }

  logger.success("Deployed to production");

  await recordTelemetryEvent({
    event: "deploy",
    projectDir: cwd,
    config: anonymizeConfig({ config }),
    outcome: { status: "ok" },
  });
}
```

#### packages/cli/src/index.ts

1 edit — everything else unchanged. Replaces the whole file, since the flag-parsing loop, the `switch`, and the usage text all change together.

```ts
import { deployCommand } from "./commands/deploy.js";
import { devCommand } from "./commands/dev.js";
import { generateCommand } from "./commands/generate.js";
import { telemetryCommand } from "./commands/telemetry.js";
import { logger } from "./lib/logger.js";

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
let once = false;
let json = false;
let cwd: string | undefined;
let telemetryAction: string | undefined;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--once") {
    once = true;
  } else if (args[i] === "--json") {
    json = true;
  } else if (args[i] === "--cwd" && args[i + 1]) {
    cwd = args[++i];
  } else if (command === "telemetry" && i === 1 && !args[i]?.startsWith("--")) {
    telemetryAction = args[i];
  }
}

switch (command) {
  case "dev":
    devCommand({ once, cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "deploy":
    deployCommand().catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "generate":
    generateCommand({ cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "telemetry":
    telemetryCommand({ action: telemetryAction, json, cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  default:
    console.log(`
Usage: vex <command>

Commands:
  dev [options]       Generate vex schema, start convex dev, and watch for
                      collection config changes. Run your app server (e.g.
                      next dev) in a separate terminal.
  deploy [options]    Generate schema, auto-migrate if enabled, and deploy
                      to production. Replaces \`convex deploy\` in CI.
  generate [options]  Regenerate vex.types.ts from the vex config.
  telemetry <action>  Manage anonymous CLI telemetry: enable, disable, or
                      status [--json].

Options:
  --once              (dev) Generate schema, push to Convex, and exit
  --cwd <dir>         Run as if started from <dir>
  --json              (telemetry status) Print the exact payload
`);
    process.exit(command ? 1 : 0);
}
```

Verify: `pnpm --filter @vexcms/cli build` green, then `node packages/cli/dist/index.js telemetry status --json` prints the payload for `apps/test`, `VEX_TELEMETRY_DEBUG=1 vex dev --once` prints one event, and `DO_NOT_TRACK=1 vex dev --once` prints none.

### Step 7 — create-vexcms wiring [agent]

Why: scaffold choices are the earliest adoption signal.

- [ ] `packages/create-vexcms/package.json`: add `@vexcms/telemetry` as a `devDependency` (plus `@vexcms/core` as a type-only `devDependency`)
- [ ] `packages/create-vexcms/tsup.config.ts`: new file, `noExternal: ["@vexcms/telemetry"]`
- [ ] `packages/create-vexcms/src/index.ts`: wrap `initProject` — on throw, record a `failed` `create` event (`stage: "scaffold"`) and rethrow; otherwise record an `ok` `create` event, both awaited

#### packages/create-vexcms/tsup.config.ts

New file. `create-vexcms`'s `scripts.build` previously ran the bare `tsup src/index.ts --format esm --dts` CLI invocation, which externalizes every `node_modules` import by default — any workspace dependency had to resolve as a real `dependencies` entry at install time. A `tsup.config.ts` now sits beside it (picked up automatically even though `build` still passes `src/index.ts` on the CLI) and bundles `@vexcms/telemetry` straight into `dist/index.js`, the same `noExternal` pattern `packages/cli/tsup.config.ts` uses:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  noExternal: ["@vexcms/telemetry"],
});
```

#### packages/create-vexcms/package.json

1 edit — everything else unchanged. Add `@vexcms/telemetry` to `devDependencies`, plus `@vexcms/core` as a type-only `devDependency` (`create-vexcms`'s `tsconfig.json` sets `"module": "ESNext"` / `"moduleResolution": "bundler"`, and nothing under `src/` imports a runtime value from `@vexcms/core` — only `packages/cli/src/commands/deploy.ts`-style type usage would need it, and `create-vexcms` doesn't even have that; it's there so installer/type code can reference `VexConfig`-adjacent types if needed). With `tsup.config.ts`'s `noExternal: ["@vexcms/telemetry"]` bundling telemetry straight into `dist/index.js`, published `create-vexcms` consumers never need to resolve the private `@vexcms/telemetry` package — it's a build-time-only devDependency, not a runtime `dependencies` entry, same reasoning as `packages/cli/package.json` in Step 6. `workspace:*` is correct here (P-013: internal deps on siblings stay exact; only peer deps use `workspace:^`); `scripts/check-packed-manifests.mjs --packed` and `scripts/verify-scaffold.mjs` both pack every non-private `packages/*` directory and derive their tarball list dynamically (`readPublishablePackages`), so a private `@vexcms/telemetry` devDependency never shows up in a published tarball's manifest.

```json
{
  "devDependencies": {
    "@types/fs-extra": "catalog:",
    "@types/validate-npm-package-name": "catalog:",
    "@vexcms/core": "workspace:*",
    "@vexcms/telemetry": "workspace:*",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

#### packages/create-vexcms/src/index.ts

2 edits — everything else unchanged.

**1 — import.** Beside the existing `import type { Framework, ProjectOptions } from './installers/types.js';` line, add:

```ts
import { classifyTelemetryError, recordTelemetryEvent } from '@vexcms/telemetry';
```

**2 — around `await installer.initProject(options);` in `main()`.** `template` follows the same `bare` flag `base.ts`/`nextjs.ts` already branch on (`options.bare` skips the marketing overlay — see `base.ts`'s `if (!options.bare)` guard), so it maps directly without introducing a new concept. `projectDir` is `targetDir`, the absolute path `fs.ensureDir` just created; it never appears in the emitted event (`recordTelemetryEvent` hashes it into `projectId` via `createProjectId`, Step 3) and `oauthProviders` only contributes a count, so the event carries no project name or path. `initProject` is wrapped — a throw records a `failed` `create` event (`stage: "scaffold"`, `classifyTelemetryError`) and rethrows unchanged, so `main().catch(...)`'s existing error output and exit code are untouched; otherwise an `ok` event follows. Both calls are awaited and bounded by `sendTelemetryEvent`'s `TELEMETRY_TIMEOUT_MS` (1500 ms) — `recordTelemetryEvent` itself never rejects.

```ts
  console.log();
  try {
    await installer.initProject(options);
  } catch (error) {
    await recordTelemetryEvent({
      event: 'create',
      projectDir: targetDir,
      outcome: { status: 'failed', stage: 'scaffold', errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }

  await recordTelemetryEvent({
    event: 'create',
    projectDir: targetDir,
    outcome: { status: 'ok' },
    create: {
      framework: options.framework,
      template: options.bare ? 'base' : 'marketing',
      bare: options.bare,
      auth: {
        emailPassword: options.emailPasswordAuth,
        oauthProviderCount: options.oauthProviders.length,
        orgs: options.orgs,
      },
      monorepo: options.monorepo,
      initGit: options.initGit,
      installDependencies: options.installDependencies,
    },
  });

  // Success message
  console.log();
  displaySuccessMessage(options.projectName, targetDir, inputArg === '.');
```

Verify: `pnpm --filter @vexcms/telemetry --filter create-vexcms build && VEX_TELEMETRY_DEBUG=1 node packages/create-vexcms/dist/index.js /tmp/vex-telemetry-check --yes` prints exactly one `[vex telemetry] { "event": "create", … }` JSON block to stderr with `create.framework`, `create.template`, `create.auth`, `create.monorepo`, `create.initGit`, `create.installDependencies` populated and no `my-vexcms-app`/`vex-telemetry-check` project name or `/tmp/vex-telemetry-check` path anywhere in the printed payload.

### Step 8 — Telemetry receiver in apps/test [agent]

Why: a vendor-owned receiver for the anonymous events `recordTelemetryEvent` (Step 5) sends. `apps/test` is the receiver's home for now — it already has a live Convex deployment, an admin panel, and an `access` config to extend; a dedicated receiver app is a later step, not part of this one. Two collections: `telemetryEvents` is the append-only raw log (one row per ingested event, `timestamps: false`, received time is Convex's own `_creationTime` — no separate `receivedAt` field); `telemetryProjects` is one row per `projectId`, upserted on every event, with flat typed columns computed SERVER-SIDE in the ingest mutation from the event payload. Flat columns, not a `json` blob, because a `json` field cannot be filtered or sorted in a vexcms list view — every dimension worth slicing by (framework, failure stage, field counts, RBAC usage) needs its own checkbox/number/select/text column, and a column is only sortable when a declared index leads with it (`_creationTime` is always sortable with no index). The index budget is deliberately small — `by_projectId` (lookup), `by_lastSeenAt`, `by_collectionCount`, `by_fieldCount`, `by_hookCount`, `by_ruleCount` on `telemetryProjects`, `by_projectId` alone on `telemetryEvents` — 6 and 1, both far under Convex's 32-index-per-table ceiling. Both collections are read-only in the admin for every role: no role gets `create`/`update`/`delete`, and only `admin` gets `read` plus the saved-view actions (`readViews`/`createView`/`updateView`/`deleteView`) so the starter `admin.views` are usable and extendable from the panel.

`apps/test/convex/telemetry/{deriveTelemetryProject,ingest}.ts` cannot depend on `@vexcms/telemetry` at runtime: that package's `settings.ts`/`projectId.ts` import `node:fs`/`node:os`/`node:crypto`, and Convex's default (non-`"use node"`) runtime — the only runtime `internalMutation`/`httpAction` bodies that call `ctx.db` can run in — does not support Node built-ins. Every `@vexcms/telemetry` import in this step is `import type`, erased at compile time, so the Convex bundler never sees those specifiers; `TELEMETRY_SCHEMA_VERSION` (`1`) and `TELEMETRY_MAX_BODY_BYTES` (`524_288`) are inlined as local constants in `convex/http.ts` instead, the same pattern `apps/test/convex/schema.ts` already follows for `vex`-internal literals. `@vexcms/core`, by contrast, already runs at Convex runtime in this app (`convex/pages.ts`, `convex/vex/media.ts` import it directly; `convex/vex.ts` imports its `/server` entry) — `ADMIN_FIELDS` and `STORAGE_ADAPTER_PROTOCOLS` are imported from its root entry the same way in `deriveTelemetryProject.ts`.

`convex/schema.ts` and `convex/vex.schema.ts` are **not** hand-edited: once `telemetryEvents`/`telemetryProjects` are added to `vex.config.ts`'s `collections` array, the developer's already-running `vex dev` regenerates `vex.schema.ts` and syncs `convex/schema.ts`'s import list and `defineSchema({ … })` body automatically, the same way every other collection in this app already gets there.

- [ ] `src/db/constants/index.ts`
- [ ] `src/vexcms/collections/telemetryEvents.ts`
- [ ] `src/vexcms/collections/telemetryProjects.ts`
- [ ] `src/vexcms/collections/index.ts`
- [ ] `src/vex.config.ts`
- [ ] `src/auth/access.ts`
- [ ] `apps/test/package.json`
- [ ] `apps/test/vitest.config.ts`
- [ ] `convex/telemetry/deriveTelemetryProject.ts`
- [ ] `convex/telemetry/deriveTelemetryProject.test.ts`
- [ ] `convex/telemetry/ingest.ts`
- [ ] `convex/http.ts`
- [ ] [dev] confirm schema regeneration and run the end-to-end confirmation script

#### src/db/constants/index.ts

1 edit — below the existing `TABLE_SLUG_TESTIMONIALS`/`TestimonialDoc`/`TestimonialID` block, everything else unchanged.

**1 — new table slugs.**

```ts
export const TABLE_SLUG_TELEMETRY_EVENTS = "telemetryEvents" as const;
export const TABLE_SLUG_TELEMETRY_PROJECTS = "telemetryProjects" as const;
```

#### src/vexcms/collections/telemetryEvents.ts

New file. The raw, append-only ingest log — `payload` (the exact JSON the client sent) is the deep-dive column; the other fields are flattened out of it purely so the default list view is scannable without opening the JSON. `select` fields always store their value as an array regardless of `hasMany` (`@vexcms/core`'s `select()` validator is unconditionally `v.array(v.union(...))`), so `event`, `outcomeStatus`, `failureStage`, `errorCode` and `framework` below are all array-stored even though each only ever holds one value.

```ts
import { defineCollection, json, number, select, text } from "@vexcms/core";

import { TABLE_SLUG_TELEMETRY_EVENTS } from "~/db/constants";

export const telemetryEvents = defineCollection({
  slug: TABLE_SLUG_TELEMETRY_EVENTS,
  interfaceName: "TelemetryEvent",
  timestamps: false,
  labels: {
    singular: "Telemetry Event",
    plural: "Telemetry Events",
  },
  admin: {
    useAsTitle: "event",
    icon: "Radar",
    view: {
      sort: { field: "_creationTime", order: "desc" },
      columns: [
        { field: "event", width: 110 },
        { field: "projectId", width: 220 },
        { field: "outcomeStatus", width: 110 },
        { field: "failureStage", width: 150 },
        { field: "errorCode", width: 170 },
        { field: "framework", width: 110 },
        { field: "vexCoreVersion", width: 150 },
        { field: "machineId", hidden: true },
        { field: "schemaVersion", hidden: true },
        { field: "payload", hidden: true },
      ],
      bulkActions: { delete: false },
    },
  },
  fields: {
    event: select({
      label: "Event",
      required: true,
      options: [
        { label: "Dev", value: "dev" },
        { label: "Deploy", value: "deploy" },
        { label: "Create", value: "create" },
      ],
    }),
    schemaVersion: number({
      label: "Schema Version",
      required: true,
    }),
    machineId: text({
      label: "Machine ID",
      required: true,
    }),
    projectId: text({
      label: "Project ID",
      required: true,
      index: "by_projectId",
    }),
    outcomeStatus: select({
      label: "Outcome",
      required: true,
      options: [
        { label: "Ok", value: "ok" },
        { label: "Failed", value: "failed" },
      ],
    }),
    failureStage: select({
      label: "Failure Stage",
      options: [
        { label: "Resolve Config", value: "resolveConfig" },
        { label: "Load Config", value: "loadConfig" },
        { label: "Generate Schema", value: "generateSchema" },
        { label: "Scaffold", value: "scaffold" },
      ],
    }),
    errorCode: select({
      label: "Error Code",
      options: [
        { label: "Config Error", value: "configError" },
        { label: "Access Config Error", value: "accessConfigError" },
        { label: "Auth Config Error", value: "authConfigError" },
        { label: "Component Config Error", value: "componentConfigError" },
        { label: "Storage Config Error", value: "storageConfigError" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    framework: select({
      label: "Framework",
      required: true,
      options: [
        { label: "Next.js", value: "next" },
        { label: "TanStack", value: "tanstack" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    vexCoreVersion: text({
      label: "vex Core Version",
    }),
    payload: json({
      label: "Payload",
      required: true,
    }),
  },
});
```

#### src/vexcms/collections/telemetryProjects.ts

New file. One row per `projectId`. Every analysis dimension gets its own typed column so it can be filtered/sorted from the admin list; `latestConfig` keeps the full anonymized config around for deep dives the flat columns don't cover. Only the 6 columns named in the Why above declare an `index` — every other column is still filterable (a `where` on a non-indexed field compiles to a remainder filter, `resolveQueryIndex`), just not sortable. `timestamps: false`: this collection already carries its own `firstSeenAt`/`lastSeenAt`, so the auto-injected `updatedAt`/`by_updatedAt` commitTs field and index would be a redundant 7th index.

```ts
import { checkbox, date, defineCollection, json, number, select, text } from "@vexcms/core";

import { TABLE_SLUG_TELEMETRY_PROJECTS } from "~/db/constants";

export const telemetryProjects = defineCollection({
  slug: TABLE_SLUG_TELEMETRY_PROJECTS,
  interfaceName: "TelemetryProject",
  timestamps: false,
  labels: {
    singular: "Telemetry Project",
    plural: "Telemetry Projects",
  },
  admin: {
    useAsTitle: "projectId",
    icon: "Gauge",
    view: {
      sort: { field: "lastSeenAt", order: "desc" },
      columns: [
        { field: "projectId", pinned: "left", width: 220 },
        { field: "framework", width: 110 },
        { field: "packageManager", width: 110 },
        { field: "devEventCount", width: 90 },
        { field: "deployEventCount", width: 100 },
        { field: "createEventCount", width: 100 },
        { field: "failedEventCount", width: 90 },
        { field: "lastOutcomeStatus", width: 110 },
        { field: "collectionCount", width: 100 },
        { field: "fieldCount", width: 90 },
        { field: "lastSeenAt", width: 170 },
      ],
      bulkActions: { delete: false },
    },
    views: [
      {
        viewId: "recently-active",
        name: "Recently Active",
        description: "Every known project, newest activity first.",
        state: {
          sort: { field: "lastSeenAt", order: "desc" },
          columns: [
            "projectId",
            "framework",
            "devEventCount",
            "deployEventCount",
            "createEventCount",
            "lastOutcomeStatus",
            "lastSeenAt",
          ],
        },
      },
      {
        viewId: "failing-setups",
        name: "Failing Setups",
        description: "Projects whose most recent event failed.",
        state: {
          where: { field: "lastOutcomeStatus", op: "eq", value: "failed" },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "framework", "lastFailureStage", "lastErrorCode", "failedEventCount", "lastSeenAt"],
        },
      },
      {
        viewId: "uses-drafts",
        name: "Uses Drafts",
        description: "Projects with at least one draft-enabled collection or global.",
        state: {
          where: { field: "featureDrafts", op: "eq", value: true },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "framework", "collectionCount", "fieldCount", "lastSeenAt"],
        },
      },
      {
        viewId: "uses-rbac",
        name: "Uses RBAC",
        description: "Projects with access control enabled.",
        state: {
          where: { field: "accessEnabled", op: "eq", value: true },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "framework", "accessRoleCount", "accessRuleCount", "lastSeenAt"],
        },
      },
      {
        viewId: "query-constraint-access",
        name: "Query-Constraint Access",
        description: "Projects declaring at least one query-constraint access rule.",
        state: {
          where: { field: "accessQueryConstraintRuleCount", op: "gt", value: 0 },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "accessQueryConstraintRuleCount", "accessRuleCount", "lastSeenAt"],
        },
      },
      {
        viewId: "largest-apps",
        name: "Largest Apps",
        description: "Projects ranked by field count.",
        state: {
          sort: { field: "fieldCount", order: "desc" },
          columns: [
            "projectId",
            "collectionCount",
            "fieldCount",
            "globalCount",
            "mediaCollectionCount",
            "blockCount",
            "lastSeenAt",
          ],
        },
      },
      {
        viewId: "nextjs",
        name: "Next.js",
        description: "Projects running the Next.js framework.",
        state: {
          where: { field: "framework", op: "eq", value: "next" },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "packageManager", "devEventCount", "lastSeenAt"],
        },
      },
      {
        viewId: "tanstack",
        name: "TanStack",
        description: "Projects running the TanStack Start framework.",
        state: {
          where: { field: "framework", op: "eq", value: "tanstack" },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "packageManager", "devEventCount", "lastSeenAt"],
        },
      },
      {
        viewId: "custom-hooks",
        name: "Custom Hooks",
        description: "Projects declaring at least one collection/global lifecycle hook.",
        state: {
          sort: { field: "hookCount", order: "desc" },
          columns: ["projectId", "hookCount", "framework", "lastSeenAt"],
        },
      },
    ],
  },
  fields: {
    projectId: text({
      label: "Project ID",
      required: true,
      index: "by_projectId",
    }),
    firstSeenAt: date({
      label: "First Seen At",
      required: true,
    }),
    lastSeenAt: date({
      label: "Last Seen At",
      required: true,
      index: "by_lastSeenAt",
      admin: { enableSorting: true },
    }),
    devEventCount: number({
      label: "Dev Event Count",
      required: true,
    }),
    deployEventCount: number({
      label: "Deploy Event Count",
      required: true,
    }),
    createEventCount: number({
      label: "Create Event Count",
      required: true,
    }),
    failedEventCount: number({
      label: "Failed Event Count",
      required: true,
    }),
    lastEvent: select({
      label: "Last Event",
      required: true,
      options: [
        { label: "Dev", value: "dev" },
        { label: "Deploy", value: "deploy" },
        { label: "Create", value: "create" },
      ],
    }),
    lastOutcomeStatus: select({
      label: "Last Outcome",
      required: true,
      options: [
        { label: "Ok", value: "ok" },
        { label: "Failed", value: "failed" },
      ],
    }),
    lastFailureStage: select({
      label: "Last Failure Stage",
      options: [
        { label: "Resolve Config", value: "resolveConfig" },
        { label: "Load Config", value: "loadConfig" },
        { label: "Generate Schema", value: "generateSchema" },
        { label: "Scaffold", value: "scaffold" },
      ],
    }),
    lastErrorCode: select({
      label: "Last Error Code",
      options: [
        { label: "Config Error", value: "configError" },
        { label: "Access Config Error", value: "accessConfigError" },
        { label: "Auth Config Error", value: "authConfigError" },
        { label: "Component Config Error", value: "componentConfigError" },
        { label: "Storage Config Error", value: "storageConfigError" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    framework: select({
      label: "Framework",
      required: true,
      options: [
        { label: "Next.js", value: "next" },
        { label: "TanStack", value: "tanstack" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    packageManager: select({
      label: "Package Manager",
      required: true,
      options: [
        { label: "pnpm", value: "pnpm" },
        { label: "npm", value: "npm" },
        { label: "Yarn", value: "yarn" },
        { label: "Bun", value: "bun" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    os: text({
      label: "OS",
      required: true,
    }),
    nodeMajor: number({
      label: "Node Major Version",
      required: true,
    }),
    vexCoreVersion: text({
      label: "vex Core Version",
    }),
    scaffoldTemplate: select({
      label: "Scaffold Template",
      options: [
        { label: "Base", value: "base" },
        { label: "Marketing", value: "marketing" },
      ],
    }),
    scaffoldBare: checkbox({
      label: "Scaffold Bare",
    }),
    scaffoldMonorepo: checkbox({
      label: "Scaffold Monorepo",
    }),
    scaffoldEmailPassword: checkbox({
      label: "Scaffold Email/Password Auth",
    }),
    scaffoldOauthProviderCount: number({
      label: "Scaffold OAuth Provider Count",
    }),
    scaffoldOrgs: checkbox({
      label: "Scaffold Organizations",
    }),
    collectionCount: number({
      label: "Collection Count",
      index: "by_collectionCount",
      admin: { enableSorting: true },
    }),
    globalCount: number({
      label: "Global Count",
    }),
    mediaCollectionCount: number({
      label: "Media Collection Count",
    }),
    blockCount: number({
      label: "Block Count",
    }),
    fieldCount: number({
      label: "Field Count",
      index: "by_fieldCount",
      admin: { enableSorting: true },
    }),
    featureDrafts: checkbox({
      label: "Uses Drafts",
    }),
    featureLivePreview: checkbox({
      label: "Uses Live Preview",
    }),
    featureConditions: checkbox({
      label: "Uses Conditional Fields",
    }),
    featureSlots: checkbox({
      label: "Uses Admin Slots",
    }),
    featureInputMasks: checkbox({
      label: "Uses Input Masks",
    }),
    featureAuth: checkbox({
      label: "Uses Auth",
    }),
    authAdapter: select({
      label: "Auth Adapter",
      options: [
        { label: "None", value: "none" },
        { label: "Better Auth", value: "betterAuth" },
        { label: "Custom", value: "custom" },
      ],
    }),
    hookCount: number({
      label: "Hook Count",
      index: "by_hookCount",
      admin: { enableSorting: true },
    }),
    accessEnabled: checkbox({
      label: "Access Enabled",
    }),
    accessRoleCount: number({
      label: "Access Role Count",
    }),
    accessRuleCount: number({
      label: "Access Rule Count",
      index: "by_ruleCount",
      admin: { enableSorting: true },
    }),
    accessFieldPermissionRuleCount: number({
      label: "Access Field-Permission Rule Count",
    }),
    accessQueryConstraintRuleCount: number({
      label: "Access Query-Constraint Rule Count",
    }),
    accessCallbackRuleCount: number({
      label: "Access Callback Rule Count",
    }),
    accessCustomActionCount: number({
      label: "Access Custom Action Count",
    }),
    accessCustomResourceCount: number({
      label: "Access Custom Resource Count",
    }),
    accessOrganizations: checkbox({
      label: "Access Organizations",
    }),
    savedViewCount: number({
      label: "Saved View Count",
    }),
    customSortCount: number({
      label: "Custom Default Sort Count",
    }),
    bulkDeleteDisabledCount: number({
      label: "Bulk Delete Disabled Count",
    }),
    storageUsesPresignedUrl: checkbox({
      label: "Storage Uses Presigned URL",
    }),
    textFieldCount: number({ label: "text() Field Count" }),
    emailFieldCount: number({ label: "email() Field Count" }),
    textareaFieldCount: number({ label: "textarea() Field Count" }),
    urlFieldCount: number({ label: "url() Field Count" }),
    colorFieldCount: number({ label: "color() Field Count" }),
    numberFieldCount: number({ label: "number() Field Count" }),
    checkboxFieldCount: number({ label: "checkbox() Field Count" }),
    dateFieldCount: number({ label: "date() Field Count" }),
    commitTsFieldCount: number({ label: "commitTs() Field Count" }),
    selectFieldCount: number({ label: "select() Field Count" }),
    relationshipFieldCount: number({ label: "relationship() Field Count" }),
    arrayFieldCount: number({ label: "array() Field Count" }),
    groupFieldCount: number({ label: "group() Field Count" }),
    blocksFieldCount: number({ label: "blocks() Field Count" }),
    uploadFieldCount: number({ label: "upload() Field Count" }),
    richtextFieldCount: number({ label: "richtext() Field Count" }),
    jsonFieldCount: number({ label: "json() Field Count" }),
    tabsFieldCount: number({ label: "tabs() Field Count" }),
    collapsibleFieldCount: number({ label: "collapsible() Field Count" }),
    rowFieldCount: number({ label: "row() Field Count" }),
    uiFieldCount: number({ label: "ui() Field Count" }),
    configTruncated: checkbox({
      label: "Config Truncated",
    }),
    latestConfig: json({
      label: "Latest Config",
    }),
  },
});
```

#### src/vexcms/collections/index.ts

1 edit — add alongside the existing exports, between `./posts` and `./testimonials` (alphabetical order).

```ts
export * from "./telemetryEvents";
export * from "./telemetryProjects";
```

#### src/vex.config.ts

2 edits — everything else unchanged.

**1 — import, beside the existing `~/vexcms/collections` import.**

```ts
import {
  articles,
  caseStudies,
  changelog,
  comments,
  fields,
  footers,
  headers,
  images,
  pages,
  posts,
  telemetryEvents,
  telemetryProjects,
  testimonials,
  themes,
  users,
} from "~/vexcms/collections";
```

**2 — `collections` array in `defineConfig({ … })`.**

```ts
  collections: [
    pages,
    users,
    headers,
    footers,
    themes,
    articles,
    caseStudies,
    changelog,
    comments,
    posts,
    fields,
    testimonials,
    telemetryEvents,
    telemetryProjects,
  ],
```

#### src/auth/access.ts

3 edits — everything else unchanged. Both collections are read-only for every role: `telemetryEvents`/`telemetryProjects` get no entry under any non-admin role, and `defineAccess`'s undeclared-subject posture is pinned to deny (every other role here starts its own block with `"*": false`), so they stay fully denied for `guest`/`editor`/`contributor`/`user` with no extra code. `admin` is the one role with a blanket `"*": true`, so it needs an explicit per-resource override to carve read+views out of that grant without also carving out create/update/delete denial — matching the existing `read: true, readViews: true, createView: ..., updateView: ..., deleteView: ...` shape `testimonials`' `contributor` block already uses for the same `VIEW_ACTIONS` matrix.

**1 — import, beside the existing `~/vexcms/collections` import.**

```ts
import {
  articles,
  caseStudies,
  changelog,
  comments,
  fields,
  footers,
  headers,
  images,
  pages,
  posts,
  telemetryEvents,
  telemetryProjects,
  testimonials,
  themes,
  users,
} from "~/vexcms/collections";
```

**2 — `resources` array.**

```ts
  resources: [
    footers,
    headers,
    images,
    pages,
    themes,
    users,
    articles,
    caseStudies,
    changelog,
    comments,
    nav,
    siteSettings,
    posts,
    announcement,
    fields,
    testimonials,
    telemetryEvents,
    telemetryProjects,
  ],
```

**3 — `[USER_ROLES.admin]` permissions entry.**

```ts
    [USER_ROLES.admin]: {
      "*": true,
      telemetryEvents: {
        "*": false,
        read: true,
        readViews: true,
        createView: true,
        updateView: true,
        deleteView: true,
      },
      telemetryProjects: {
        "*": false,
        read: true,
        readViews: true,
        createView: true,
        updateView: true,
        deleteView: true,
      },
    },
```

#### apps/test/package.json

1 edit — `devDependencies`, beside the existing `@vexcms/cli` entry. Type-only (`deriveTelemetryProject.ts` only `import type`s from it), but still needs a real workspace resolution for TypeScript to find the package's `.d.ts`.

```json
    "@vexcms/cli": "workspace:*",
    "@vexcms/telemetry": "workspace:*",
```

#### apps/test/vitest.config.ts

1 edit — `test.include`, so the colocated Convex-side test below actually runs under `pnpm --filter test test`.

```ts
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "convex/**/*.test.ts"],
```

#### convex/telemetry/deriveTelemetryProject.ts

New file. A pure function — no `ctx`, no I/O — so `convex/telemetry/ingest.ts` can call it directly and its test needs nothing beyond a plain `Doc<"telemetryProjects">` fixture. Always returns every column: an event with no `config` (a failed load, or any `dev`/`deploy` event whose pipeline never reached config resolution) carries the previous row's config-derived columns forward unchanged instead of clearing them, and an event with no `create` does the same for the scaffold columns — `ctx.db.insert`/`ctx.db.patch` in `ingest.ts` always receive a complete, valid row either way.

```ts
import { ADMIN_FIELDS, STORAGE_ADAPTER_PROTOCOLS } from "@vexcms/core";
import type {
  AnonymizedConfig,
  AnonymizedField,
  AnonymizedResource,
  TelemetryCreateOptions,
  TelemetryEnvironment,
  TelemetryErrorCode,
  TelemetryEvent,
  TelemetryEventName,
  TelemetryFailureStage,
  TelemetryOutcome,
} from "@vexcms/telemetry";

import type { Doc } from "../_generated/dataModel";

type FieldTypeCounts = Record<`${keyof typeof ADMIN_FIELDS}FieldCount`, number>;

const FIELD_TYPE_KEYS = Object.keys(ADMIN_FIELDS) as (keyof typeof ADMIN_FIELDS)[];

interface ScaffoldColumns {
  scaffoldTemplate?: TelemetryCreateOptions["template"][];
  scaffoldBare?: boolean;
  scaffoldMonorepo?: boolean;
  scaffoldEmailPassword?: boolean;
  scaffoldOauthProviderCount?: number;
  scaffoldOrgs?: boolean;
}

interface ResourceConfigColumns extends FieldTypeCounts {
  savedViewCount?: number;
  customSortCount?: number;
  bulkDeleteDisabledCount?: number;
}

interface ConfigColumns extends ResourceConfigColumns {
  collectionCount?: number;
  globalCount?: number;
  mediaCollectionCount?: number;
  blockCount?: number;
  fieldCount?: number;
  featureDrafts?: boolean;
  featureLivePreview?: boolean;
  featureConditions?: boolean;
  featureSlots?: boolean;
  featureInputMasks?: boolean;
  featureAuth?: boolean;
  authAdapter?: AnonymizedConfig["features"]["authAdapter"][];
  hookCount?: number;
  accessEnabled?: boolean;
  accessRoleCount?: number;
  accessRuleCount?: number;
  accessFieldPermissionRuleCount?: number;
  accessQueryConstraintRuleCount?: number;
  accessCallbackRuleCount?: number;
  accessCustomActionCount?: number;
  accessCustomResourceCount?: number;
  accessOrganizations?: boolean;
  storageUsesPresignedUrl?: boolean;
  configTruncated?: boolean;
  latestConfig?: AnonymizedConfig;
}

export interface TelemetryProjectPatch extends ConfigColumns, ScaffoldColumns {
  projectId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  devEventCount: number;
  deployEventCount: number;
  createEventCount: number;
  failedEventCount: number;
  lastEvent: TelemetryEventName[];
  lastOutcomeStatus: TelemetryOutcome["status"][];
  lastFailureStage?: TelemetryFailureStage[];
  lastErrorCode?: TelemetryErrorCode[];
  framework: TelemetryEnvironment["framework"][];
  packageManager: TelemetryEnvironment["packageManager"][];
  os: string;
  nodeMajor: number;
  vexCoreVersion?: string;
}

function parseNodeMajor(nodeVersion: string): number {
  const match = /^v?(\d+)\./.exec(nodeVersion);
  return match?.[1] === undefined ? 0 : Number(match[1]);
}

function countFieldTypes(fields: AnonymizedField[], counts: Record<string, number>): void {
  for (const field of fields) {
    counts[field.type] = (counts[field.type] ?? 0) + 1;
    if (field.items) countFieldTypes([field.items], counts);
    if (field.fields) countFieldTypes(field.fields, counts);
    if (field.blocks) for (const block of field.blocks) countFieldTypes(block.fields, counts);
    if (field.tabs) for (const tab of field.tabs) countFieldTypes(tab.fields, counts);
  }
}

function aggregateResourceUsage(resources: AnonymizedResource[]): {
  savedViewCount: number;
  customSortCount: number;
  bulkDeleteDisabledCount: number;
} {
  let savedViewCount = 0;
  let customSortCount = 0;
  let bulkDeleteDisabledCount = 0;
  for (const resource of resources) {
    savedViewCount += resource.savedViewCount ?? 0;
    if (resource.defaultSortIsCustom) customSortCount += 1;
    if (resource.bulkDelete === false) bulkDeleteDisabledCount += 1;
  }
  return { savedViewCount, customSortCount, bulkDeleteDisabledCount };
}

function deriveResourceConfigColumns(config: AnonymizedConfig): ResourceConfigColumns {
  const fieldTypeCounts: Record<string, number> = {};
  for (const collection of config.collections) countFieldTypes(collection.fields, fieldTypeCounts);
  for (const global of config.globals) countFieldTypes(global.fields, fieldTypeCounts);
  for (const media of config.mediaCollections) countFieldTypes(media.fields, fieldTypeCounts);

  const usage = aggregateResourceUsage([...config.collections, ...config.mediaCollections]);
  const fieldTypeColumns = Object.fromEntries(
    FIELD_TYPE_KEYS.map((type) => [`${type}FieldCount`, fieldTypeCounts[type] ?? 0]),
  ) as FieldTypeCounts;

  return {
    savedViewCount: usage.savedViewCount,
    customSortCount: usage.customSortCount,
    bulkDeleteDisabledCount: usage.bulkDeleteDisabledCount,
    ...fieldTypeColumns,
  };
}

function previousResourceConfigColumns(existing: Doc<"telemetryProjects"> | null): ResourceConfigColumns {
  const fieldTypeColumns = Object.fromEntries(
    FIELD_TYPE_KEYS.map((type) => {
      const key = `${type}FieldCount` as const;
      return [key, existing?.[key] ?? 0];
    }),
  ) as FieldTypeCounts;
  return {
    savedViewCount: existing?.savedViewCount,
    customSortCount: existing?.customSortCount,
    bulkDeleteDisabledCount: existing?.bulkDeleteDisabledCount,
    ...fieldTypeColumns,
  };
}

/**
 * Derives every `telemetryProjects` column sourced from an event's `config`.
 * `config.truncated` means `fitTelemetryEvent` (in `@vexcms/telemetry`)
 * dropped `collections`/`globals`/`mediaCollections` to fit the body-size
 * cap before sending — every count and `features` field is still the real
 * value, but nothing that requires walking those now-empty arrays
 * (`<type>FieldCount`, `savedViewCount`, `customSortCount`,
 * `bulkDeleteDisabledCount`) can be recomputed, so those columns carry
 * `existing`'s values forward instead of being zeroed.
 */
function deriveConfigColumns(config: AnonymizedConfig, existing: Doc<"telemetryProjects"> | null): ConfigColumns {
  return {
    collectionCount: config.collectionCount,
    globalCount: config.globalCount,
    mediaCollectionCount: config.mediaCollectionCount,
    blockCount: config.blockCount,
    fieldCount: config.fieldCount,
    featureDrafts: config.features.drafts,
    featureLivePreview: config.features.livePreview,
    featureConditions: config.features.conditions,
    featureSlots: config.features.slots,
    featureInputMasks: config.features.inputMasks,
    featureAuth: config.features.auth,
    authAdapter: [config.features.authAdapter],
    hookCount: config.features.hookCount,
    accessEnabled: config.features.access.enabled,
    accessRoleCount: config.features.access.roleCount,
    accessRuleCount: config.features.access.ruleCount,
    accessFieldPermissionRuleCount: config.features.access.fieldPermissionRuleCount,
    accessQueryConstraintRuleCount: config.features.access.queryConstraintRuleCount,
    accessCallbackRuleCount: config.features.access.callbackRuleCount,
    accessCustomActionCount: config.features.access.customActionCount,
    accessCustomResourceCount: config.features.access.customResourceCount,
    accessOrganizations: config.features.access.organizations,
    storageUsesPresignedUrl: config.storageAdapterKinds.includes(STORAGE_ADAPTER_PROTOCOLS.presignedUrl),
    configTruncated: config.truncated,
    latestConfig: config,
    ...(config.truncated ? previousResourceConfigColumns(existing) : deriveResourceConfigColumns(config)),
  };
}

function previousConfigColumns(existing: Doc<"telemetryProjects"> | null): ConfigColumns {
  return {
    collectionCount: existing?.collectionCount,
    globalCount: existing?.globalCount,
    mediaCollectionCount: existing?.mediaCollectionCount,
    blockCount: existing?.blockCount,
    fieldCount: existing?.fieldCount,
    featureDrafts: existing?.featureDrafts,
    featureLivePreview: existing?.featureLivePreview,
    featureConditions: existing?.featureConditions,
    featureSlots: existing?.featureSlots,
    featureInputMasks: existing?.featureInputMasks,
    featureAuth: existing?.featureAuth,
    authAdapter: existing?.authAdapter,
    hookCount: existing?.hookCount,
    accessEnabled: existing?.accessEnabled,
    accessRoleCount: existing?.accessRoleCount,
    accessRuleCount: existing?.accessRuleCount,
    accessFieldPermissionRuleCount: existing?.accessFieldPermissionRuleCount,
    accessQueryConstraintRuleCount: existing?.accessQueryConstraintRuleCount,
    accessCallbackRuleCount: existing?.accessCallbackRuleCount,
    accessCustomActionCount: existing?.accessCustomActionCount,
    accessCustomResourceCount: existing?.accessCustomResourceCount,
    accessOrganizations: existing?.accessOrganizations,
    storageUsesPresignedUrl: existing?.storageUsesPresignedUrl,
    configTruncated: existing?.configTruncated,
    latestConfig: existing?.latestConfig as AnonymizedConfig | undefined,
    ...previousResourceConfigColumns(existing),
  };
}

function deriveScaffoldColumns(
  create: TelemetryCreateOptions | undefined,
  existing: Doc<"telemetryProjects"> | null,
): ScaffoldColumns {
  if (!create) {
    return {
      scaffoldTemplate: existing?.scaffoldTemplate,
      scaffoldBare: existing?.scaffoldBare,
      scaffoldMonorepo: existing?.scaffoldMonorepo,
      scaffoldEmailPassword: existing?.scaffoldEmailPassword,
      scaffoldOauthProviderCount: existing?.scaffoldOauthProviderCount,
      scaffoldOrgs: existing?.scaffoldOrgs,
    };
  }
  return {
    scaffoldTemplate: [create.template],
    scaffoldBare: create.bare,
    scaffoldMonorepo: create.monorepo,
    scaffoldEmailPassword: create.auth.emailPassword,
    scaffoldOauthProviderCount: create.auth.oauthProviderCount,
    scaffoldOrgs: create.auth.orgs,
  };
}

/**
 * Derives the full `telemetryProjects` column patch for one ingested event.
 * Always returns every column — an event carrying no `config` (a failed
 * load, or a `dev`/`deploy` event whose load never reached config
 * resolution) reuses `existing`'s config-derived columns unchanged; an
 * event carrying no `create` reuses `existing`'s scaffold columns
 * unchanged.
 *
 * @param props.event - The ingested, already-validated telemetry event.
 * @param props.existing - The project's current row, or `null` for a
 *   project's first-ever event.
 * @returns The complete column set for `ctx.db.insert`/`ctx.db.patch`.
 */
export function deriveTelemetryProject(props: {
  event: TelemetryEvent;
  existing: Doc<"telemetryProjects"> | null;
}): TelemetryProjectPatch {
  const { event, existing } = props;
  const { outcome } = event;
  const now = Date.now();

  return {
    projectId: event.projectId,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    devEventCount: (existing?.devEventCount ?? 0) + (event.event === "dev" ? 1 : 0),
    deployEventCount: (existing?.deployEventCount ?? 0) + (event.event === "deploy" ? 1 : 0),
    createEventCount: (existing?.createEventCount ?? 0) + (event.event === "create" ? 1 : 0),
    failedEventCount: (existing?.failedEventCount ?? 0) + (outcome.status === "failed" ? 1 : 0),
    lastEvent: [event.event],
    lastOutcomeStatus: [outcome.status],
    lastFailureStage: outcome.status === "failed" ? [outcome.stage] : existing?.lastFailureStage,
    lastErrorCode: outcome.status === "failed" ? [outcome.errorCode] : existing?.lastErrorCode,
    framework: [event.environment.framework],
    packageManager: [event.environment.packageManager],
    os: event.environment.os,
    nodeMajor: parseNodeMajor(event.environment.nodeVersion),
    vexCoreVersion: event.environment.vexVersions["@vexcms/core"] ?? existing?.vexCoreVersion,
    ...deriveScaffoldColumns(event.create, existing),
    ...(event.config ? deriveConfigColumns(event.config, existing) : previousConfigColumns(existing)),
  };
}
```

#### convex/telemetry/deriveTelemetryProject.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";
import type { TelemetryEvent } from "@vexcms/telemetry";

import type { Doc, Id } from "../_generated/dataModel";
import { deriveTelemetryProject, type TelemetryProjectPatch } from "./deriveTelemetryProject";

function asExistingRow(patch: TelemetryProjectPatch): Doc<"telemetryProjects"> {
  const existingId = "scratch-project" as Id<"telemetryProjects">;
  return { _id: existingId, _creationTime: 0, ...patch };
}

const baseEnvironment = {
  vexVersions: { "@vexcms/core": "0.1.0-alpha.27" },
  nodeVersion: "v20.11.0",
  os: "darwin",
  arch: "arm64",
  packageManager: "pnpm",
  framework: "next",
} satisfies TelemetryEvent["environment"];

const sampleConfig = {
  collectionCount: 1,
  globalCount: 0,
  mediaCollectionCount: 0,
  blockCount: 0,
  fieldCount: 2,
  collections: [
    {
      name: "collection1",
      fieldCount: 2,
      fields: [
        { name: "field1", type: "text", required: true },
        { name: "field2", type: "select", hasMany: false, optionCount: 2 },
      ],
      hasDrafts: false,
      hasLivePreview: false,
      indexCount: 0,
      timestamps: true,
      savedViewCount: 1,
      defaultSortIsCustom: true,
      bulkDelete: true,
      hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 1, afterDelete: 0 },
    },
  ],
  globals: [],
  mediaCollections: [],
  features: {
    drafts: false,
    livePreview: false,
    conditions: false,
    slots: false,
    inputMasks: false,
    localization: false,
    auth: true,
    authAdapter: "betterAuth",
    access: {
      enabled: true,
      roleCount: 2,
      ruleCount: 3,
      fieldPermissionRuleCount: 1,
      queryConstraintRuleCount: 1,
      callbackRuleCount: 1,
      customActionCount: 0,
      customResourceCount: 0,
      organizations: false,
    },
    hookCount: 1,
  },
  storageAdapterKinds: ["presigned-url"],
} satisfies NonNullable<TelemetryEvent["config"]>;

describe("deriveTelemetryProject", () => {
  it("produces a complete patch for a project's first (config-bearing) event", () => {
    const event: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: sampleConfig,
    };

    const patch = deriveTelemetryProject({ event, existing: null });

    expect(patch).toMatchObject({
      projectId: "project-1",
      devEventCount: 1,
      deployEventCount: 0,
      createEventCount: 0,
      failedEventCount: 0,
      lastEvent: ["dev"],
      lastOutcomeStatus: ["ok"],
      lastFailureStage: undefined,
      lastErrorCode: undefined,
      framework: ["next"],
      packageManager: ["pnpm"],
      os: "darwin",
      nodeMajor: 20,
      vexCoreVersion: "0.1.0-alpha.27",
      collectionCount: 1,
      fieldCount: 2,
      textFieldCount: 1,
      selectFieldCount: 1,
      numberFieldCount: 0,
      hookCount: 1,
      accessEnabled: true,
      accessRuleCount: 3,
      savedViewCount: 1,
      customSortCount: 1,
      bulkDeleteDisabledCount: 0,
      storageUsesPresignedUrl: true,
      latestConfig: sampleConfig,
    });
  });

  it("carries forward config-derived and scaffold columns when a later event has no config (a failed load)", () => {
    const createEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "create",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: sampleConfig,
      create: {
        framework: "nextjs",
        template: "base",
        bare: true,
        auth: { emailPassword: true, oauthProviderCount: 1, orgs: false },
        monorepo: false,
        initGit: true,
        installDependencies: false,
      },
    };
    const existing = asExistingRow(deriveTelemetryProject({ event: createEvent, existing: null }));

    const failedEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "failed", stage: "loadConfig", errorCode: "configError" },
    };

    const patch = deriveTelemetryProject({ event: failedEvent, existing });

    expect(patch).toMatchObject({
      failedEventCount: 1,
      devEventCount: 1,
      createEventCount: 1,
      lastOutcomeStatus: ["failed"],
      lastFailureStage: ["loadConfig"],
      lastErrorCode: ["configError"],
      collectionCount: 1,
      fieldCount: 2,
      textFieldCount: 1,
      latestConfig: sampleConfig,
      scaffoldTemplate: ["base"],
      scaffoldBare: true,
    });
    expect(patch.firstSeenAt).toBe(existing.firstSeenAt);
  });

  it("on a truncated config, updates scalar/feature/access columns from the real payload but carries forward the array-derived columns unchanged", () => {
    const firstEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: sampleConfig,
    };
    const existing = asExistingRow(deriveTelemetryProject({ event: firstEvent, existing: null }));

    const truncatedConfig = {
      ...sampleConfig,
      collectionCount: 50,
      fieldCount: 300,
      collections: [],
      globals: [],
      mediaCollections: [],
      features: {
        ...sampleConfig.features,
        hookCount: 7,
        access: { ...sampleConfig.features.access, ruleCount: 12 },
      },
      truncated: true,
    } satisfies NonNullable<TelemetryEvent["config"]>;

    const truncatedEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "deploy",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: truncatedConfig,
    };

    const patch = deriveTelemetryProject({ event: truncatedEvent, existing });

    expect(patch).toMatchObject({
      configTruncated: true,
      collectionCount: 50,
      fieldCount: 300,
      hookCount: 7,
      accessRuleCount: 12,
      latestConfig: truncatedConfig,
      textFieldCount: existing.textFieldCount,
      selectFieldCount: existing.selectFieldCount,
      savedViewCount: existing.savedViewCount,
      customSortCount: existing.customSortCount,
      bulkDeleteDisabledCount: existing.bulkDeleteDisabledCount,
    });
    expect(patch.textFieldCount).toBe(1);
    expect(patch.selectFieldCount).toBe(1);
    expect(patch.savedViewCount).toBe(1);
    expect(patch.customSortCount).toBe(1);
    expect(patch.bulkDeleteDisabledCount).toBe(0);
  });

  it("on a project's first-ever event arriving already truncated, zeroes the array-derived columns instead of inventing values", () => {
    const truncatedConfig = {
      ...sampleConfig,
      collections: [],
      globals: [],
      mediaCollections: [],
      truncated: true,
    } satisfies NonNullable<TelemetryEvent["config"]>;

    const event: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-2",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: truncatedConfig,
    };

    const patch = deriveTelemetryProject({ event, existing: null });

    expect(patch).toMatchObject({
      configTruncated: true,
      collectionCount: sampleConfig.collectionCount,
      fieldCount: sampleConfig.fieldCount,
      textFieldCount: 0,
      selectFieldCount: 0,
      numberFieldCount: 0,
      savedViewCount: undefined,
      customSortCount: undefined,
      bulkDeleteDisabledCount: undefined,
    });
  });
});
```

#### convex/telemetry/ingest.ts

New file. The args validator is this mutation's full runtime validation of the client-sent payload — there is no separate schema-parse step, so `http.ts`'s handler below just forwards the JSON-parsed body and lets this validator reject (caught as a 400) whatever doesn't match. `os` stays `v.string()` rather than enumerating every `NodeJS.Platform` literal — the sender (`collectEnvironment`) only ever puts `process.platform` there, so the closed set is already guaranteed upstream and re-encoding it here would just be restating that guarantee. `.unique()` on the `by_projectId` lookup turns an accidental duplicate row into a thrown error (a 400 to the client) instead of a silently-wrong upsert.

```ts
import { v } from "convex/values";
import type { TelemetryEvent } from "@vexcms/telemetry";

import { internalMutation } from "../_generated/server";
import { deriveTelemetryProject } from "./deriveTelemetryProject";

const TELEMETRY_EVENT_NAMES = ["dev", "deploy", "create"] as const;
const TELEMETRY_FAILURE_STAGES = ["resolveConfig", "loadConfig", "generateSchema", "scaffold"] as const;
const TELEMETRY_ERROR_CODES = [
  "configError",
  "accessConfigError",
  "authConfigError",
  "componentConfigError",
  "storageConfigError",
  "unknown",
] as const;
const TELEMETRY_FRAMEWORKS = ["next", "tanstack", "unknown"] as const;
const TELEMETRY_PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun", "unknown"] as const;
const TELEMETRY_CREATE_TEMPLATES = ["base", "marketing"] as const;

const outcomeValidator = v.union(
  v.object({ status: v.literal("ok") }),
  v.object({
    status: v.literal("failed"),
    stage: v.union(...TELEMETRY_FAILURE_STAGES.map((stage) => v.literal(stage))),
    errorCode: v.union(...TELEMETRY_ERROR_CODES.map((code) => v.literal(code))),
  }),
);

const environmentValidator = v.object({
  vexVersions: v.record(v.string(), v.string()),
  nodeVersion: v.string(),
  os: v.string(),
  arch: v.string(),
  packageManager: v.union(...TELEMETRY_PACKAGE_MANAGERS.map((packageManager) => v.literal(packageManager))),
  framework: v.union(...TELEMETRY_FRAMEWORKS.map((framework) => v.literal(framework))),
});

const createValidator = v.object({
  framework: v.string(),
  template: v.union(...TELEMETRY_CREATE_TEMPLATES.map((template) => v.literal(template))),
  bare: v.boolean(),
  auth: v.object({
    emailPassword: v.boolean(),
    oauthProviderCount: v.number(),
    orgs: v.boolean(),
  }),
  monorepo: v.boolean(),
  initGit: v.boolean(),
  installDependencies: v.boolean(),
});

/**
 * Ingests one telemetry event: inserts the raw row into `telemetryEvents`
 * and upserts the derived `telemetryProjects` row for its `projectId`. The
 * args validator above is this mutation's complete runtime validation of
 * the client-sent payload — `event` below is that already-validated
 * payload, read as `TelemetryEvent` for `deriveTelemetryProject`.
 */
export const ingest = internalMutation({
  args: {
    schemaVersion: v.literal(1),
    event: v.union(...TELEMETRY_EVENT_NAMES.map((name) => v.literal(name))),
    machineId: v.string(),
    projectId: v.string(),
    sentAt: v.string(),
    environment: environmentValidator,
    outcome: outcomeValidator,
    config: v.optional(v.any()),
    timings: v.optional(v.any()),
    create: v.optional(createValidator),
  },
  handler: async (ctx, args) => {
    const event = args as TelemetryEvent;
    const { outcome } = event;

    await ctx.db.insert("telemetryEvents", {
      event: [event.event],
      schemaVersion: event.schemaVersion,
      machineId: event.machineId,
      projectId: event.projectId,
      outcomeStatus: [outcome.status],
      failureStage: outcome.status === "failed" ? [outcome.stage] : undefined,
      errorCode: outcome.status === "failed" ? [outcome.errorCode] : undefined,
      framework: [event.environment.framework],
      vexCoreVersion: event.environment.vexVersions["@vexcms/core"],
      payload: event,
    });

    const existing = await ctx.db
      .query("telemetryProjects")
      .withIndex("by_projectId", (q) => q.eq("projectId", event.projectId))
      .unique();

    const patch = deriveTelemetryProject({ event, existing });

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("telemetryProjects", patch);
    }
  },
});
```

#### convex/http.ts

1 edit — 2 new imports plus 1 new `http.route({ … })` registration, all added above the existing `export default http`; the existing auth routes are unchanged.

**1 — imports: `type FunctionArgs` added to the existing `convex/server` import, plus a new `internal` import beside the existing `httpAction` import.**

```ts
import { httpRouter, type FunctionArgs } from "convex/server"

import { internal } from "./_generated/api"
```

**2 — after the existing POST `/api/auth/` route registration, before `export default http`.**

```ts
const TELEMETRY_SCHEMA_VERSION = 1
const TELEMETRY_MAX_BODY_BYTES = 524_288

const telemetryEventsHandler = httpAction(async (ctx, request) => {
  const contentLength = request.headers.get("content-length")
  if (contentLength !== null && Number(contentLength) > TELEMETRY_MAX_BODY_BYTES) {
    return new Response(null, { status: 413 })
  }

  const bodyText = await request.text()
  if (new TextEncoder().encode(bodyText).length > TELEMETRY_MAX_BODY_BYTES) {
    return new Response(null, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(bodyText)
  } catch {
    return new Response(null, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return new Response(null, { status: 400 })
  }
  if (!("schemaVersion" in body) || body.schemaVersion !== TELEMETRY_SCHEMA_VERSION) {
    return new Response(null, { status: 400 })
  }

  const payload = body as FunctionArgs<typeof internal.telemetry.ingest.ingest>
  try {
    await ctx.runMutation(internal.telemetry.ingest.ingest, payload)
  } catch {
    return new Response(null, { status: 400 })
  }

  return new Response(null, { status: 204 })
})

http.route({
  handler: telemetryEventsHandler,
  method: "POST",
  path: "/telemetry/events",
})
```

No IP header is ever read — only `content-length`, for the size check — so no IP reaches the stored document. No CORS headers: the endpoint is called by the `vex`/`create-vexcms` CLIs over `fetch`, never a browser, so no preflight is needed.

**No `convex-test` integration test for `ingest`.**

`apps/test` has no `convex-test` devDependency (unlike `packages/core`, which runs its Convex-backed suites against it) — `convex-test` is a repo-wide peer-optional dependency other packages opt into, and adding it here is out of scope for this step. `ingest.ts`'s own logic is 2 straight-line `ctx.db` calls (one insert, one indexed lookup-then-insert-or-patch) with zero branching of its own; every piece of branching logic — counters, last-outcome, carried-forward columns, field-type counting — lives in `deriveTelemetryProject`, which is fully covered above without needing a Convex runtime at all. The `[dev]` end-to-end script below is the acceptance check for the `ctx.db` wiring itself.

- [ ] [dev] Confirm the developer's already-running `vex dev` in `apps/test` picked up `telemetryEvents`/`telemetryProjects` and regenerated `convex/vex.schema.ts` / `convex/schema.ts` (P-024 — no agent starts `vex dev`; it is already running).
- [ ] [dev] Read the receiver URL: `npx convex env get CONVEX_SITE_URL` from `apps/test` (or the Convex dashboard's HTTP Actions URL) — the base for `VEX_TELEMETRY_ENDPOINT`.
- [ ] [dev] End-to-end confirmation script:
  ```sh
  export VEX_TELEMETRY_ENDPOINT="<CONVEX_SITE_URL>/telemetry/events"

  # ok events from two real apps in the monorepo
  pnpm --filter test vex:generate
  pnpm --filter www vex:generate

  # a freshly scaffolded project — its own `create` event, then an ok `dev` event
  pnpm --filter create-vexcms build
  node packages/create-vexcms/dist/index.js /tmp/vex-telemetry-e2e --yes
  (cd /tmp/vex-telemetry-e2e && pnpm exec vex dev --once)

  # break that scaffold's config, retry, and confirm a `failed` dev event lands
  # (e.g. point src/vex.config.ts's `access.userCollectionSlug` at a slug that
  # doesn't exist, forcing a VexAccessConfigError at loadConfig)
  (cd /tmp/vex-telemetry-e2e && pnpm exec vex dev --once)

  # opt-out — confirm this run adds nothing
  (cd apps/test && DO_NOT_TRACK=1 pnpm exec vex dev --once)
  ```
- [ ] [dev] In `/admin/telemetryProjects`: 3 rows (`test`, `www`, the `/tmp/vex-telemetry-e2e` scaffold), each with `devEventCount`/`createEventCount` ≥ 1 and `framework`/`packageManager`/`os`/`collectionCount`/`fieldCount` populated from the ok events; the scaffold's row additionally shows `failedEventCount` ≥ 1, `lastOutcomeStatus: ["failed"]`, `lastFailureStage`/`lastErrorCode` set from the broken-config retry. In `/admin/telemetryEvents`: one row per command above, `payload` showing the exact JSON sent. The `DO_NOT_TRACK=1` run adds no 4th row to either collection.
- [ ] [dev] Exercise the "Failing Setups", "Largest Apps" and "Query-Constraint Access" tabs on `/admin/telemetryProjects` and confirm each renders the expected subset with no console error.

Verify: `pnpm --filter test test -- deriveTelemetryProject` green; `pnpm --filter test typecheck` green; `[dev]` end-to-end confirmation script above produces the rows described.

### Step 9 — Public docs page [agent]
Why: T8. Every field sent is listed publicly.

- [ ] `apps/docs/src/content/docs/guides/telemetry.mdx`

#### apps/docs/src/content/docs/guides/telemetry.mdx

New guide. The `guides` sidebar group is `autogenerate: { directory: 'guides' }` in
`apps/docs/astro.config.mjs`, so this file needs no manual sidebar entry — it appears
automatically, sorted by its `title`. Real output of `vex telemetry status --json` run
against the `apps/test` fixture project.
`machineId`/`projectId` are replaced with all-zero placeholders, `collections`/`globals` are
trimmed to one representative entry each, and `@vexcms/telemetry` is dropped from
`vexVersions` (an internal workspace dependency of the fixture, not something a real project
installs — telemetry ships bundled inside `vex` and `create-vexcms`), since the
`TelemetryEvent`/`AnonymizedConfig` types own the exact field allowlist and this page has to
match them exactly, not approximate them.

````mdx
---
title: Telemetry
description: What vex and create-vexcms send, why, and the exact payload shape.
---

VexCMS's CLI (`vex`) and scaffolder (`create-vexcms`) collect anonymous, aggregate usage data
so 0.1.x development targets the field types, features and config shapes real projects
actually use. Telemetry is **on by default** and never collects anything that identifies a
company, a person, their content, or their infrastructure. This page lists every field ever
sent, with a real example payload.

Telemetry is a build/dev-time-only CLI concern. Nothing related to it runs in your Convex
deployment or ships to your app's browser bundle.

## When events are sent

| Event | Command | Timing |
|---|---|---|
| `dev` | `vex dev` | Once per process, after the first config load and schema generation attempt — whether it succeeds or fails. Not sent again on later file-watch reloads in the same process. A successful attempt is fire-and-forget; a failed attempt is awaited before the error is rethrown, so the event is sent even though the process is about to exit. |
| `deploy` | `vex deploy` | Once per invocation, ok or failed, awaited (bounded to ~1.5s) before the process exits. |
| `create` | `create-vexcms` | Once per invocation, ok or failed, awaited (bounded to ~1.5s) before the CLI exits. |

Each event is one HTTP POST. There is no session concept and no batching.

## The first-run notice

The first time any of the three commands run on a machine, a one-time notice is printed to
stderr: what is collected, a link to this page, and how to disable telemetry
(`vex telemetry disable`, or `DO_NOT_TRACK=1`). It is never shown again on that machine (a
timestamp is stored locally) and it never blocks or delays the command.

## Field reference

Every event shares this envelope (`TelemetryEvent`):

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | `number` | Payload schema version (currently `1`). Bumped, never silently changed, if the shape changes. |
| `event` | `"dev" \| "deploy" \| "create"` | Which command sent the event. |
| `machineId` | `string` | A random id generated once per machine on first run. Not derived from any hardware identifier. |
| `projectId` | `string` | A per-machine, per-project anonymous id — see [Anonymous ids](#anonymous-ids). |
| `sentAt` | `string` | ISO-8601 timestamp of when the event was sent. |
| `environment` | `object` | Runtime environment — see [`environment`](#environment). |
| `outcome` | `object` | Whether the run succeeded or failed, and where — see [`outcome`](#outcome). |
| `config` | `object \| undefined` | Anonymized project config, present when a `vex.config.ts` was loaded — see [Config payload](#config-payload). |
| `timings` | `object \| undefined` | Build timings, present on `dev` events — see [`timings`](#timings-dev-events-only). |
| `create` | `object \| undefined` | Scaffold choices, present on `create` events — see [`create`](#create-create-events-only). |

### `environment`

| Field | Type | Description |
|---|---|---|
| `vexVersions` | `Record<string, string>` | Installed version of every `@vexcms/*` and `create-vexcms` package in the project's `package.json`, as written (e.g. `"^0.1.0"`). |
| `nodeVersion` | `string` | `process.version`. |
| `os` | `string` | `process.platform` (e.g. `"darwin"`, `"linux"`, `"win32"`). |
| `arch` | `string` | `process.arch` (e.g. `"arm64"`, `"x64"`). |
| `packageManager` | `"pnpm" \| "npm" \| "yarn" \| "bun" \| "unknown"` | Detected from the project's lockfile, falling back to `npm_config_user_agent`. |
| `framework` | `"next" \| "tanstack" \| "unknown"` | Detected from the project's `next` / `@tanstack/react-start` dependency. |

### `outcome`

A coarse category only — enough to find which stage and kind of setup is failing, never a
message, a stack trace, a file path, or a config value.

| Field | Type | Description |
|---|---|---|
| `status` | `"ok" \| "failed"` | Whether the run completed. |
| `stage` | `"resolveConfig" \| "loadConfig" \| "generateSchema" \| "scaffold"` | Present only when `status` is `"failed"`. Which vex-owned pipeline stage the failure happened in. Convex push/deploy failures are never reported — only vex's own config-resolve, config-load, schema-generation, and scaffold stages are. |
| `errorCode` | `"configError" \| "accessConfigError" \| "authConfigError" \| "componentConfigError" \| "storageConfigError" \| "unknown"` | Present only when `status` is `"failed"`. The caught error's allowlisted class name, never its message. |

### `timings` (`dev` events only)

| Field | Type | Description |
|---|---|---|
| `configLoadMs` | `number` | Time to load and parse `vex.config.ts` / `vex.config.server.ts`. |
| `schemaGenMs` | `number` | Time to generate the Convex schema and types from the config. |
| `schemaChanged` | `boolean` | Whether the generated schema differed from the previous run. |

### `create` (`create` events only)

| Field | Type | Description |
|---|---|---|
| `framework` | `string` | Target framework (e.g. `"next"`). |
| `template` | `"base" \| "marketing"` | Which starter template was scaffolded. |
| `bare` | `boolean` | Whether `--bare` was passed. |
| `auth.emailPassword` | `boolean` | Whether email/password auth was selected. |
| `auth.oauthProviderCount` | `number` | Count of OAuth providers selected — never which providers. |
| `auth.orgs` | `boolean` | Whether organizations were enabled. |
| `monorepo` | `boolean` | Whether `--monorepo` was passed. |
| `initGit` | `boolean` | Whether a git repo was initialized. |
| `installDependencies` | `boolean` | Whether dependencies were installed. |

### Config payload

When a `vex.config.ts` is present, `config` carries an **anonymized** snapshot of its shape,
never its content. Collection, global, media collection, block and field NAMES are replaced
with generated, numbered placeholders (`collection1`, `global1`, `media1`, `block1`,
`field1`, …), each counter running in traversal order — never their real names.

#### Top level (`AnonymizedConfig`)

| Field | Type | Description |
|---|---|---|
| `collectionCount` | `number` | Number of collections. |
| `globalCount` | `number` | Number of globals. |
| `mediaCollectionCount` | `number` | Number of media collections. |
| `blockCount` | `number` | Number of block definitions across every `blocks()` field. |
| `fieldCount` | `number` | Number of fields across every resource and nesting depth. |
| `collections` | `AnonymizedResource[]` | One entry per collection — see [Resources](#resources). |
| `globals` | `AnonymizedResource[]` | One entry per global. |
| `mediaCollections` | `AnonymizedMediaCollection[]` | One entry per media collection — a resource plus `storageAdapterKind`. |
| `features.drafts` | `boolean` | Whether any resource has drafts enabled. |
| `features.livePreview` | `boolean` | Whether any resource has live preview enabled. |
| `features.conditions` | `boolean` | Whether any field uses a conditional `admin.condition`. |
| `features.slots` | `boolean` | Whether any slot fields are configured. |
| `features.inputMasks` | `boolean` | Whether any field has an input mask. |
| `features.localization` | `false` | Always `false` — `@vexcms/core` has no localization feature yet. Reserved so this shape doesn't change again the day core adds one. |
| `features.auth` | `boolean` | Whether auth is configured. |
| `features.authAdapter` | `"none" \| "betterAuth" \| "custom"` | Which auth adapter kind is configured. |
| `features.access.enabled` | `boolean` | Whether an access-control config is present. |
| `features.access.roleCount` | `number` | Number of declared roles. |
| `features.access.ruleCount` | `number` | Total permission rules declared. |
| `features.access.fieldPermissionRuleCount` | `number` | Rules scoped to individual fields. |
| `features.access.queryConstraintRuleCount` | `number` | Rules expressed as a query constraint (`where`). |
| `features.access.callbackRuleCount` | `number` | Rules expressed as a callback function. |
| `features.access.customActionCount` | `number` | Declared custom actions. |
| `features.access.customResourceCount` | `number` | Declared custom resources. |
| `features.access.organizations` | `boolean` | Whether organizations are enabled. |
| `features.hookCount` | `number` | Total lifecycle hooks declared across every resource. |
| `storageAdapterKinds` | `StorageAdapterProtocol[]` | Distinct storage adapter kinds configured (e.g. `"convex-file-storage"`). |

#### Resources (`AnonymizedResource`, `AnonymizedMediaCollection`)

One entry per collection, global, or media collection.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Generated placeholder (`collection1`, `global1`, `media1`). |
| `fieldCount` | `number` | Number of fields on this resource. |
| `fields` | `AnonymizedField[]` | This resource's fields — see [Fields](#fields). |
| `hasDrafts` | `boolean` | Whether drafts are enabled. |
| `hasLivePreview` | `boolean` | Whether live preview is enabled. |
| `indexCount` | `number \| undefined` | Number of declared indexes. |
| `timestamps` | `boolean` | Whether `createdAt`/`updatedAt` timestamps are enabled. |
| `savedViewCount` | `number \| undefined` | Number of admin saved views configured. |
| `defaultSortIsCustom` | `boolean \| undefined` | Whether the default list sort differs from the built-in default. |
| `bulkDelete` | `boolean \| undefined` | Whether bulk delete is enabled in the admin list view. |
| `hookCounts` | `Record<"beforeChange" \| "beforeDelete" \| "afterChange" \| "afterDelete", number>` | Count of declared lifecycle hooks of each kind (`0` or `1` each). |
| `storageAdapterKind` | `StorageAdapterProtocol \| undefined` | Media collections only — the storage adapter kind in use. |

#### Blocks (`AnonymizedBlock`)

One entry per block definition inside a `blocks()` field.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Generated placeholder (`block1`). |
| `fieldCount` | `number` | Number of fields in this block. |
| `defaultCollapsed` | `boolean \| undefined` | Whether the block starts collapsed in the admin UI. |
| `fields` | `AnonymizedField[]` | This block's fields. |

#### Fields (`AnonymizedField`)

Every field reports its `type` and only allowlisted booleans, numbers and enum options for
that type. Any string value a field can hold (defaults, labels, descriptions, regex
patterns, URLs) is dropped entirely, except the three allowlisted booleans/enums below.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Generated placeholder (`field1`). |
| `type` | `AdminFieldType` | The field type (e.g. `"text"`, `"richText"`, `"relationship"`). |
| `required` | `boolean \| undefined` | Whether the field is required. |
| `hidden` | `boolean \| undefined` | Whether the field is hidden in the admin UI. |
| `readOnly` | `boolean \| undefined` | Whether the field is read-only in the admin UI. |
| `position` | `"main" \| "sidebar" \| undefined` | Admin layout position. |
| `cellAlignment` | `Alignment \| undefined` | List-view cell alignment. |
| `hasValidate` | `boolean \| undefined` | Whether a custom validator function is configured — never its logic. |
| `hasIndex` | `boolean \| undefined` | Whether the field is indexed. |
| `hasSearchIndex` | `boolean \| undefined` | Whether the field is part of a search index. |
| `hasMask` | `boolean \| undefined` | Whether an input mask is configured — never its pattern. |
| `min` | `number \| undefined` | Minimum value/length constraint. |
| `max` | `number \| undefined` | Maximum value/length constraint. |
| `step` | `number \| undefined` | Numeric step constraint. |
| `rows` | `number \| undefined` | Textarea row count. |
| `defaultValue` | `boolean \| undefined` | Whether a default value is configured (checkbox fields only) — never the value itself. |
| `format` | `ColorFormat \| CommitTsFieldAdminFormat \| undefined` | Color field format, or a `commitTs` field's admin display format (e.g. `"relative"`). |
| `themeColors` | `boolean \| undefined` | Whether a color field restricts to theme colors. |
| `time.hidden` | `boolean \| undefined` | Date field: whether the time portion is hidden. |
| `time.use12HourFormat` | `boolean \| undefined` | Date field: whether a 12-hour clock is used. |
| `time.timePicker.hour` | `boolean \| undefined` | Date field: whether the hour picker is shown. |
| `time.timePicker.minute` | `boolean \| undefined` | Date field: whether the minute picker is shown. |
| `time.timePicker.second` | `boolean \| undefined` | Date field: whether the second picker is shown. |
| `hasMany` | `boolean \| undefined` | Relationship/upload field: whether multiple targets are allowed. |
| `optionCount` | `number \| undefined` | Select/radio field: number of configured options — never the option values. |
| `display` | `SelectDisplay \| undefined` | Select field display mode. |
| `searchable` | `boolean \| undefined` | Relationship field: whether target search is enabled. |
| `target` | `string \| undefined` | Relationship/upload field: the resolved `collectionN`/`mediaN` placeholder it targets — never the real collection name. |
| `hasAccept` | `boolean \| undefined` | Upload field: whether a file-type allowlist is configured — never the list itself. |
| `hasMediaTarget` | `boolean \| undefined` | Upload field: whether a specific media collection target is set. |
| `defaultCollapsed` | `boolean \| undefined` | Array/blocks field: whether rows/blocks start collapsed. |
| `items` | `AnonymizedField \| undefined` | Array field: the anonymized item field definition. |
| `fields` | `AnonymizedField[] \| undefined` | Group field: nested fields. |
| `blocks` | `AnonymizedBlock[] \| undefined` | Blocks field: the anonymized block definitions — see [Blocks](#blocks-anonymizedblock). |
| `tabCount` | `number \| undefined` | Tabs field: number of tabs. |
| `tabs` | `{ fieldCount: number; fields: AnonymizedField[] }[] \| undefined` | Tabs field: each tab's field count and anonymized fields. |
| `hasCustomCell` | `boolean \| undefined` | Whether a custom list-view cell renderer is configured. |
| `enableSorting` | `boolean \| undefined` | Whether the list view can sort by this field. |
| `enableHiding` | `boolean \| undefined` | Whether this field's column can be hidden in the list view. |
| `on` | `"create" \| "update" \| "publish" \| undefined` | `commitTs` field: which lifecycle event sets the timestamp. |

Any config key not on this allowlist is silently dropped, not sent as-is.

#### Example payload

Real output of `vex telemetry status --json` run against the `apps/test` fixture project (a
config with 24 collections, 3 globals, 1 media collection and 585 fields in total, covering
every supported field type). `machineId` and `projectId` below have been replaced with
all-zero placeholders of the same shape. The `collections` and `globals` arrays have been
trimmed from the real 24 and 3 entries down to one representative collection — `collection4`,
showing a `text` field next to a `blocks` field whose block nests `text`, `upload`, and two
`array` fields each holding a `group` — and one representative global — `global2`, showing
`relationship`, `upload`, and sidebar-positioned fields — so this page stays readable. The
top-level counts (`collectionCount`, `fieldCount`, etc.) are the real, untrimmed totals for
the fixture project; `mediaCollections` and `features` are shown in full since the project
only has one media collection. `@vexcms/telemetry` has been removed from `vexVersions` below:
it's an internal workspace dependency of this monorepo's test fixture, not something a real
project installs — telemetry ships bundled inside `vex` and `create-vexcms`.

```json
{
  "schemaVersion": 1,
  "event": "dev",
  "machineId": "00000000-0000-0000-0000-000000000000",
  "projectId": "0000000000000000000000000000000000000000000000000000000000000000",
  "sentAt": "2026-11-04T17:00:55.631Z",
  "environment": {
    "vexVersions": {
      "@vexcms/better-auth": "workspace:*",
      "@vexcms/core": "workspace:*",
      "@vexcms/file-storage-convex": "workspace:*",
      "@vexcms/next": "workspace:*",
      "@vexcms/react": "workspace:*",
      "@vexcms/richtext-plate": "workspace:*",
      "@vexcms/cli": "workspace:*"
    },
    "nodeVersion": "v24.9.0",
    "os": "darwin",
    "arch": "arm64",
    "packageManager": "pnpm",
    "framework": "next"
  },
  "outcome": {
    "status": "ok"
  },
  "config": {
    "collectionCount": 24,
    "globalCount": 3,
    "mediaCollectionCount": 1,
    "blockCount": 20,
    "fieldCount": 585,
    "collections": [
      {
        "name": "collection4",
        "fieldCount": 2,
        "fields": [
          {
            "name": "field172",
            "type": "text",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": true,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": false
          },
          {
            "name": "field173",
            "type": "blocks",
            "required": false,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "defaultCollapsed": false,
            "max": 1,
            "blocks": [
              {
                "name": "block16",
                "fieldCount": 5,
                "fields": [
                  {
                    "name": "field174",
                    "type": "text",
                    "required": false,
                    "hidden": false,
                    "readOnly": false,
                    "position": "main",
                    "cellAlignment": "left",
                    "hasValidate": false,
                    "hasIndex": false,
                    "enableSorting": false,
                    "enableHiding": true,
                    "hasMask": false,
                    "hasSearchIndex": false
                  },
                  {
                    "name": "field175",
                    "type": "upload",
                    "required": false,
                    "hidden": false,
                    "readOnly": false,
                    "position": "main",
                    "cellAlignment": "left",
                    "hasValidate": false,
                    "hasIndex": false,
                    "enableSorting": false,
                    "enableHiding": true,
                    "hasMany": false,
                    "hasAccept": false,
                    "target": "media1"
                  },
                  {
                    "name": "field176",
                    "type": "text",
                    "required": false,
                    "hidden": false,
                    "readOnly": false,
                    "position": "main",
                    "cellAlignment": "left",
                    "hasValidate": false,
                    "hasIndex": false,
                    "enableSorting": false,
                    "enableHiding": true,
                    "hasMask": false,
                    "hasSearchIndex": false
                  },
                  {
                    "name": "field177",
                    "type": "array",
                    "required": false,
                    "hidden": false,
                    "readOnly": false,
                    "position": "main",
                    "cellAlignment": "left",
                    "hasValidate": false,
                    "hasIndex": false,
                    "enableSorting": false,
                    "enableHiding": true,
                    "items": {
                      "name": "field178",
                      "type": "group",
                      "required": true,
                      "hidden": false,
                      "readOnly": false,
                      "position": "main",
                      "cellAlignment": "left",
                      "hasValidate": false,
                      "hasIndex": false,
                      "enableSorting": false,
                      "enableHiding": true,
                      "defaultCollapsed": false,
                      "fields": [
                        {
                          "name": "field179",
                          "type": "text",
                          "required": true,
                          "hidden": false,
                          "readOnly": false,
                          "position": "main",
                          "cellAlignment": "left",
                          "hasValidate": false,
                          "hasIndex": false,
                          "enableSorting": false,
                          "enableHiding": true,
                          "hasMask": false,
                          "hasSearchIndex": false
                        },
                        {
                          "name": "field180",
                          "type": "text",
                          "required": true,
                          "hidden": false,
                          "readOnly": false,
                          "position": "main",
                          "cellAlignment": "left",
                          "hasValidate": false,
                          "hasIndex": false,
                          "enableSorting": false,
                          "enableHiding": true,
                          "hasMask": false,
                          "hasSearchIndex": false
                        }
                      ]
                    }
                  },
                  {
                    "name": "field181",
                    "type": "array",
                    "required": false,
                    "hidden": false,
                    "readOnly": false,
                    "position": "main",
                    "cellAlignment": "left",
                    "hasValidate": false,
                    "hasIndex": false,
                    "enableSorting": false,
                    "enableHiding": true,
                    "items": {
                      "name": "field182",
                      "type": "group",
                      "required": true,
                      "hidden": false,
                      "readOnly": false,
                      "position": "main",
                      "cellAlignment": "left",
                      "hasValidate": false,
                      "hasIndex": false,
                      "enableSorting": false,
                      "enableHiding": true,
                      "defaultCollapsed": false,
                      "fields": [
                        {
                          "name": "field183",
                          "type": "text",
                          "required": true,
                          "hidden": false,
                          "readOnly": false,
                          "position": "main",
                          "cellAlignment": "left",
                          "hasValidate": false,
                          "hasIndex": false,
                          "enableSorting": false,
                          "enableHiding": true,
                          "hasMask": false,
                          "hasSearchIndex": false
                        },
                        {
                          "name": "field184",
                          "type": "text",
                          "required": true,
                          "hidden": false,
                          "readOnly": false,
                          "position": "main",
                          "cellAlignment": "left",
                          "hasValidate": false,
                          "hasIndex": false,
                          "enableSorting": false,
                          "enableHiding": true,
                          "hasMask": false,
                          "hasSearchIndex": false
                        },
                        {
                          "name": "field185",
                          "type": "text",
                          "required": false,
                          "hidden": false,
                          "readOnly": false,
                          "position": "main",
                          "cellAlignment": "left",
                          "hasValidate": false,
                          "hasIndex": false,
                          "enableSorting": false,
                          "enableHiding": true,
                          "hasMask": false,
                          "hasSearchIndex": false
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ],
        "hasDrafts": false,
        "hasLivePreview": false,
        "indexCount": 0,
        "timestamps": true,
        "savedViewCount": 0,
        "defaultSortIsCustom": false,
        "bulkDelete": true,
        "hookCounts": {
          "beforeChange": 0,
          "beforeDelete": 0,
          "afterChange": 0,
          "afterDelete": 0
        }
      }
    ],
    "globals": [
      {
        "name": "global2",
        "fieldCount": 9,
        "fields": [
          {
            "name": "field565",
            "type": "text",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": false
          },
          {
            "name": "field567",
            "type": "relationship",
            "required": false,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMany": false,
            "target": "collection5"
          },
          {
            "name": "field569",
            "type": "upload",
            "required": false,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMany": false,
            "hasAccept": false,
            "target": "media1"
          },
          {
            "name": "field570",
            "type": "text",
            "required": false,
            "hidden": false,
            "readOnly": false,
            "position": "sidebar",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": false
          }
        ],
        "hasDrafts": false,
        "hasLivePreview": false,
        "timestamps": false,
        "hookCounts": {
          "beforeChange": 0,
          "beforeDelete": 0,
          "afterChange": 0,
          "afterDelete": 0
        }
      }
    ],
    "mediaCollections": [
      {
        "name": "media1",
        "fieldCount": 9,
        "fields": [
          {
            "name": "field577",
            "type": "text",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": true
          },
          {
            "name": "field578",
            "type": "text",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": false
          },
          {
            "name": "field579",
            "type": "text",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": false
          },
          {
            "name": "field580",
            "type": "number",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false
          },
          {
            "name": "field581",
            "type": "text",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": false
          },
          {
            "name": "field582",
            "type": "checkbox",
            "required": false,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": true,
            "enableSorting": false,
            "enableHiding": true,
            "defaultValue": false
          },
          {
            "name": "field583",
            "type": "text",
            "required": true,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false,
            "hasSearchIndex": false
          },
          {
            "name": "field584",
            "type": "number",
            "required": false,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false
          },
          {
            "name": "field585",
            "type": "number",
            "required": false,
            "hidden": false,
            "readOnly": false,
            "position": "main",
            "cellAlignment": "left",
            "hasValidate": false,
            "hasIndex": false,
            "enableSorting": false,
            "enableHiding": true,
            "hasMask": false
          }
        ],
        "hasDrafts": false,
        "hasLivePreview": false,
        "indexCount": 0,
        "timestamps": true,
        "savedViewCount": 0,
        "defaultSortIsCustom": false,
        "bulkDelete": true,
        "hookCounts": {
          "beforeChange": 0,
          "beforeDelete": 0,
          "afterChange": 0,
          "afterDelete": 0
        },
        "storageAdapterKind": "presigned-url"
      }
    ],
    "features": {
      "drafts": true,
      "livePreview": true,
      "conditions": true,
      "slots": true,
      "inputMasks": true,
      "localization": false,
      "auth": true,
      "authAdapter": "betterAuth",
      "access": {
        "enabled": true,
        "roleCount": 5,
        "ruleCount": 102,
        "fieldPermissionRuleCount": 0,
        "queryConstraintRuleCount": 10,
        "callbackRuleCount": 19,
        "customActionCount": 2,
        "customResourceCount": 2,
        "organizations": false
      },
      "hookCount": 0
    },
    "storageAdapterKinds": [
      "presigned-url"
    ]
  }
}
```

Note this example has no `timings` key: `vex telemetry status --json` shows what the
anonymized config payload would look like, not an actual `vex dev` run's measured timings, so
`timings` is only ever present on a real `dev` event sent from a live `vex dev` process.

## What is never sent

- Collection, field, global or block **names**, or any other project-specific string (labels,
  descriptions, defaults, regex patterns, URLs, option values, mask patterns).
- Document or media **content** of any kind.
- File system **paths** — only a one-way hash derived from the resolved project path (see
  below), never the path itself.
- Your **git remote**, repository URL, or any VCS metadata.
- Your **IP address** — the ingest endpoint never reads or stores request headers used for
  IP identification.
- Environment variables, other than the telemetry control vars themselves, are never read or
  sent.
- Any **user identity**: name, email, account, or organization.
- **Error messages, stack traces, or caught error details** of any kind — only the coarse
  `outcome.stage`/`outcome.errorCode` categories above. Convex push/deploy failures are never
  reported.

## Anonymous ids

Two ids appear in every payload, and neither can be reversed to a real name or path:

- `machineId` — a random id (`crypto.randomUUID()`) generated once and stored in your local
  settings file. It identifies "the same machine sent this," nothing more.
- `projectId` — a SHA-256 hash of a per-machine random salt plus the resolved
  (`realpath`-ed) absolute path of the project directory. It lets us tell "this is the same
  project run twice" without the project path, salt, or machine id ever leaving your machine
  in reversible form. A different machine (different salt) produces a different id for the
  same project. Because the id is stable per project per machine, repeated runs of one
  project from the same directory share a `projectId` by design — this is how repeat runs are
  not double-counted, not a one-time nonce. It cannot be correlated across machines (different
  salts) or back to a path or identity without access to your local settings file, which never
  leaves your machine.

## Retention and access

Events are retained **indefinitely** in the vendor-owned Convex deployment that receives
them. Only the VexCMS maintainers (the vendor) can read this data — it is never shared,
sold, or made available to any other party.

## Opting out

Telemetry can be disabled per machine, per invocation, or automatically:

| Method | Effect |
|---|---|
| `vex telemetry disable` | Stores `enabled: false` in the local settings file (`~/.config/vexcms/telemetry.json`, or under `$XDG_CONFIG_HOME` if set). Persists across runs. |
| `vex telemetry enable` | Re-enables after a prior `disable`. |
| `vex telemetry status [--json]` | Shows whether telemetry is enabled, why (reason), and the settings file path. With `--json`, prints the exact payload that would be sent for the current project, without sending it. |
| `DO_NOT_TRACK=1` (or any truthy value other than `0`/`false`) | Disables telemetry for that invocation, regardless of stored settings. Takes precedence over everything else. |
| `VEX_TELEMETRY_DISABLED=1` | Same effect as `DO_NOT_TRACK`, checked next. |
| CI environments | Telemetry is off automatically when a CI environment is detected — no action needed. |

Precedence, highest first: `DO_NOT_TRACK` → `VEX_TELEMETRY_DISABLED` → CI detection → the
stored `enabled` setting → on by default. None of the environment-variable overrides can
force telemetry *on* — they only ever turn it off.

## Debug mode

Set `VEX_TELEMETRY_DEBUG=1` to print the exact event payload that would be sent to stderr,
as formatted JSON, instead of sending it over the network:

```sh
VEX_TELEMETRY_DEBUG=1 vex dev
```

This is also the quickest way to see precisely what a given project would report without
waiting for `vex telemetry status --json` to finish a full config load.
````

Verify: `pnpm --filter docs build`

### Step 10 — Legal review and release gate [dev]

- [ ] [dev] Review the opt-out default, the `showTelemetryNotice` text (Step 5) and `guides/telemetry.mdx` (Step 9) under GDPR and CCPA
- [ ] [dev] Apply wording changes to `packages/telemetry/src/showTelemetryNotice.ts` (and its test's expected text) and the docs page
- [ ] [dev] Choose the receiver's final home (`apps/www` or a dedicated vexcms app), move the Step 8 collections, `convex/telemetry/` and the `/telemetry/events` route there, and set `DEFAULT_TELEMETRY_ENDPOINT` in `packages/telemetry/src/constants.ts` to its `.convex.site/telemetry/events` URL. Until then the constant points at a placeholder host, so a released CLI would send nothing anywhere
- [ ] [dev] Version the packages (`changeset version`; decide whether `@vexcms/telemetry` joins the `fixed` group in `.changeset/config.json`)

Verify: wording approved; `pnpm --filter @vexcms/telemetry test` and `pnpm --filter docs build` green after edits.

### Step 11 — Keep repo-internal runs out of telemetry [agent]

Why: `scripts/verify-scaffold.mjs` and `scripts/vex-dev.mjs` run `vex` against `apps/test` as part of the repo's own verification and local dev loop; neither run is a real project, so neither should emit a telemetry event.

- [ ] `scripts/verify-scaffold.mjs` (edit)
- [ ] `scripts/vex-dev.mjs` (edit)

#### scripts/verify-scaffold.mjs

1 edit — everything else unchanged.

**1 — `runStep`'s `spawnSync` call.** Add `env` so every subprocess this helper runs (including `vex dev`/`vex deploy` invocations elsewhere in this script) inherits a disabled telemetry flag:

```js
function runStep(label, command, args, cwd) {
  console.log(`  \u2192 ${label}`);
  const start = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, VEX_TELEMETRY_DISABLED: "1" },
  });
  const ok = result.status === 0;
  const ms = Date.now() - start;
  console.log(
    ok
      ? `  \u2713 ${label} (${ms}ms)`
      : `  \u2717 ${label} \u2014 exit ${result.status} (${ms}ms)`
  );
  return { label, ok, exitCode: result.status, ms };
}
```

#### scripts/vex-dev.mjs

1 edit — everything else unchanged.

**1 — the `spawn('node', [...])` call.** Add `env` beside the existing `cwd`/`stdio`:

```js
  vexProcess = spawn('node', ['packages/cli/dist/index.js', 'dev', '--cwd', 'apps/test'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, VEX_TELEMETRY_DISABLED: '1' }
  });
```

Verify: `CI= XDG_CONFIG_HOME=$(mktemp -d) VEX_TELEMETRY_DEBUG=1 node scripts/verify-scaffold.mjs 2>&1 | grep -c '\[vex telemetry\]'` prints `0` (`CI` cleared so the count is not zero merely because CI detection disabled telemetry).

## Verification

- `pnpm --filter @vexcms/telemetry --filter @vexcms/cli --filter create-vexcms run build`, then the same filters with `run test` and `run typecheck` (one script per `pnpm run`; extra words are forwarded to the script as arguments)
- `node scripts/check-packed-manifests.mjs --sweep` and `node scripts/verify-scaffold.mjs`
- Acceptance (stem): `secretProject` leak test green (Step 4); each off switch sends nothing (Steps 2, 5, 6); unreachable endpoint resolves ≤1.6s (Step 5); every payload key appears in the docs field table (Step 9)
- `pnpm --filter docs build`
- `CI= XDG_CONFIG_HOME=$(mktemp -d) VEX_TELEMETRY_DEBUG=1 node scripts/verify-scaffold.mjs 2>&1 | grep -c '\[vex telemetry\]'` prints `0` (Step 11)
