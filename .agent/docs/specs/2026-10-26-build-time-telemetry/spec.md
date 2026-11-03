---
status: draft
spec_id: 2026-10-26-build-time-telemetry
touches:
  - packages/telemetry/**
  - packages/cli/src/**
  - packages/cli/package.json
  - packages/create-vexcms/src/**
  - packages/create-vexcms/package.json
  - apps/telemetry/**
  - apps/docs/src/content/docs/guides/telemetry.mdx
  - .changeset/**
prompt_version: 1
---

# 2026-10-26-build-time-telemetry — Spec

## Overview

Launch-plan item **M**. The `vex` CLI and `create-vexcms` send one anonymous event per run, describing the **shape** of the project's vex config (with every name replaced by a number), the scaffold choices and the vex-owned timings. The goal is to aim 0.1.x work at what real projects build. The pattern follows Next.js, Astro and Turborepo: opt-out, a first-run notice, `DO_NOT_TRACK`, off in CI, and a public field list. Events go to `apps/telemetry`, a vendor-owned vexcms app. Input: `../2026-10-24-telemetry/stem.md` (T1–T9). Tier: low-care.

## Design Decisions

1. **One event per run, from `vex dev` (after the first generation only), `vex deploy` and `create-vexcms`.** `vex generate` sends nothing. Why: counts projects and command use without one event per watch reload.
2. **New published package `@vexcms/telemetry`, used by both CLIs.** Why: one notice, one settings file, one sender, so the two binaries can't drift.
3. **Payload = the allowlisted config shape with numbered names** (`collection1`, `field2`, `block3`). Booleans, numeric limits and known enum literals are kept. Select options become `optionCount`. Functions become `true`. Every other string and any unknown key is dropped. Why: keeps the config insight that bare counts lose; an allowlist means a new config key leaks nothing until it is reviewed.
4. **Names are dropped, never hashed.** Why: a hash of a guessable name can be reversed with a dictionary.
5. **Ids: a random `machineId`; `projectId` = sha256(per-machine random salt + realpath of the project).** Why: can't be reversed or linked across machines. The rejected option, a hash of the git remote with a global salt, would let anyone match public repos by hashing their URLs.
6. **Settings live at `$XDG_CONFIG_HOME/vexcms/telemetry.json` (fallback `~/.config/vexcms/telemetry.json`).** Precedence: `DO_NOT_TRACK` → `VEX_TELEMETRY_DISABLED` → CI → stored setting → default on. Env vars can only turn telemetry off. Why: the standard XDG location, and nothing in the environment can switch telemetry on against the user's setting.
7. **In-process `fetch` with a 1.5s `AbortSignal.timeout`; errors swallowed.** `dev` doesn't await; `deploy` and `create` await, bounded at 1.5s. Why: Next.js's detached-flush process has open leak reports ([#97716](https://github.com/vercel/next.js/issues/97716), [discussion #92805](https://github.com/vercel/next.js/discussions/92805)). `vex dev` lives long enough to finish an in-process send.
8. **Timings are vex-owned only:** `configLoadMs`, `schemaGenMs`, `schemaChanged`. Why: Convex push and deploy times mostly measure the network and Convex.
9. **`VEX_TELEMETRY_DEBUG=1` prints the payload and doesn't send; `VEX_TELEMETRY_ENDPOINT` overrides the URL; `vex telemetry status --json` prints the exact payload.** Why: local testing against `apps/telemetry`, and the transparency T8 promises.
10. **The receiver is `apps/telemetry`, a vexcms app.** An HTTP action at `POST /events` with a 32KB body cap, a `schemaVersion` check and a strict Convex validator; no IP is read or stored; a read-only `telemetryEvents` collection in the admin. No rate limiting. Why: isolated from the marketing site; spam is cleaned up during analysis.
11. **Retention is indefinite, documented on the docs page; only the vendor team can read the data.** Why: the payload is anonymous under decisions 3–5, so GDPR's storage-limitation rule doesn't apply. The docs page also states that a schema's shape is a fingerprint.
12. **Legal review is a `[dev]` gate before release, not before implementation.** Why: wording can change without code changes.

## Out of Scope

- `vex telemetry link` and any linking to a customer (post-0.1.0, opt-in, licence-bound; T9).
- Runtime, browser or Convex-deployment telemetry.
- Error and crash reporting.
- Dashboards and aggregation in `apps/telemetry` beyond the vex admin list view.
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
- [ ] `.changeset/telemetry-package-scaffold.md`

No other repo files change: `turbo.json` runs tasks by script name across every workspace package, so a new package is picked up automatically. The root `tsconfig.json` holds no `references` array (no project-reference graph in this repo), so nothing there needs the new package either. `.changeset/config.json`'s `fixed` group only lists packages that currently exist — it is edited once telemetry starts shipping version bumps alongside the others; a single new package with its own alpha changeset does not require joining that group yet, and `.changeset/pre.json` is maintained by the `changeset`/`changeset version` CLI itself, never hand-edited.

#### packages/telemetry/package.json

Mirrors `packages/cli/package.json`'s fields minus `bin`, and depends on nothing beyond Node built-ins and the global `fetch` — so no runtime `dependencies` at all. `@vexcms/core` is a type-only peer (per the shared contract), matched by a `workspace:*` devDependency per P-013/P-014.

```json
{
  "name": "@vexcms/telemetry",
  "version": "0.1.0-alpha.27",
  "description": "VexCMS anonymous build-time telemetry: settings, anonymization and the event sender shared by vex and create-vexcms",
  "keywords": [
    "cms",
    "headless-cms",
    "convex",
    "typescript",
    "telemetry"
  ],
  "license": "Apache-2.0",
  "author": "Isaiah Anyimi",
  "homepage": "https://docs.vexcms.dev",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ianyimi/vex.git",
    "directory": "packages/telemetry"
  },
  "sideEffects": false,
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
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
  },
  "publishConfig": {
    "access": "public",
    "tag": "alpha"
  }
}
```

#### packages/telemetry/tsup.config.ts

Same shape as `packages/cli/tsup.config.ts` minus the `banner` (this package ships no executable). Declarations come from the `tsc --emitDeclarationOnly` step in `build`, per P-011 / ADR-005.

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
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
  },
});
```

#### packages/telemetry/src/constants.ts

Every literal is a named constant per P-003; `TELEMETRY_ENV` centralizes the env var names so later steps never inline them.

```ts
export const TELEMETRY_SCHEMA_VERSION = 1;

export const TELEMETRY_DOCS_URL = "https://docs.vexcms.dev/guides/telemetry/";

export const DEFAULT_TELEMETRY_ENDPOINT = "https://telemetry.vexcms.dev/events";

export const TELEMETRY_TIMEOUT_MS = 1500;

export const TELEMETRY_MAX_BODY_BYTES = 32_768;

export const TELEMETRY_ENV = {
  doNotTrack: "DO_NOT_TRACK",
  disabled: "VEX_TELEMETRY_DISABLED",
  debug: "VEX_TELEMETRY_DEBUG",
  endpoint: "VEX_TELEMETRY_ENDPOINT",
  xdgConfigHome: "XDG_CONFIG_HOME",
} as const;

export const TELEMETRY_EVENTS = ["dev", "deploy", "create"] as const;
```

#### packages/telemetry/src/types.ts

Per the shared contract: every type this step owns, with `TelemetryEvent["config"]` left as `unknown` until step 4 narrows it to `AnonymizedConfig` (shown there as a numbered edit to this file).

```ts
import type { TELEMETRY_EVENTS, TELEMETRY_SCHEMA_VERSION } from "./constants";

export type TelemetryEnv = Record<string, string | undefined>;

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number];

export interface TelemetrySettings {
  enabled?: boolean;
  machineId: string;
  salt: string;
  noticeShownAt?: string;
}

export interface TelemetryEnvironment {
  vexVersions: Record<string, string>;
  nodeVersion: string;
  os: NodeJS.Platform;
  arch: string;
  packageManager: "pnpm" | "npm" | "yarn" | "bun" | "unknown";
}

export interface TelemetryTimings {
  configLoadMs: number;
  schemaGenMs: number;
  schemaChanged: boolean;
}

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

export interface TelemetryEvent {
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  event: TelemetryEventName;
  machineId: string;
  projectId: string;
  sentAt: string;
  environment: TelemetryEnvironment;
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

#### .changeset/telemetry-package-scaffold.md

Per P-025 (pre-release mode), every changeset is `patch`.

```markdown
---
"@vexcms/telemetry": patch
---

New `@vexcms/telemetry` package scaffold: constants, shared types, and the build/test/typecheck
setup shared by `vex` and `create-vexcms`'s upcoming anonymous build-time telemetry. No runtime
behavior yet — later steps in this spec add settings persistence, enablement checks, config
anonymization and the event sender.
```

Verify: `pnpm --filter @vexcms/telemetry build test typecheck` green; `scripts/check-packed-manifests.mjs --sweep` green.

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
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { machineId?: unknown }).machineId === "string" &&
    typeof (value as { salt?: unknown }).salt === "string"
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
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
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
      rmSync(linkPath, { force: true });
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
- [ ] `src/index.ts` — barrel-export `./anonymizeConfig`

Numbering scheme (binding on the implementer): collections, globals, media collections, and blocks each get their OWN counter (`collectionN`, `globalN`, `mediaN`, `blockN`), counted in the order they appear in `config.collections` / `config.globals` / `config.mediaCollections` / each `blocks()` field's `blocks` array as the whole config is walked depth-first (collections, then globals, then media collections). Fields share ONE counter (`fieldN`) across every resource and every nesting depth, incremented in the same depth-first traversal order, so a field inside an `array()` item or a block gets the next number exactly where it is encountered. `relationship()` and `upload()` targets are resolved through the already-assigned `collectionN` / `mediaN` name — never dropped, never the original slug — because collection and media names are assigned in a first pass (they don't depend on field traversal), before any field is visited.

#### packages/telemetry/src/types.ts

2 edits to the file Step 1 created — everything else unchanged.

**1 — new interfaces.** Add above the `TelemetryEvent` interface, and add `AdminFieldType, Alignment, ColorFormat, SelectDisplay, StorageAdapterProtocol` to the existing `import type { ... } from "@vexcms/core";` line (alongside `VexConfig`):

```ts
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
  format?: ColorFormat;
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
}

/** One anonymized media collection — an {@link AnonymizedResource} plus its storage adapter kind. */
export interface AnonymizedMediaCollection extends AnonymizedResource {
  storageAdapterKind?: StorageAdapterProtocol;
}

/**
 * Privacy-reviewed shape of `VexConfig` sent as `TelemetryEvent.config`.
 * Collection, global, media collection, and block NAMES are replaced with
 * `collectionN` / `globalN` / `mediaN` / `blockN`; field names with `fieldN`
 * — each counter running in traversal order (see Step 4's numbering scheme).
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
     * (richtext is deliberately locale-agnostic, design decision 1). Reserved
     * so the docs page and this shape don't change again the day core adds one.
     */
    localization: false;
    auth: boolean;
    access: { enabled: boolean; roleCount: number };
  };
  storageAdapterKinds: StorageAdapterProtocol[];
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
  ADMIN_FIELDS,
  type AdminDataField,
  type AdminField,
  type AdminUIField,
  type BlockConfig,
  type CollectionConfig,
  type GlobalConfig,
  type MediaCollectionConfig,
  type StorageAdapterProtocol,
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
  return Object.values(props.fields).map((field) => anonymizeField({ field, context: props.context }));
}

function anonymizeCollectionLike(props: {
  resource: CollectionConfig;
  name: string;
  context: AnonymizeContext;
}): AnonymizedResource {
  const { resource, name, context } = props;
  return {
    name,
    fieldCount: Object.keys(resource.fields).length,
    fields: anonymizeResourceFields({ fields: resource.fields, context }),
    hasDrafts: resource.versions.drafts,
    hasLivePreview: resource.admin.livePreview !== undefined,
    indexCount: resource.indexes?.length ?? 0,
  };
}

function anonymizeGlobal(props: { global: GlobalConfig; name: string; context: AnonymizeContext }): AnonymizedResource {
  const { global, name, context } = props;
  return {
    name,
    fieldCount: Object.keys(global.fields).length,
    fields: anonymizeResourceFields({ fields: global.fields, context }),
    hasDrafts: global.versions.drafts,
    hasLivePreview: global.admin.livePreview !== undefined,
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
      access: config.access
        ? { enabled: config.access.enabled, roleCount: config.access.roles.length }
        : { enabled: false, roleCount: 0 },
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
  array,
  blocks,
  checkbox,
  collapsible,
  color,
  date,
  defineBlock,
  defineCollection,
  defineConfig,
  defineGlobal,
  defineServerConfig,
  email,
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
        access: { enabled: false, roleCount: 0 },
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
    timestamps: false,
    fields: { name: text({ required: true, label: "Codename Phoenix" }) },
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

#### packages/telemetry/src/index.ts

1 edit — add, alongside the existing `export * from "./projectId";` line:

```ts
export * from "./anonymizeConfig";
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
- [ ] `packages/telemetry/src/index.ts`

#### packages/telemetry/src/collectEnvironment.ts

Reads the project's `package.json` for `@vexcms/*` / `create-vexcms` version strings and detects the package manager from a lockfile in `projectDir`, falling back to `npm_config_user_agent`.

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { TelemetryEnvironment } from "./types.js";

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
  };
}
```

#### packages/telemetry/src/collectEnvironment.test.ts

```ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectEnvironment } from "./collectEnvironment.js";

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
});
```

#### packages/telemetry/src/sendTelemetryEvent.ts

Fire-and-forget POST, bounded by `AbortSignal.timeout`. Every failure (network error, timeout, non-2xx) is swallowed — a command's exit code and timing must never depend on the network. `VEX_TELEMETRY_DEBUG` short-circuits to a stderr dump with no request.

```ts
import { DEFAULT_TELEMETRY_ENDPOINT, TELEMETRY_ENV, TELEMETRY_MAX_BODY_BYTES, TELEMETRY_TIMEOUT_MS } from "./constants.js";
import type { TelemetryEnv, TelemetryEvent } from "./types.js";

function isDebugEnabled(env: TelemetryEnv): boolean {
  const value = env[TELEMETRY_ENV.debug];
  return value !== undefined && value !== "0" && value !== "false" && value !== "";
}

/**
 * Sends one telemetry event over HTTP, never throwing and never delaying the
 * caller beyond {@link TELEMETRY_TIMEOUT_MS}. In debug mode the event is
 * printed to stderr instead of being sent.
 *
 * @param props.event The event to send.
 * @param props.env Environment used to resolve `VEX_TELEMETRY_ENDPOINT` and
 *   `VEX_TELEMETRY_DEBUG`.
 */
export async function sendTelemetryEvent(props: { event: TelemetryEvent; env: TelemetryEnv }): Promise<void> {
  if (isDebugEnabled(props.env)) {
    process.stderr.write(`[vex telemetry] ${JSON.stringify(props.event, null, 2)}\n`);
    return;
  }

  const endpoint = props.env[TELEMETRY_ENV.endpoint] ?? DEFAULT_TELEMETRY_ENDPOINT;
  const body = JSON.stringify(props.event);
  if (Buffer.byteLength(body, "utf8") > TELEMETRY_MAX_BODY_BYTES) {
    return;
  }

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
import { TELEMETRY_SCHEMA_VERSION } from "./constants.js";
import { sendTelemetryEvent } from "./sendTelemetryEvent.js";
import type { TelemetryEnv, TelemetryEvent } from "./types.js";

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
import { TELEMETRY_DOCS_URL, TELEMETRY_ENV } from "./constants.js";
import { writeTelemetrySettings } from "./settings.js";
import type { TelemetryEnv, TelemetrySettings } from "./types.js";

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
import { TELEMETRY_DOCS_URL } from "./constants.js";
import { showTelemetryNotice } from "./showTelemetryNotice.js";
import type { TelemetryEnv, TelemetrySettings } from "./types.js";

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
import { collectEnvironment } from "./collectEnvironment.js";
import { createProjectId } from "./projectId.js";
import { readTelemetrySettings } from "./settings.js";
import { sendTelemetryEvent } from "./sendTelemetryEvent.js";
import { showTelemetryNotice } from "./showTelemetryNotice.js";
import { isTelemetryEnabled } from "./isTelemetryEnabled.js";
import { TELEMETRY_SCHEMA_VERSION } from "./constants.js";
import { anonymizeConfig } from "./anonymizeConfig.js";
import type {
  TelemetryCreateOptions,
  TelemetryEnv,
  TelemetryEvent,
  TelemetryEventName,
  TelemetrySettings,
  TelemetryTimings,
} from "./types.js";
import type { VexConfig } from "@vexcms/core";

/**
 * Assembles the full telemetry payload for one event, deterministic given
 * its inputs so the CLI can also use it for `vex telemetry status --json`.
 *
 * @param props.event The event name.
 * @param props.projectDir Absolute path to the project directory.
 * @param props.settings The machine's telemetry settings.
 * @param props.config Optional loaded project config, anonymized when
 *   present.
 * @param props.timings Optional build/dev timing data.
 * @param props.create Optional `create-vexcms` scaffold options.
 * @returns The complete {@link TelemetryEvent}.
 */
export function buildTelemetryEvent(props: {
  event: TelemetryEventName;
  projectDir: string;
  settings: TelemetrySettings;
  config?: VexConfig;
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
    ...(props.config ? { config: anonymizeConfig({ config: props.config }) } : {}),
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
 * @param props.env Environment to resolve settings/enablement against;
 *   defaults to `process.env`.
 * @param props.config Optional loaded project config.
 * @param props.timings Optional build/dev timing data.
 * @param props.create Optional `create-vexcms` scaffold options.
 */
export async function recordTelemetryEvent(props: {
  event: TelemetryEventName;
  projectDir: string;
  env?: TelemetryEnv;
  config?: VexConfig;
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
import { TELEMETRY_SCHEMA_VERSION } from "./constants.js";
import { recordTelemetryEvent } from "./recordTelemetryEvent.js";
import type { TelemetryEnv } from "./types.js";

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

    await recordTelemetryEvent({ event: "dev", projectDir, env });

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

    await recordTelemetryEvent({ event: "dev", projectDir, env });

    expect(received.body).not.toContain(projectDir);
    const event = JSON.parse(received.body);
    expect(event.schemaVersion).toBe(TELEMETRY_SCHEMA_VERSION);
    expect(event.event).toBe("dev");
    expect(typeof event.projectId).toBe("string");

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
```

#### packages/telemetry/src/index.ts

Edits are additive: 4 new export lines beside the barrel entries from steps 1–4; nothing else in the file changes.

**1 — exports.** Add alongside the existing `anonymizeConfig` export line:

```ts
export * from "./collectEnvironment.js";
export * from "./sendTelemetryEvent.js";
export * from "./showTelemetryNotice.js";
export * from "./recordTelemetryEvent.js";
```

Verify: `pnpm --filter @vexcms/telemetry test -- collectEnvironment sendTelemetryEvent showTelemetryNotice recordTelemetryEvent`
</content>

### Step 6 — CLI wiring [agent]

Why: `vex dev` / `vex deploy` emit events; `vex telemetry` controls them.

- [ ] `packages/cli/package.json` depends on `@vexcms/telemetry` (`workspace:*`)
- [ ] `packages/cli/tsup.config.ts` marks `@vexcms/telemetry` external
- [ ] `packages/cli/src/commands/telemetry.ts`: `enable` / `disable` / `status [--json]`
- [ ] `packages/cli/src/commands/dev.ts`: time `loadConfig` and `generateAndWrite`, record one `dev` event after the first generation (not on reloads), don't await
- [ ] `packages/cli/src/commands/deploy.ts`: record a `deploy` event and await it (bounded at 1.5s) before exit
- [ ] `packages/cli/src/index.ts`: `telemetry` subcommand plus usage text

#### packages/cli/package.json

1 edit — everything else unchanged.

**1 — `dependencies`.** Add the new workspace dependency alongside the existing two:

```json
  "dependencies": {
    "@vexcms/telemetry": "workspace:*",
    "chokidar": "catalog:",
    "jiti": "catalog:"
  },
```

#### packages/cli/tsup.config.ts

1 edit — everything else unchanged.

**1 — `external`.** `@vexcms/telemetry` ships as a workspace package the same way `@vexcms/core` does — it must not be bundled into the CLI's dist output:

```ts
  external: ["@vexcms/core", "@vexcms/telemetry", "prettier"],
```

#### packages/cli/src/commands/telemetry.ts

New file. Implements `vex telemetry enable|disable|status [--json]`. `status --json` loads the project's config the same way `vex dev` does and prints the exact `dev`-event payload via `buildTelemetryEvent`, without sending it.

```ts
import { resolve } from "node:path";

import {
  buildTelemetryEvent,
  isTelemetryEnabled,
  readTelemetrySettings,
  resolveSettingsPath,
  writeTelemetrySettings,
} from "@vexcms/telemetry";

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
        const event = buildTelemetryEvent({ event: "dev", projectDir: cwd, settings, config });
        console.log(JSON.stringify(event, null, 2));
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

**1 — imports.** Add the `node:perf_hooks` import beside the existing `node:path` import, and the telemetry import above the local `../lib/*` imports:

```ts
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

import { recordTelemetryEvent } from "@vexcms/telemetry";

import { generateAndWrite, getOutputPath } from "../lib/generateSchema.js";
```

**2 — initial generation block.** Replace the body from `// Initial generation` through the end of the `if (result.written) { … }` block with timed versions, and fire the `dev` event once, right after:

```ts
  // Initial generation
  const configLoadStart = performance.now();
  let config = await loadConfig(configPath);
  const configLoadMs = performance.now() - configLoadStart;
  const outputPath = getOutputPath(config, cwd);

  const schemaGenStart = performance.now();
  const result = await generateAndWrite(config, cwd, configPath);
  const schemaGenMs = performance.now() - schemaGenStart;
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  void recordTelemetryEvent({
    event: "dev",
    projectDir: cwd,
    config,
    timings: { configLoadMs, schemaGenMs, schemaChanged: result.written },
  });
```

The `regenerate()` function later in the file (used by the file watcher on every change) is untouched, so reloads never record a second event.

#### packages/cli/src/commands/deploy.ts

2 edits — everything else unchanged.

**1 — imports.** Add the telemetry import above the local `../lib/*` imports:

```ts
import { recordTelemetryEvent } from "@vexcms/telemetry";

import { generateAndWrite } from "../lib/generateSchema.js";
```

**2 — end of `deployCommand`.** After the existing `logger.success("Deployed to production")`, record and await a `deploy` event before the function returns (the sender itself is bounded by `TELEMETRY_TIMEOUT_MS` = 1.5s and never rejects):

```ts
  logger.success("Deployed to production");

  await recordTelemetryEvent({
    event: "deploy",
    projectDir: cwd,
    config,
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

- [ ] `packages/create-vexcms/package.json`: add `@vexcms/telemetry` dependency
- [ ] `packages/create-vexcms/src/index.ts`: record a `create` event after `initProject` completes, awaited

#### packages/create-vexcms/package.json

1 edit — everything else unchanged. Add `@vexcms/telemetry` to `dependencies`, beside the other scoped package (`@inquirer/prompts`). `create-vexcms`'s `tsup` build (`tsup src/index.ts --format esm --dts`, no `tsup.config.ts`, no `noExternal`) externalizes every `node_modules` import by default, so `@vexcms/telemetry` is never bundled into `dist/index.js` — it has to resolve as a real `dependencies` entry at install time, same as `chalk` or `commander`. `workspace:*` is correct here (P-013: internal deps on siblings stay exact; only peer deps use `workspace:^`); `scripts/check-packed-manifests.mjs --packed` and `scripts/verify-scaffold.mjs` both pack every non-private `packages/*` directory and derive their tarball list dynamically (`readPublishablePackages`/`injectOverrides`), so `@vexcms/telemetry` is picked up automatically once Step 1 adds it — no hardcoded list to update.

```json
{
  "dependencies": {
    "chalk": "catalog:",
    "commander": "catalog:",
    "execa": "catalog:",
    "fs-extra": "catalog:",
    "@inquirer/prompts": "catalog:",
    "@vexcms/telemetry": "workspace:*",
    "ora": "catalog:",
    "sort-package-json": "catalog:",
    "validate-npm-package-name": "catalog:",
    "yaml": "catalog:"
  }
}
```

#### packages/create-vexcms/src/index.ts

2 edits — everything else unchanged.

**1 — import.** Beside the existing `import type { Framework, ProjectOptions } from './installers/types.js';` line, add:

```ts
import { recordTelemetryEvent } from '@vexcms/telemetry';
```

**2 — after `await installer.initProject(options);` in `main()`.** `template` follows the same `bare` flag `base.ts`/`nextjs.ts` already branch on (`options.bare` skips the marketing overlay — see `base.ts`'s `if (!options.bare)` guard), so it maps directly without introducing a new concept. `projectDir` is `targetDir`, the absolute path `fs.ensureDir` just created; it never appears in the emitted event (`recordTelemetryEvent` hashes it into `projectId` via `createProjectId`, Step 3) and `oauthProviders` only contributes a count, so the event carries no project name or path. The call is awaited and bounded by `sendTelemetryEvent`'s `TELEMETRY_TIMEOUT_MS` (1500 ms) — `recordTelemetryEvent` itself never rejects.

```ts
  console.log();
  await installer.initProject(options);

  await recordTelemetryEvent({
    event: 'create',
    projectDir: targetDir,
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

### Step 8 — `apps/telemetry` ingest app (vexcms) [agent + dev]

Why: T7. A vendor-owned receiver with a read-only admin.

`create-vexcms` is invoked with `--monorepo --bare --yes`: `--bare` skips the
marketing-site collection overlay (the scaffold is the `base-nextjs` template —
`src/vexcms/collections/{images,users}.ts`, `src/auth/access.ts` scoped to
`images`/`users`, `convex/http.ts` with only the Better Auth catch-all route),
`--yes` accepts every prompt default (`framework: "nextjs"`, `emailPasswordAuth:
true`, `orgs: false`, `initGit: true`, `installDependencies: false`), and
`--monorepo` resolves the target to `apps/telemetry` under the detected
`pnpm-workspace.yaml` root and rewrites dependencies to `workspace:`/`catalog:`
protocols. `installPackageName` is derived from the positional arg
(`updatePackageName`, `packages/create-vexcms/src/installers/base.ts:160`), so
`apps/telemetry/package.json`'s `"name"` is already `"telemetry"` after the
scaffold runs — no manual rename, matching the existing bare names
(`"test"`, `"docs"`) the `.changeset/config.json` `ignore` array already uses.

`apps/telemetry`'s Convex functions (`convex/events.ts`, `convex/http.ts`)
cannot depend on `@vexcms/telemetry`: the package's `settings.ts` and
`projectId.ts` import `node:fs`/`node:os`/`node:crypto`, and Convex's default
(non-`"use node"`) runtime — the only runtime `internalMutation` and
`httpAction` bodies that call `ctx.db` can run in — does not support Node
built-ins; a bundled-but-unused import would still break if Convex's bundler
tried to resolve those specifiers. `TELEMETRY_SCHEMA_VERSION` (`1`) and
`TELEMETRY_MAX_BODY_BYTES` (`32_768`) are inlined as local constants in both
files instead, matching how `apps/test/convex/schema.ts` already inlines
`vex`-internal literals rather than importing them from `packages/core`.

`convex/schema.ts` and `convex/vex.schema.ts` are **not** hand-edited: once
`telemetryEvents` is added to `vex.config.ts`'s `collections` array, the
`[dev]`-run `vex deploy` (`packages/cli/src/commands/deploy.ts` →
`generateAndWrite`) regenerates `vex.schema.ts` and syncs the import list and
`defineSchema({ … })` body of `convex/schema.ts` automatically
(`packages/cli/src/lib/generateSchema.ts:229`, `syncSchemaImports`) — the
table name is the collection's bare `slug` (`telemetryEvents`), no `vex_`
prefix (that prefix is reserved for the two framework-internal tables
`vex_globals`/`vex_versions`, hardcoded in
`packages/core/src/schema/generateVexSchema.ts`). `pnpm-workspace.yaml`
already globs `apps/*` and `turbo.json`'s tasks are global — neither needs an
edit for a new app.

#### apps/telemetry

- [ ] [agent] Scaffold the app and install it into the workspace:
  ```sh
  pnpm --filter create-vexcms build
  node packages/create-vexcms/dist/index.js telemetry --monorepo --bare --yes
  pnpm install
  ```
  (Published equivalent once `create-vexcms` ships: `pnpm create vexcms@alpha
  telemetry --monorepo --bare --yes`.) The installer refuses to scaffold if
  `apps/telemetry` already exists and prints `Run 'pnpm install' from
  <workspaceRoot> to link the new workspace member.` — `pnpm install` is run
  because `--yes` resolves `installDependencies` to `false`.

#### .changeset/config.json

- [ ] [agent] Add `"telemetry"` to the `ignore` array, alongside the existing
  `"test"`/`"docs"` entries (changesets matches on each app's `package.json`
  `"name"`, not its directory path) — `apps/telemetry` is never published, the
  same reasoning as `apps/test` (P-020).

  1 edit — the `ignore` array.

  ```json
  "ignore": [
    "@vexcms/tsconfig",
    "test",
    "docs",
    "telemetry"
  ],
  ```

#### apps/telemetry/src/db/constants/index.ts

- [ ] [agent] Add the telemetry table slug.

  1 edit — below the existing `TABLE_SLUG_IMAGES` constant.

  ```ts
  export const TABLE_SLUG_TELEMETRY_EVENTS = "telemetryEvents" as const
  ```

#### apps/telemetry/src/vexcms/collections/telemetryEvents.ts

- [ ] [agent] New collection, fields mirroring `TelemetryEvent`. `config`,
  `environment`, `timings` and `create` are `json()` (no shape enforcement at
  the schema level — `anonymizeConfig`/`collectEnvironment` own their shapes).
  `receivedAt` is `date()` (stored as `v.number()`, a Unix-ms timestamp set by
  `convex/events.ts`, never sent by the client); `sentAt` is the client-set
  ISO string from the payload and stays `text()`.

  ```ts
  import { date, defineCollection, json, number, select, text } from "@vexcms/core"

  import { TABLE_SLUG_TELEMETRY_EVENTS } from "~/db/constants"

  export const telemetryEvents = defineCollection({
    slug: TABLE_SLUG_TELEMETRY_EVENTS,
    interfaceName: "TelemetryEvent",
    labels: {
      singular: "Telemetry Event",
      plural: "Telemetry Events",
    },
    admin: {
      useAsTitle: "event",
      icon: "Radar",
    },
    fields: {
      schemaVersion: number({
        label: "Schema Version",
        required: true,
      }),
      event: select({
        label: "Event",
        required: true,
        options: [
          { label: "Dev", value: "dev" },
          { label: "Deploy", value: "deploy" },
          { label: "Create", value: "create" },
        ],
      }),
      machineId: text({
        label: "Machine ID",
        required: true,
      }),
      projectId: text({
        label: "Project ID",
        required: true,
      }),
      sentAt: text({
        label: "Sent At",
        required: true,
        description: "ISO timestamp set by the sending CLI.",
      }),
      environment: json({
        label: "Environment",
        required: true,
      }),
      config: json({
        label: "Config",
      }),
      timings: json({
        label: "Timings",
      }),
      create: json({
        label: "Create Options",
      }),
      receivedAt: date({
        label: "Received At",
        required: true,
        description: "Set by convex/events.ts on insert; never sent by the client.",
      }),
    },
  })
  ```

#### apps/telemetry/src/vexcms/collections/index.ts

- [ ] [agent] Barrel export.

  1 edit — add alongside the existing exports.

  ```ts
  export * from "./telemetryEvents"
  ```

#### apps/telemetry/src/vex.config.ts

- [ ] [agent] Register the collection.

  2 edits.

  **1 — import, beside the existing `images, users` import.**
  ```ts
  import { images, telemetryEvents, users } from "~/vexcms/collections"
  ```

  **2 — `collections` array in `defineConfig({ … })`.**
  ```ts
    collections: [users, telemetryEvents],
  ```

#### apps/telemetry/src/auth/access.ts

- [ ] [agent] Read-only admin: every role is denied `create`/`update`/`delete`
  on `telemetryEvents`; `admin` keeps `read` (the inserting write path is
  `convex/events.ts`'s `internalMutation`, which calls `ctx.db.insert`
  directly and never goes through this access-gated layer, so the deny here
  only affects the admin panel and the public `vex` CRUD api).

  3 edits.

  **1 — import, beside the existing `images, users` import.**
  ```ts
  import { images, telemetryEvents, users } from "~/vexcms/collections"
  ```

  **2 — `resources` array.**
  ```ts
    resources: [images, users, telemetryEvents],
  ```

  **3 — `[USER_ROLES.admin]` permissions entry.**
  ```ts
      [USER_ROLES.admin]: {
        "*": true,
        telemetryEvents: {
          "*": false,
          read: true,
        },
      },
  ```

#### apps/telemetry/convex/events.ts

- [ ] [agent] New file. `TELEMETRY_EVENT_NAMES` is inlined (see note above);
  `insert` is a plain `internalMutation` from `./_generated/server`, not the
  hook-wrapped `vexInternalMutation` (`apps/test/convex/vex.ts`'s
  `createVexMutations` pattern) — a telemetry row has no `afterChange`/
  `afterDelete` hooks to fire.

  ```ts
  import { v } from "convex/values"

  import { internalMutation } from "./_generated/server"

  const TELEMETRY_EVENT_NAMES = ["dev", "deploy", "create"] as const

  /** Inserts one ingested telemetry event; `receivedAt` is server-set. */
  export const insert = internalMutation({
    args: {
      schemaVersion: v.number(),
      event: v.union(...TELEMETRY_EVENT_NAMES.map((name) => v.literal(name))),
      machineId: v.string(),
      projectId: v.string(),
      sentAt: v.string(),
      environment: v.any(),
      config: v.optional(v.any()),
      timings: v.optional(v.any()),
      create: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
      await ctx.db.insert("telemetryEvents", { ...args, receivedAt: Date.now() })
    },
  })
  ```

#### apps/telemetry/convex/http.ts

- [ ] [agent] Add the ingest route. The handler never reads
  `x-forwarded-for`/`x-real-ip` or any other header for the caller's IP — only
  `content-length`, for the size check — so no IP ever reaches the stored
  document. No CORS headers: the endpoint is called by the `vex`/`create-vexcms`
  CLIs over `fetch`, never a browser, so no preflight is needed.

  1 edit — 1 new import plus 1 new `http.route({ … })` registration, both
  added above the existing `export default http`.

  **1 — imports, beside the existing `httpAction` import.**
  ```ts
  import { internal } from "./_generated/api"
  ```

  **2 — after the existing POST `/api/auth/` route registration, before `export default http`.**
  ```ts
  const TELEMETRY_SCHEMA_VERSION = 1
  const TELEMETRY_MAX_BODY_BYTES = 32_768

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

    if (
      typeof body !== "object" ||
      body === null ||
      (body as { schemaVersion?: unknown }).schemaVersion !== TELEMETRY_SCHEMA_VERSION
    ) {
      return new Response(null, { status: 400 })
    }

    try {
      await ctx.runMutation(internal.events.insert, body as Record<string, unknown>)
    } catch {
      return new Response(null, { status: 400 })
    }

    return new Response(null, { status: 204 })
  })

  http.route({
    handler: telemetryEventsHandler,
    method: "POST",
    path: "/events",
  })
  ```

#### packages/telemetry/src/constants.ts

- [ ] [dev] Create the Convex deployment and deploy `apps/telemetry`, then
  point the CLI's default endpoint at it.

  ```sh
  cd apps/telemetry
  npx convex dev --once --configure new   # first-time only: links a Convex deployment
  pnpm exec vex deploy                    # generates/syncs the schema and runs `convex deploy`
  ```

  Read the deployment's HTTP Actions URL from the Convex dashboard (or
  `npx convex env get CONVEX_SITE_URL` from `apps/telemetry`) — it has the
  form `https://<deployment-name>.convex.site`.

  1 edit — replace the placeholder endpoint.

  ```ts
  export const DEFAULT_TELEMETRY_ENDPOINT = "https://<deployment-name>.convex.site/events"
  ```

Verify: `curl -i -X POST https://<deployment-name>.convex.site/events -H "Content-Type: application/json" -d '{"schemaVersion":1,"event":"dev","machineId":"m1","projectId":"p1","sentAt":"2026-10-26T00:00:00.000Z","environment":{"vexVersions":{},"nodeVersion":"v20.0.0","os":"darwin","arch":"arm64","packageManager":"pnpm"}}'` → `204` and a new row visible (read-only) in `apps/telemetry`'s admin at `/telemetryEvents`; same request with `"schemaVersion":2` → `400`; same request with a `"padding"` string long enough to push the body past 32768 bytes (e.g. `node -e 'console.log(JSON.stringify({schemaVersion:1,event:"dev",machineId:"m1",projectId:"p1",sentAt:"2026-10-26T00:00:00.000Z",environment:{},padding:"a".repeat(33000)}))'` piped into `-d @-`) → `413`; the stored document has no IP field.

### Step 9 — Public docs page [agent]
Why: T8. Every field sent is listed publicly.

- [ ] `apps/docs/src/content/docs/guides/telemetry.mdx`

#### apps/docs/src/content/docs/guides/telemetry.mdx

New guide. The `guides` sidebar group is `autogenerate: { directory: 'guides' }` in
`apps/docs/astro.config.mjs`, so this file needs no manual sidebar entry — it appears
automatically, sorted by its `title`. The example payload below is a placeholder; during
implementation it MUST be regenerated by running `vex telemetry status --json` against
`apps/test` and pasted in verbatim, since `anonymizeConfig` (step 4) owns the exact field
allowlist and this page has to match it exactly, not approximate it.

````mdx
---
title: Telemetry
description: What vex and create-vexcms send, why, how to opt out, and the exact payload shape.
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
| `dev` | `vex dev` | Once, after the first successful config load + schema generation. Not sent again on later file-watch reloads in the same process. Fire-and-forget — `vex dev` does not wait on it. |
| `deploy` | `vex deploy` | Once per deploy, awaited (bounded to ~1.5s) before the process exits. |
| `create` | `create-vexcms` | Once, after project scaffolding finishes. Awaited (bounded) before the CLI exits. |

Each event is one HTTP POST. There is no session concept and no batching.

## The first-run notice

The first time any of the three commands run on a machine, a one-time notice is printed to
stderr: what is collected, a link to this page, and how to disable telemetry. It is never
shown again on that machine (a timestamp is stored locally) and it never blocks or delays the
command.

## Field reference

Every event shares this envelope:

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | `number` | Payload schema version (currently `1`). Bumped, never silently changed, if the shape changes. |
| `event` | `"dev" \| "deploy" \| "create"` | Which command sent the event. |
| `machineId` | `string` | A random id generated once per machine on first run. Not derived from any hardware identifier. |
| `projectId` | `string` | A per-machine, per-project anonymous id — see [Anonymous ids](#anonymous-ids). |
| `sentAt` | `string` | ISO-8601 timestamp of when the event was sent. |
| `environment` | `object` | Runtime environment — see below. |
| `config` | `object \| undefined` | Anonymized project config, present when a `vex.config.ts` was loaded — see [Config payload](#config-payload). |
| `timings` | `object \| undefined` | Build timings, present on `dev` events. |
| `create` | `object \| undefined` | Scaffold choices, present on `create` events. |

### `environment`

| Field | Type | Description |
|---|---|---|
| `vexVersions` | `Record<string, string>` | Installed version of every `@vexcms/*` and `create-vexcms` package in the project's `package.json`, as written (e.g. `"^0.1.0"`). |
| `nodeVersion` | `string` | `process.version`. |
| `os` | `string` | `process.platform` (e.g. `"darwin"`, `"linux"`, `"win32"`). |
| `arch` | `string` | `process.arch` (e.g. `"arm64"`, `"x64"`). |
| `packageManager` | `"pnpm" \| "npm" \| "yarn" \| "bun" \| "unknown"` | Detected from the project's lockfile, falling back to `npm_config_user_agent`. |

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
never its content:

- Collections, globals, blocks and fields are renamed to generated, numbered placeholders
  (`collection1`, `global1`, `block1`, `field1`, …) in a stable order — never their real names.
- Every field reports its `type` (e.g. `"text"`, `"richText"`, `"relationship"`) and only
  allowlisted booleans, numbers and enum options for that type (e.g. `required`,
  `localized`, a relationship's `hasMany`). Any string value a field can hold (defaults,
  labels, descriptions, regex patterns, URLs) is dropped entirely.
- `select` / `radio` fields report an `optionCount` (how many options were configured), never
  the option values themselves.
- Validator and hook functions on a field report as the boolean `true` (a function was
  configured) — never their source or return values.
- Top-level config reports feature flags and counts only: versions/drafts enabled,
  live preview enabled, conditional fields/slots/input masks in use, localization enabled,
  which auth adapter and storage adapter *kinds* are configured (e.g. `"better-auth"`,
  `"convex-file-storage"`), and counts of collections/globals/blocks.

Any config key not on this allowlist is silently dropped, not sent as-is.

#### Example payload

Regenerated from `vex telemetry status --json` run against `apps/test` (do not hand-edit;
re-run the command and paste the output here whenever the schema changes):

```json
{
  "schemaVersion": 1,
  "event": "dev",
  "machineId": "3f1b1e2a-2b3e-4f90-9c3a-7c2a6d9e4b11",
  "projectId": "8d9a6a1f4e3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9988776655443322",
  "sentAt": "2026-10-26T18:04:12.000Z",
  "environment": {
    "vexVersions": {
      "@vexcms/core": "^0.1.0",
      "@vexcms/next": "^0.1.0",
      "@vexcms/react": "^0.1.0"
    },
    "nodeVersion": "v22.9.0",
    "os": "darwin",
    "arch": "arm64",
    "packageManager": "pnpm"
  },
  "config": {
    "collections": [
      {
        "name": "collection1",
        "fields": [
          { "name": "field1", "type": "text", "required": true, "localized": false },
          { "name": "field2", "type": "richText", "required": false },
          { "name": "field3", "type": "select", "optionCount": 3, "required": true },
          { "name": "field4", "type": "relationship", "hasMany": false, "required": false }
        ],
        "versions": true,
        "drafts": true
      }
    ],
    "globals": [],
    "blocks": [],
    "features": {
      "livePreview": true,
      "localization": false,
      "conditions": true,
      "slots": false,
      "inputMasks": false
    },
    "auth": { "kind": "better-auth" },
    "storage": { "kind": "convex-file-storage" },
    "counts": { "collections": 1, "globals": 0, "blocks": 0 }
  },
  "timings": {
    "configLoadMs": 42,
    "schemaGenMs": 118,
    "schemaChanged": true
  }
}
```

## What is never sent

- Collection, field, global or block **names**, or any other project-specific string (labels,
  descriptions, defaults, regex patterns, URLs).
- Document or media **content** of any kind.
- File system **paths** — only a one-way hash derived from the resolved project path (see
  below), never the path itself.
- Your **git remote**, repository URL, or any VCS metadata.
- Your **IP address** — the ingest endpoint never reads or stores request headers used for
  IP identification.
- Environment variables, other than the telemetry control vars themselves, are never read or
  sent.
- Any **user identity**: name, email, account, or organization.

## Anonymous ids

Two ids appear in every payload, and neither can be reversed to a real name or path:

- `machineId` — a random id (`crypto.randomUUID()`) generated once and stored in your local
  settings file. It identifies "the same machine sent this," nothing more.
- `projectId` — a SHA-256 hash of a per-machine random salt plus the resolved
  (`realpath`-ed) absolute path of the project directory. It lets us tell "this is the same
  project run twice" without the project path, salt, or machine id ever leaving your machine
  in reversible form. A different machine (different salt) produces a different id for the
  same project.

### Fingerprint caveat

`projectId` is stable for a given project on a given machine, so if you run `vex dev` from
the same directory on the same machine many times, those events share a `projectId`. This is
intentional — it is how repeat runs of one project are not double-counted — but it does mean
the id is a per-machine, per-path fingerprint, not a one-time nonce. It cannot be correlated
across machines (different salts) or back to a path or identity without access to your local
settings file, which never leaves your machine.

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
| `DO_NOT_TRACK=1` (or any truthy value other than `0`/`false`) | Disables telemetry for that invocation, regardless of stored settings. Takes precedence over everything except nothing — it is checked first. |
| `VEX_TELEMETRY_DISABLED=1` | Same effect as `DO_NOT_TRACK`, checked next. |
| CI environments | Telemetry is off automatically when a CI environment is detected — no action needed. |

Precedence, highest first: `DO_NOT_TRACK` → `VEX_TELEMETRY_DISABLED` → CI detection → the
stored `enabled` setting → on by default.

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

### Step 10 — Legal review [dev]

- [ ] [dev] Review the opt-out default, the `showTelemetryNotice` text (Step 5) and `guides/telemetry.mdx` (Step 9) under GDPR and CCPA
- [ ] [dev] Apply wording changes to `packages/telemetry/src/showTelemetryNotice.ts` (and its test's expected text) and the docs page

Verify: wording approved; `pnpm --filter @vexcms/telemetry test` and `pnpm --filter docs build` green after edits.

## Verification

- `pnpm --filter @vexcms/telemetry --filter @vexcms/cli --filter create-vexcms build test typecheck`
- `node scripts/check-packed-manifests.mjs --sweep` and `node scripts/verify-scaffold.mjs`
- Acceptance (stem): `secretProject` leak test green (Step 4); each off switch sends nothing (Steps 2, 5, 6); unreachable endpoint resolves ≤1.6s (Step 5); every payload key appears in the docs field table (Step 9)
- `pnpm --filter docs build`
