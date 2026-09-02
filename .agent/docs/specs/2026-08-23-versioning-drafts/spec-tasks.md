---
status: draft
spec_id: 2026-08-23-versioning-drafts
touches: []
prompt_version: 1
---

# 2026-08-23-versioning-drafts — Tasks

Design: `design-review.md` (this directory) — the two-row draft model, all resolved
decisions, and the read-path analysis. Background: `research.md`,
`convex-component-decision.md`.

**Depends on** `2026-08-23-access-index-resolution` Steps 1–5: the published-only status
filter is a framework-supplied access index, not a permission rule.

Model, in one line: **one main row per document holding the latest published content and
a stable `_id`, plus at most one draft row pointing at it; `vex_versions` holds immutable
history.**

## Step 1 — `VersionsConfig` on collections `[agent]` — [ ]

Why: Everything downstream branches on `collection.versions?.drafts`, which does not
exist on `CollectionConfig` today.
- [ ] `packages/core/src/versioning/constants.ts` — `VERSION_SYSTEM_FIELDS`,
      `DEFAULT_MAX_VERSIONS_PER_DOC`, `DEFAULT_AUTOSAVE_DEBOUNCE_MS` (`as const`, P-003).
- [ ] `packages/core/src/collections/types.ts` — `versions?: { drafts?, autosave?, maxPerDoc? }`
      on `CollectionConfigInput`; resolved `versions` on `CollectionConfig`.
- [ ] `packages/core/src/collections/config.ts` — apply defaults, mirroring
      `globals/config.ts:91-94`.
- [ ] `packages/core/src/collections/config.test.ts` — defaults resolve; `drafts: false` default.
- Verify: `pnpm --filter @vexcms/core test`

## Step 2 — Schema generation `[dev]` — [ ]

Why: No mutation can be written before the tables and indexes exist. Inverts the
existing "no versioning fields" assertion.
- [ ] `packages/core/src/schema/generateVexSchema.ts` — on versioned collections only:
      `vex_status`, `vex_publishedAt`, `vex_publishedId` (self-referential
      `v.optional(v.id(<table>))`), plus `by_status` and `by_published` indexes. Emit
      `vex_versions` unconditionally. Same three fields on `vex_globals` when any global
      declares drafts.
- [ ] `packages/core/src/schema/generateVexSchema.test.ts` — replace the
      `does not include versioning fields in v35` assertion (currently lines 343-357)
      with its inverse; assert non-versioned collections get no `vex_status`.
- Verify: `pnpm --filter @vexcms/core test`

## Step 3 — `deleteVersions` action `[agent]` — [ ]

Why: One-line access change that Steps 8 and 13 both gate on.
- [ ] `packages/core/src/access/constants.ts` — add `deleteVersions` to `DRAFT_ACTIONS`.
- [ ] `packages/core/src/access/types.test.ts` — the action appears on a resource with
      `versions.drafts: true` and is absent otherwise.
- Verify: `pnpm --filter @vexcms/core test`

## Step 4 — Version model helpers `[dev]` — [ ]

Why: Leaf utilities every mutation calls; indexed reads replace `master`'s O(n) scan.
- [ ] `packages/core/src/versioning/extractUserFields.ts` — strip `_id`,
      `_creationTime`, and every `VERSION_SYSTEM_FIELDS` member.
- [ ] `packages/core/src/versioning/model.ts` — `createVersion`, `getLatestVersion`
      (via `by_document_version`, `.order("desc").first()` — never `.collect()`),
      `getVersion`, `listVersions`, `pruneVersions`, `findDraftRow` (via `by_published`).
- [ ] `packages/core/src/versioning/extractUserFields.test.ts`,
      `packages/core/src/versioning/model.test.ts` — exact expected values.
- Verify: `pnpm --filter @vexcms/core test`

## Step 5 — `saveDraft` `[dev]` — [ ]

Why: First mutation, and the only one that creates a draft row — Steps 6–8 assume it.
- [ ] `packages/core/src/api/versions/types.ts` — shared server/client arg shapes.
      Params are `collection:` and `data:` (never `collectionSlug`/`fields`).
      `environmentId?: string` accepted and ignored.
- [ ] `packages/core/src/api/versions/saveDraft.server.ts` — gate on `saveDraft`;
      patch the existing draft row if `findDraftRow` hits, else insert one with
      `vex_publishedId` set; emit a history row; first-edit bootstrap snapshots the
      published row as `v1 published`.
- [ ] `packages/core/src/api/versions/saveDraft.client.ts`
- [ ] `packages/core/src/api/versions/saveDraft.server.test.ts` — at most one draft row
      per document across repeated saves; bootstrap fires once.
- Verify: `pnpm --filter @vexcms/core test`

## Step 6 — `publish` `[dev]` — [ ]

Why: The step that makes the model observable end to end, and the one with the
identity-preservation invariant.
- [ ] `packages/core/src/api/versions/publish.server.ts` — gate on `publish`. Two paths:
      never-published draft ⇒ patch in place; draft with a parent ⇒ emit the superseded
      published state to history, patch the parent with the draft's user fields, delete
      the draft row. **The published row's `_id` is never destroyed.** `data` is required
      and authoritative; no `JSON.stringify` comparison. Set `publishedAt` on the
      history row, never cleared.
- [ ] `packages/core/src/api/versions/publish.client.ts`
- [ ] `packages/core/src/api/versions/publish.server.test.ts` — published `_id` is
      identical before and after a publish cycle; a relationship pointing at it still
      resolves; draft row is gone.
- Verify: `pnpm --filter @vexcms/core test`

## Step 7 — `unpublish` `[dev]` — [ ]

Why: Needs Step 4's `findDraftRow` to enforce its rejection rule.
- [ ] `packages/core/src/api/versions/unpublish.server.ts` — gate on `unpublish`;
      **throw when a draft row exists** ("publish or discard the active draft first");
      flip the published row to `draft`; emit history. Never rewrites a history row's
      `status` backwards.
- [ ] `packages/core/src/api/versions/unpublish.client.ts`
- [ ] `packages/core/src/api/versions/unpublish.server.test.ts` — rejects with an
      outstanding draft; invariant holds that at most one draft row exists per document.
- Verify: `pnpm --filter @vexcms/core test`

## Step 8 — History reads + `deleteVersion` `[dev]` — [ ]

Why: Closes the five `master` endpoints that shipped with no authorization.
- [ ] `packages/core/src/api/versions/listVersions.server.ts`,
      `getVersionSnapshot.server.ts` — both gate on `readDrafts`.
- [ ] `packages/core/src/api/versions/deleteVersion.server.ts` — gates on `deleteVersions`.
- [ ] Matching `.client.ts` files.
- [ ] `.server.test.ts` per operation — a role without `readDrafts` receives no draft
      content; a role without `deleteVersions` cannot prune history.
- Verify: `pnpm --filter @vexcms/core test`

## Step 9 — `versionsApi` factory `[dev]` — [ ]

Why: Registration point; mirrors `globalsApi` so a project without versioning registers
nothing.
- [ ] `packages/core/src/api/convex.ts` — `versionsApi(config, query, mutation)`
      exporting bare names (`saveDraft`, `publish`, `unpublish`, `listVersions`,
      `getVersionSnapshot`, `deleteVersion`).
- [ ] `packages/core/src/api/server.ts`, `packages/core/src/api/client.ts` — exports.
- [ ] `packages/core/src/api/convex.test.ts` — registers only declared operations.
- Verify: `pnpm --filter @vexcms/core test`

## Step 10 — Status filter injection `[dev]` — [ ]

Why: Consumes `access-index-resolution` Steps 3–5; the point at which public reads stop
seeing draft rows.
- [ ] `packages/core/src/api/find/server.ts`, `get/server.ts`, `search/server.ts` —
      `drafts?: boolean` arg; for versioned collections when `drafts` is falsy, inject
      `{ name: "by_status", range: () => (q) => q.eq("vex_status", "published") }`
      through `pickQueryIndex`.
- [ ] `packages/core/src/api/find/server.test.ts` — public read returns no draft rows and
      no duplicate logical documents; `drafts: true` with `readDrafts` returns both.
- Verify: `pnpm --filter @vexcms/core test`

## Step 11 — Two-row consequences `[dev]` — [ ]

Why: The three places two rows per document leak if unhandled.
- [ ] Slug-uniqueness validation scopes to `vex_status === "published"`.
- [ ] `packages/core/src/api/remove/server.ts` — delete cascades to the draft row and
      the document's `vex_versions` rows.
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — collapse
      published/draft pairs to one row, preferring the draft, with an unpublished-changes
      indicator.
- [ ] Tests colocated with each.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

## Step 12 — `StatusBadge` + draft toolbar `[dev]` — [ ]

Why: First visible UI; needs Steps 5–9 registered to have anything to call.
- [ ] `packages/react/src/components/views/StatusBadge.tsx`
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — Save Draft /
      Publish / Unpublish, each gated by `usePermission` on its own action; Unpublish
      disabled with an outstanding draft.
- [ ] `packages/react/src/components/views/StatusBadge.test.tsx`
- Verify: `pnpm --filter @vexcms/react test && pnpm --filter www build`

## Step 13 — `VersionHistoryDropdown` `[dev]` — [ ]

Why: Depends on Step 8's gated reads and Step 12's toolbar slot.
- [ ] `packages/react/src/components/views/VersionHistoryDropdown.tsx` — version, status,
      `publishedAt`, creator, timestamp; restore and delete; current-version highlight;
      delete confirmation. Hidden without `readDrafts`; delete hidden without
      `deleteVersions`.
- [ ] Restore is client-side: read the snapshot, hydrate the form, `saveDraft({ restoredFrom })`.
- [ ] `packages/react/src/components/views/VersionHistoryDropdown.test.tsx`
- Verify: `pnpm --filter @vexcms/react test`

## Step 14 — Autosave `[dev]` — [ ]

Why: Needs the toolbar and `saveDraft` in place.
- [ ] `packages/react/src/hooks/useAutosave.ts` — fires only when form values differ from
      last saved, debounced by `DEFAULT_AUTOSAVE_DEBOUNCE_MS`; patches the draft row and
      emits history like any `saveDraft`. No `isAutosave` flag, no coalescing.
- [ ] `packages/react/src/hooks/useAutosave.test.tsx` — no write when values are
      unchanged; one write per settled change.
- Verify: `pnpm --filter @vexcms/react test`

## Step 15 — `GlobalEditView` draft toolbar `[dev]` — [ ]

Why: Spec 35 deferred this here explicitly (its `spec.md` D9 / Out of Scope).
- [ ] `packages/core/src/globals/{types,config}.ts` — apply Step 1's
      `TDrafts extends boolean` treatment to `GlobalConfig`. Required: `HasDrafts` tests
      `D extends true`, and `GlobalConfig.versions` is `{ drafts: boolean }` today, so
      draft actions never unlock for globals and the toolbar's permission gates can never
      pass. See spec.md Design Decision 19.
- [ ] `packages/core/src/api/globals/upsert.server.ts` — honor `versions.drafts`.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — same toolbar as Step 12.
- [ ] Tests colocated.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

## Step 16 — Toggle backfill + CLI cleanup `[dev]` — [ ]

Why: Independent of the feature path; safe to land last.
- [ ] `packages/core/src/api/versions/backfillStatus.server.ts` — user-invoked action
      that stamps `vex_status` on rows predating a `versions.drafts` toggle.
- [ ] `packages/cli/src/lib/migrate.ts` — delete the `backfillVersionStatus` path.
- [ ] `packages/cli/src/lib/generateSchema.ts` — delete the dead `hasVersioning` branch
      (lines 216-230).
- [ ] `packages/core/src/api/versions/backfillStatus.server.test.ts` — patches only rows
      missing the field.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/cli test`

## Step 17 — `apps/www` wiring `[dev]` — [ ]

Why: Proves the whole feature against a real deployment.
- [ ] `apps/www/src/vexcms/collections/pages.ts` — `versions: { drafts: true, autosave: true }`.
- [ ] `apps/www/convex/vex.ts` — register `versionsApi`.
- [ ] `apps/www/src/auth/access.ts` — draft actions per role.
- [ ] `apps/docs/src/content/docs/guides/versioning-and-drafts.mdx`
- Verify: `pnpm --filter www typecheck && pnpm --filter www build && pnpm --filter docs build`

## Step 18 — Verification `[dev]` — [ ]

- [ ] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] Manual: create a page, publish it, note its `_id`; edit and save a draft (public
      route still serves the published copy); publish again and confirm **the `_id` is
      unchanged** and inbound relationships still resolve; unpublish with an outstanding
      draft and confirm the rejection; restore an older version.
- Verify: `pnpm build && pnpm test`
