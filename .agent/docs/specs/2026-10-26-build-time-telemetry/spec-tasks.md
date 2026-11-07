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

# 2026-10-26-build-time-telemetry — Tasks

Launch-plan item **M**. Stem: `../2026-10-24-telemetry/stem.md` (T1–T9). Tier: low-care (full code, agent implements).

## Step 1 — `@vexcms/telemetry` package scaffold [agent]
Why: `vex` and `create-vexcms` share one notice, one settings file and one sender; the package has to exist before either can use it.
Verify: `pnpm --filter @vexcms/telemetry run build && pnpm --filter @vexcms/telemetry run test && pnpm --filter @vexcms/telemetry run typecheck && node scripts/check-packed-manifests.mjs --sweep` green.
- [x] `packages/telemetry/` with `package.json` (no deps beyond node built-ins, `catalog:` devDeps), `tsup.config.ts`, `tsconfig{,.build,.check}.json`, `vitest.config.ts` copied from `packages/cli`
- [x] `src/constants.ts`: `TELEMETRY_SCHEMA_VERSION = 1`, `TELEMETRY_DOCS_URL`, `DEFAULT_TELEMETRY_ENDPOINT`, `TELEMETRY_TIMEOUT_MS = 1500`, env var names
- [x] `src/types.ts`: `TelemetryEvent` gains `outcome: { status: "ok" } | { status: "failed"; stage: TelemetryFailureStage; errorCode: TelemetryErrorCode }`; `TELEMETRY_FAILURE_STAGES` as const (`resolveConfig` / `loadConfig` / `generateSchema` for dev/deploy, `scaffold` for create) and `TELEMETRY_ERROR_CODES` as const; `TelemetryEnvironment` gains `framework: "next" | "tanstack" | "unknown"`
- [x] `src/index.ts` barrel

## Step 2 — Settings file and enablement [agent]
Why: every later step asks "may I send?" and needs the machine settings file.
Verify: `pnpm --filter @vexcms/telemetry exec vitest run src/settings.test.ts src/isCi.test.ts src/isTelemetryEnabled.test.ts && pnpm --filter @vexcms/telemetry run typecheck` green.
- [x] `src/settings.ts`: `resolveSettingsPath(env)` (`$XDG_CONFIG_HOME/vexcms/telemetry.json`, else `~/.config/vexcms/telemetry.json`); `readTelemetrySettings` / `writeTelemetrySettings`; the file holds `{ enabled?, machineId, salt, noticeShownAt? }`, created with random `machineId` + `salt` on first read; a corrupt or unwritable file is treated as missing
- [x] `src/isTelemetryEnabled.ts`: `DO_NOT_TRACK`, `VEX_TELEMETRY_DISABLED`, and CI detection (`src/isCi.ts`: `CI`, `CONTINUOUS_INTEGRATION`, `BUILD_NUMBER`, `GITHUB_ACTIONS`, `GITLAB_CI`, `VERCEL`, `NETLIFY`, …) take precedence over the stored `enabled`; default on; env vars can only turn it off. Returns `{ enabled, reason }` for `status`
- [x] Tests: each env switch → off; stored `false` → off; env `VEX_TELEMETRY_DISABLED=0` does not override stored `false`

## Step 3 — Anonymous ids [agent]
Why: T6, so repeat runs of one project aren't double-counted, without anything linkable.
Verify: `pnpm --filter @vexcms/telemetry exec vitest run src/projectId.test.ts && pnpm --filter @vexcms/telemetry run typecheck` green.
- [x] `src/projectId.ts`: `createProjectId(salt, projectDir)` = sha256(salt + realpath(projectDir)), hex; same input → same id; different salt → different id

## Step 4 — Anonymized config payload [agent]
Why: T5 plus the interview decision: full config shape with numbered names and allowlisted keys only.
Verify: `pnpm --filter @vexcms/telemetry exec vitest run src/anonymizeConfig.test.ts && pnpm --filter @vexcms/telemetry run typecheck` green, including the leak test.
- [x] `src/types.ts`: `TelemetryEvent` (`schemaVersion`, `event: "dev" | "deploy" | "create"`, `machineId`, `projectId`, `sentAt`, `environment` {vexVersions, nodeVersion, os, arch, packageManager, framework}, `outcome`, `config?`, `timings?`, `create?`); `AnonymizedResource` gains `hookCounts` keyed by the resolved lifecycle hook names (`beforeChange`/`beforeDelete`/`afterChange`/`afterDelete`); `features` gains `hookCount` (total handlers), `authAdapter: "none" | "betterAuth" | "custom"` (from `config.auth.adapter.name`, allowlisted), and an expanded `access` detail — `enabled`, `roleCount`, `ruleCount`, `fieldPermissionRuleCount`, `queryConstraintRuleCount`, `callbackRuleCount`, `customActionCount`, `customResourceCount`, `organizations`
- [x] `src/anonymizeConfig.ts`: `anonymizeConfig(config: VexConfig)`. Collections, globals, media collections and blocks become `collection1`… / `global1`… / `block1`…, fields `field1`…. Per field: `type`, allowlisted booleans and numbers, allowlisted enum options (including `commitTs`'s `on`/`format`); select/radio options → `optionCount`; functions → `true`; every other string is dropped. Data fields also carry `enableSorting`/`enableHiding` (never `columnWidth`). The framework-injected `updatedAt` `commitTs` field (key `"updatedAt"`, not `meta.locked`) is excluded from `fields`/`fieldCount`/the field counter; `AnonymizedResource` instead carries `timestamps: boolean`. Collections and media (not globals) also carry `savedViewCount`, `defaultSortIsCustom`, `bulkDelete`. Top level: feature flags (versions/drafts, livePreview, conditions, slots, input masks, localization, auth, access, storage adapter kinds), counts
- [x] Leak test: a config with names like `secretProject`, labels, defaults, select options, regex, URLs, descriptions and a saved view name/where. Collect every string in the payload and assert each one is an allowlisted literal (field type, enum value, generated name, version or os) and none is a secret; include one resource without `timestamps: false`
- [x] Unknown field key → dropped (test)
- [x] A collection without `timestamps: false` → `timestamps: true`, no `updatedAt`-derived field, unchanged `fieldCount` (test)
- [x] A user-declared `commitTs({ on: "publish", admin: { format: "relative" } })` survives with those values (test)
- [x] Access leak/shape test: a `defineAccess` config with one boolean rule, one field-permission-map rule, one query-constraint rule (`where`), one callback rule, a custom resource and custom actions — exact counts for every `access` key
- [x] Hook count test: a collection/global declaring `beforeChange`/`afterChange` (and `beforeDelete`/`afterDelete` on the collection) — exact `hookCounts` and `features.hookCount`

## Step 5 — Sender and first-run notice [agent]
Why: T2, T7, T8. Telemetry never delays or fails a command.
Verify: `pnpm --filter @vexcms/telemetry run test && pnpm --filter @vexcms/telemetry run typecheck && pnpm --filter @vexcms/telemetry run build` green: an unreachable endpoint resolves in ≤1.6s without throwing; debug mode prints and makes no request.
- [x] `src/sendTelemetryEvent.ts`: `fetch` POST with `AbortSignal.timeout(TELEMETRY_TIMEOUT_MS)`; all errors swallowed; `VEX_TELEMETRY_ENDPOINT` override; `VEX_TELEMETRY_DEBUG=1` prints JSON to stderr and does not send
- [x] `src/showTelemetryNotice.ts`: printed once per machine (stamps `noticeShownAt`), links `TELEMETRY_DOCS_URL`, shows how to disable
- [x] `src/recordTelemetryEvent.ts`: one entry point (`isTelemetryEnabled` → notice → build event → send) returning the send promise; `buildTelemetryEvent`/`recordTelemetryEvent` props gain `outcome`
- [x] `src/collectEnvironment.ts`: detects `environment.framework` from the project's `package.json` dependencies (`next` → `"next"`, `@tanstack/react-start` → `"tanstack"`, else `"unknown"`)
- [x] `src/classifyTelemetryError.ts`: `classifyTelemetryError({ error })` maps a caught error's `name` against an allowlist of core's config-error class names (`VexConfigError`, `VexAccessConfigError`, `VexAuthConfigError`, `VexComponentConfigError`, `VexStorageConfigError`) to a `TelemetryErrorCode`, `"unknown"` otherwise — reads `error.name` only, no runtime import of `@vexcms/core`
- [x] Tests with a local `node:http` server (receives body) and a blackholed port; `classifyTelemetryError.test.ts` covers every allowlisted name plus an unrecognized name and a non-`Error` value

## Step 6 — CLI wiring [agent]
Why: `vex dev` / `vex deploy` emit events; `vex telemetry` controls them.
Verify: `node packages/cli/dist/index.js telemetry status --json` prints the payload for `apps/test`; `VEX_TELEMETRY_DEBUG=1 vex dev --once` prints one event; `DO_NOT_TRACK=1` prints none.
- [x] `packages/cli` depends on `@vexcms/telemetry` (`workspace:*`)
- [x] `src/commands/telemetry.ts`: `enable` / `disable` / `status [--json]` (status shows enabled, reason, settings path and, with `--json`, the exact payload, `outcome: { status: "ok" }`)
- [x] `dev.ts`: time `loadConfig` and `generateAndWrite`; wrap `resolveConfig`/`loadConfig`/`generateSchema` so a thrown error records one `failed` `dev` event (stage + `classifyTelemetryError`, no `config`), awaited, then rethrows; on success record one `ok` `dev` event after the first generation (not on reloads), don't await. `deploy.ts`: same three stages, each `failed` event awaited before rethrow; on success record an `ok` `deploy` event and await it (bounded at 1.5s) before exit
- [x] `index.ts`: `telemetry` subcommand plus usage text

## Step 7 — create-vexcms wiring [agent]
Why: scaffold choices are the earliest adoption signal.
Verify: `VEX_TELEMETRY_DEBUG=1 create-vexcms … --yes` prints one `create` event with no project name or path.
- [x] Depends on `@vexcms/telemetry`; wraps `installer.initProject(options)` — on throw, records a `failed` `create` event (`stage: "scaffold"`, `classifyTelemetryError`), awaited, then rethrows; otherwise records an `ok` `create` event with `{ framework, template, bare, auth: { emailPassword, oauthProviderCount, orgs }, monorepo, initGit, installDependencies }` and awaits it (bounded)

## Step 8 — Telemetry receiver in apps/test [agent]
Why: confirm the whole pipeline on an unpublished app. vexcms list views can't filter or sort `json`, so analysis needs flat columns; per-project rows count apps, not `vex dev` runs.
Verify: `pnpm --filter test test -- deriveTelemetryProject` and `pnpm --filter test typecheck` green; the `[dev]` end-to-end script produces the described rows.
- [x] `src/db/constants/index.ts`: `TABLE_SLUG_TELEMETRY_EVENTS`, `TABLE_SLUG_TELEMETRY_PROJECTS`
- [x] `telemetryEvents` collection: append-only raw log (`timestamps: false`, received time = `_creationTime`), event/outcome/framework columns, raw `payload` json, `by_projectId` index
- [x] `telemetryProjects` collection: one row per `projectId`; counters, last outcome, environment, scaffold choices, size, feature, access and list-view columns, one `<type>FieldCount` per `ADMIN_FIELDS` type, `latestConfig` json; 6 indexes; 9 declared `admin.views` (Recently Active, Failing Setups, Uses Drafts, Uses RBAC, Query-Constraint Access, Largest Apps, Next.js, TanStack, Custom Hooks)
- [x] Register both collections; `auth/access.ts`: admin may read and use saved views; nobody may create/update/delete
- [x] `package.json` devDependency `@vexcms/telemetry` (type-only use); `vitest.config.ts` includes `convex/**/*.test.ts`
- [x] `convex/telemetry/deriveTelemetryProject.ts` + test (failed events without `config` keep the previous config-derived columns)
- [x] `convex/telemetry/ingest.ts`: `internalMutation` inserts the raw event and upserts the project row
- [x] `convex/http.ts`: `POST /telemetry/events` → 413 / 400 / 204; no IP headers read
- [ ] [dev] Confirm the running `vex dev` regenerated the schema; run the end-to-end script with `VEX_TELEMETRY_ENDPOINT` set to apps/test's site URL (ok, failed and `DO_NOT_TRACK=1` runs)

## Step 9 — Public docs page [agent]
Why: T8. Every field sent is listed publicly.
Verify: `pnpm --filter docs build` green; every key of `TelemetryEvent` and of the anonymized config appears in the page's field table (checked by a throwaway script during implementation).
- [x] `apps/docs/src/content/docs/guides/telemetry.mdx`: what and why, when events are sent, field tables for every payload key (including `outcome`, `framework`, access detail, hooks, list-view usage), example payload (from `status --json` on `apps/test`), what is never sent, fingerprint caveat, indefinite retention, opt-out controls, debug mode

## Step 10 — Legal review and release gate [dev]
Why: legal review and the receiver's final home both gate the release, not implementation.
Verify: notice and docs wording approved; endpoint constant points at the final receiver.
- [ ] Review the opt-out default, notice text and docs page under GDPR/CCPA; apply any wording changes
- [ ] Choose the receiver's final home (`apps/www` or a dedicated app), move the Step 8 receiver there, set `DEFAULT_TELEMETRY_ENDPOINT`
- [ ] Version the packages

## Step 11 — Keep repo-internal runs out of telemetry [agent]
Why: `scripts/verify-scaffold.mjs` and `scripts/vex-dev.mjs` run `vex` against `apps/test`; neither run is a real project.
Verify: `CI= XDG_CONFIG_HOME=$(mktemp -d) VEX_TELEMETRY_DEBUG=1 node scripts/verify-scaffold.mjs 2>&1 | grep -c '\[vex telemetry\]'` prints `0` (`CI` cleared so the count is not zero merely because CI detection disabled telemetry).
- [x] `scripts/verify-scaffold.mjs`: `runStep`'s `spawnSync` gets `env: { ...process.env, VEX_TELEMETRY_DISABLED: "1" }`
- [x] `scripts/vex-dev.mjs`: the `spawn('node', ['packages/cli/dist/index.js', 'dev', ...])` call gets the same env
