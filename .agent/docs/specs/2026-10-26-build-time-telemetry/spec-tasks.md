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

# 2026-10-26-build-time-telemetry — Tasks

Launch-plan item **M**. Stem: `../2026-10-24-telemetry/stem.md` (T1–T9). Tier: low-care (full code, agent implements).

## Step 1 — `@vexcms/telemetry` package scaffold [agent]
Why: `vex` and `create-vexcms` share one notice, one settings file and one sender; the package has to exist before either can use it.
Verify: `pnpm --filter @vexcms/telemetry build test typecheck` green; `scripts/check-packed-manifests.mjs --sweep` green.
- [ ] `packages/telemetry/` with `package.json` (no deps beyond node built-ins, `catalog:` devDeps), `tsup.config.ts`, `tsconfig{,.build,.check}.json`, `vitest.config.ts` copied from `packages/cli`
- [ ] `src/constants.ts`: `TELEMETRY_SCHEMA_VERSION = 1`, `TELEMETRY_DOCS_URL`, `DEFAULT_TELEMETRY_ENDPOINT`, `TELEMETRY_TIMEOUT_MS = 1500`, env var names
- [ ] `src/index.ts` barrel; patch changeset

## Step 2 — Settings file and enablement [agent]
Why: every later step asks "may I send?" and needs the machine settings file.
Verify: `settings.test.ts`, `isTelemetryEnabled.test.ts` green.
- [ ] `src/settings.ts`: `resolveSettingsPath(env)` (`$XDG_CONFIG_HOME/vexcms/telemetry.json`, else `~/.config/vexcms/telemetry.json`); `readTelemetrySettings` / `writeTelemetrySettings`; the file holds `{ enabled?, machineId, salt, noticeShownAt? }`, created with random `machineId` + `salt` on first read; a corrupt or unwritable file is treated as missing
- [ ] `src/isTelemetryEnabled.ts`: `DO_NOT_TRACK`, `VEX_TELEMETRY_DISABLED`, and CI detection (`src/isCi.ts`: `CI`, `CONTINUOUS_INTEGRATION`, `BUILD_NUMBER`, `GITHUB_ACTIONS`, `GITLAB_CI`, `VERCEL`, `NETLIFY`, …) take precedence over the stored `enabled`; default on; env vars can only turn it off. Returns `{ enabled, reason }` for `status`
- [ ] Tests: each env switch → off; stored `false` → off; env `VEX_TELEMETRY_DISABLED=0` does not override stored `false`

## Step 3 — Anonymous ids [agent]
Why: T6, so repeat runs of one project aren't double-counted, without anything linkable.
Verify: `projectId.test.ts` green.
- [ ] `src/projectId.ts`: `createProjectId(salt, projectDir)` = sha256(salt + realpath(projectDir)), hex; same input → same id; different salt → different id

## Step 4 — Anonymized config payload [agent]
Why: T5 plus the interview decision: full config shape with numbered names and allowlisted keys only.
Verify: `anonymizeConfig.test.ts` green, including the leak test.
- [ ] `src/types.ts`: `TelemetryEvent` (`schemaVersion`, `event: "dev" | "deploy" | "create"`, `machineId`, `projectId`, `sentAt`, `environment` {vexVersions, nodeVersion, os, arch, packageManager}, `config?`, `timings?`, `create?`)
- [ ] `src/anonymizeConfig.ts`: `anonymizeConfig(config: VexConfig)`. Collections, globals, media collections and blocks become `collection1`… / `global1`… / `block1`…, fields `field1`…. Per field: `type`, allowlisted booleans and numbers, allowlisted enum options; select/radio options → `optionCount`; functions → `true`; every other string is dropped. Top level: feature flags (versions/drafts, livePreview, conditions, slots, input masks, localization, auth, access, storage adapter kinds), counts
- [ ] Leak test: a config with names like `secretProject`, labels, defaults, select options, regex, URLs and descriptions. Collect every string in the payload and assert each one is an allowlisted literal (field type, enum value, generated name, version or os) and none is a secret
- [ ] Unknown field key → dropped (test)

## Step 5 — Sender and first-run notice [agent]
Why: T2, T7, T8. Telemetry never delays or fails a command.
Verify: `sendTelemetryEvent.test.ts` green: an unreachable endpoint resolves in ≤1.6s without throwing; debug mode prints and makes no request.
- [ ] `src/sendTelemetryEvent.ts`: `fetch` POST with `AbortSignal.timeout(TELEMETRY_TIMEOUT_MS)`; all errors swallowed; `VEX_TELEMETRY_ENDPOINT` override; `VEX_TELEMETRY_DEBUG=1` prints JSON to stderr and does not send
- [ ] `src/showTelemetryNotice.ts`: printed once per machine (stamps `noticeShownAt`), links `TELEMETRY_DOCS_URL`, shows how to disable
- [ ] `src/recordTelemetryEvent.ts`: one entry point (`isTelemetryEnabled` → notice → build event → send) returning the send promise
- [ ] Tests with a local `node:http` server (receives body) and a blackholed port

## Step 6 — CLI wiring [agent]
Why: `vex dev` / `vex deploy` emit events; `vex telemetry` controls them.
Verify: `node packages/cli/dist/index.js telemetry status --json` prints the payload for `apps/test`; `VEX_TELEMETRY_DEBUG=1 vex dev --once` prints one event; `DO_NOT_TRACK=1` prints none.
- [ ] `packages/cli` depends on `@vexcms/telemetry` (`workspace:*`)
- [ ] `src/commands/telemetry.ts`: `enable` / `disable` / `status [--json]` (status shows enabled, reason, settings path and, with `--json`, the exact payload)
- [ ] `dev.ts`: time `loadConfig` and `generateAndWrite`, record one `dev` event after the first generation (not on reloads), don't await. `deploy.ts`: record a `deploy` event and await it (bounded at 1.5s) before exit
- [ ] `index.ts`: `telemetry` subcommand plus usage text

## Step 7 — create-vexcms wiring [agent]
Why: scaffold choices are the earliest adoption signal.
Verify: `VEX_TELEMETRY_DEBUG=1 create-vexcms … --yes` prints one `create` event with no project name or path.
- [ ] Depends on `@vexcms/telemetry`; after `initProject` completes, record a `create` event with `{ framework, template, bare, auth: { emailPassword, oauthProviderCount, orgs }, monorepo, initGit, installDependencies }` and await it (bounded)

## Step 8 — `apps/telemetry` ingest app (vexcms) [agent + dev]
Why: T7. A vendor-owned receiver with a read-only admin.
Verify: `curl -X POST <site>/events` with a valid payload → 204 and a row in the admin; invalid schemaVersion → 400; >32KB → 413; no IP in the stored doc.
- [ ] [agent] Scaffold with `create-vexcms telemetry --monorepo --bare` into `apps/telemetry`; add to the `.changeset` ignore list
- [ ] [agent] `telemetryEvents` collection (read-only admin: create/update/delete denied); `convex/events.ts` `internalMutation` insert; `convex/http.ts` `POST /events`: content-length/body ≤ 32KB, `schemaVersion` check, Convex validator on the body, stores `receivedAt`, never reads request headers for IP
- [ ] [dev] Create the Convex deployment, deploy, then set `DEFAULT_TELEMETRY_ENDPOINT` to its `.convex.site/events` URL

## Step 9 — Public docs page [agent]
Why: T8. Every field sent is listed publicly.
Verify: the docs build is green; every key of `TelemetryEvent` and of the anonymized config appears in the page's field table (checked by a throwaway script during implementation).
- [ ] `apps/docs/src/content/docs/guides/telemetry.mdx`: what and why, the field table, example payload (from `status --json` on `apps/test`), what is never sent, the fingerprint caveat, indefinite retention, opt-out controls, debug mode

## Step 10 — Legal review [dev]
Why: open question 6. Gates release, not implementation.
Verify: notice and docs wording approved.
- [ ] Review the opt-out default, notice text and docs page under GDPR/CCPA; apply any wording changes
