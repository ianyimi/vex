---
status: draft
spec_id: 2026-09-20-versioning-drafts
touches:
  - packages/core/src/versioning/**
  - packages/core/src/api/versions/**
  - packages/core/src/collections/constants.ts
  - packages/core/src/collections/types.ts
  - packages/core/src/collections/config.ts
  - packages/core/src/collections/config.test.ts
  - packages/core/src/globals/types.ts
  - packages/core/src/globals/config.ts
  - packages/core/src/globals/config.test.ts
  - packages/core/src/globals/utils.ts
  - packages/core/src/schema/generateVexSchema.ts
  - packages/core/src/schema/generateVexSchema.test.ts
  - packages/core/src/access/constants.ts
  - packages/core/src/access/types.test.ts
  - packages/core/src/api/test/convex/schema.ts
  - packages/core/src/api/convex.ts
  - packages/core/src/api/convex.test.ts
  - packages/core/src/api/server.ts
  - packages/core/src/api/client.ts
  - packages/core/src/api/types.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/find/server.test.ts
  - packages/core/src/api/get/server.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/remove/server.ts
  - packages/core/src/api/remove/server.test.ts
  - packages/core/src/api/globals/utils.ts
  - packages/core/src/api/globals/upsert.server.ts
  - packages/core/src/api/globals/upsert.server.test.ts
  - packages/core/src/api/globals/get.server.ts
  - packages/core/src/api/globals/get.server.test.ts
  - packages/core/src/index.ts
  - packages/core/README.md
  - packages/cli/src/commands/dev.ts
  - packages/cli/src/lib/generateSchema.ts
  - packages/cli/src/lib/migrate.ts
  - packages/react/src/components/views/**
  - packages/react/src/hooks/useAutosave.ts
  - packages/react/src/hooks/index.ts
  - packages/react/src/lib/errors.ts
  - packages/react/src/testing/convex/schema.ts
  - packages/react/src/testing/viewSuite.ts
  - apps/www/src/vexcms/collections/pages.ts
  - apps/www/convex/vex.ts
  - apps/www/convex/pages.ts
  - apps/www/src/auth/access.ts
  - "apps/www/src/app/(frontend)/(site)/PageContent.tsx"
  - "apps/www/src/app/(frontend)/(site)/SiteLivePreviewProvider.tsx"
  - apps/docs/src/content/docs/guides/versioning-and-drafts.mdx
prompt_version: 1
---

# 2026-09-20-versioning-drafts — Tasks

Re-scope of `.agent/docs/specs/2026-08-23-versioning-drafts` (56 tasks, superseded — see
that spec's frontmatter) against `.agent/docs/product/v0.1.0-launch-plan.md`'s "## C —
Versioning & drafts" section, F (`2026-09-18-lifecycle-hooks-validation`, shipped) and E
(`2026-09-18-live-preview`, shipped `b5263dc`), and four developer decisions recorded
below. Design background: `2026-08-23-versioning-drafts/design-review.md` — the two-row
model, the read-path analysis, and RBAC shape are UNCHANGED and carried forward; only the
write-pipeline integration and the read-path's index API underneath it changed.

**Depends on** `2026-08-23-access-index-resolution` Steps 1–5 (shipped) and
`2026-08-25-access-constraint-builder` Steps 1–10 (shipped) for `resolveAccessIndex` /
`resolveAccessConstraint` / `pickQueryIndex` — the CURRENT `constraints` callback API, not
the deleted `AccessIndexDecl` shape the original design-review sketched Step 10 against.

Model, in one line, unchanged from the design review: **one main row per document holding
the latest published content and a stable `_id`, plus at most one draft row pointing at
it; `vex_versions` holds immutable history.**

## Decisions locked for this re-scope

1. **Proceed now; whole-document version snapshots.** No localization exists in
   `core/src` today (B2 unshipped). Snapshot the whole document; a future localization
   spec is an additive change to the snapshot shape, not a rework.
2. **`publish` validates strictly.** A draft may be incomplete (F's lenient partial mode).
   `publish` re-validates the full merged document with the SAME strength as `create`
   (no `.partial()`) and rejects, naming the missing field, before promoting. Only
   `saveDraft` gets the lenient bypass.
3. **Unbounded version history in this spec; no `maxPerDoc`.** Matches design-review §6.3's
   own conclusion — these rows are read only when the history menu opens, never on the
   public path. Manual `deleteVersion` ships; automatic pruning does not.
4. **List-view pair-collapsing ships now**, not deferred to spec I. Without it a versioned
   document with an active draft renders as two separate rows the moment this spec lands —
   a correctness gap, not a polish item I should inherit.

## What changed under this spec since the original draft (context for every step below)

- F shipped the write pipeline every mutation below must call:
  `hasPermission(changes) → beforeChange → Zod (lenient partial on update, strict on
  create) → validateFields → stampUpdatedAt → write → triggers`
  (`api/update/server.ts:71-118`, `api/create/server.ts:73-101`). The original spec's
  `saveDraft`/`publish` sketches never called any of it and authorized against the
  STORED row instead of `args.data` — backwards from launch-plan constraint 1 and from
  `backlog.md`'s "Versioning/drafts write paths need `changes` for field permissions"
  entry. Every write step below fixes this rather than repeating it.
- E shipped and needs zero changes. `useVexPreview` overlays the consumer's own query
  result and does no fetching itself (`LivePreviewContext.tsx:252-287`) — Step 17 only
  swaps which query the preview's base layer calls.
- `access-index-resolution` Steps 1-5 and `access-constraint-builder` Steps 1-10 shipped.
  `resolveAccessIndex` / `resolveAccessConstraint` / `pickQueryIndex` exist and are wired
  into `find`/`get`/`search` today, but through the `constraints: ({ q }) => ...` builder
  API — the original design-review's `{ name, range }` `AccessIndexDecl` sketch for Step
  10 was deleted from the tree by that spec. Step 10 below is a fresh integration against
  the current builder, not a port.
- `RESERVED_COLLECTION_FIELDS` (today: `updatedAt` only, `collections/constants.ts:40-58`)
  is the exact machinery constraint 2 wants reused — `vex_status`/`vex_publishedAt`/
  `vex_publishedId` extend this map, not a second mechanism.
- `HasDrafts<T>` / `DraftAction` / `QUERY_ACTIONS.readDrafts` are ALREADY generic and
  shipped (`access/types.ts:634-638`, `access/constants.ts:27-38`) — they read
  `T extends { versions?: { drafts?: infer D } }` against whatever resource config is
  passed. Adding `versions` to `CollectionConfig` (Step 1) is sufficient; no `access/`
  changes are needed to unlock draft actions for collections.
- Globals already parse and default `versions.drafts` (`globals/types.ts:148-156`,
  `globals/config.ts:105-109`) with a docstring reading "Parsed but ignored in v35 —
  versioning for globals lands in Spec 36" — this spec. `GlobalConfig.versions` widens
  from `{ drafts: boolean }` to also carry `autosave` (Step 1, Step 15).
- The CLI's `hasVersioning` / `backfillVersionStatus` path (`cli/src/commands/dev.ts:91,
  103-108`, `cli/src/lib/generateSchema.ts:245-256`, `cli/src/lib/migrate.ts:206-238`) is
  MORE dead than the original spec assumed: it calls a Convex mutation reference
  (`"vex/versions:backfillVersionStatus" as any`) that has never existed in this
  codebase. `CollectionConfig` having no `versions` field kept `hasVersioning` always
  `false`, so it never fired — but once Step 1 lands, it WOULD start firing against a
  non-existent function. Step 16 deletes this auto-triggered path outright and builds a
  real, separately-invoked backfill action instead of resurrecting it.
- `packages/core/README.md:155-161` currently reads: "Not shipped. `versions.drafts`
  parses and is stored on the resolved config, but no draft/publish workflow is
  enforced — every read returns the live document... until it lands, do not model
  publish state as a hand-written `status` field." Step 17 rewrites this section and
  `:209-211`.

## Step 1 — `versions` config on collections + globals `[agent]` — [ ]

Why: Everything downstream branches on `collection.versions?.drafts`, which does not
exist on `CollectionConfig` today, and on `GlobalConfig.versions` carrying `autosave`,
which it doesn't either.
- [ ] `packages/core/src/versioning/constants.ts` — `VERSION_SYSTEM_FIELDS`,
      `DEFAULT_AUTOSAVE_DEBOUNCE_MS` (`as const`, P-003). No `maxPerDoc`/pruning default
      (decision 3).
- [ ] `packages/core/src/collections/types.ts` — `versions?: { drafts?: boolean;
      autosave?: boolean }` on `CollectionConfigInput`; resolved `versions: { drafts:
      boolean; autosave: boolean }` on `CollectionConfig`.
- [ ] `packages/core/src/collections/config.ts` — apply defaults (`drafts: false,
      autosave: false`), mirroring `globals/config.ts:105-109`.
- [ ] `packages/core/src/collections/constants.ts` — extend `RESERVED_COLLECTION_FIELDS`
      with `vexStatus: { slug: "vex_status" }`, `vexPublishedAt: { slug:
      "vex_publishedAt" }`, `vexPublishedId: { slug: "vex_publishedId" }`. Same
      compile-time/runtime guard `updatedAt` already gets — no second mechanism.
- [ ] `packages/core/src/globals/types.ts` — widen the existing `versions?: { drafts?:
      boolean }` input to also accept `autosave?: boolean`; resolved `versions: {
      drafts: boolean; autosave: boolean }` (was `{ drafts: boolean }`).
- [ ] `packages/core/src/globals/config.ts:105-109` — apply the `autosave: false`
      default alongside the existing `drafts: false`.
- [ ] `packages/core/src/collections/config.test.ts`, `globals/config.test.ts` — defaults
      resolve; reserved-field compile+runtime rejection covers the three new keys the
      same way it covers `updatedAt`.
- Verify: `pnpm --filter @vexcms/core test`

## Step 2 — Schema generation `[dev]` — [ ]

Why: No mutation can be written before the tables and indexes exist. Inverts
`generateVexSchema.test.ts`'s current "does not emit versioning fields" assertion.
- [ ] `packages/core/src/schema/generateVexSchema.ts` — on collections where
      `versions.drafts` is true: emit `vex_status` (`v.optional(v.union(v.literal(
      "draft"), v.literal("published")))`), `vex_publishedAt` (`v.optional(v.number())`),
      `vex_publishedId` (self-referential `v.optional(v.id(<table>))`), plus
      `.index("by_status", ["vex_status"])` and `.index("by_published",
      ["vex_publishedId"])`. Emit `vex_versions` unconditionally (so toggling a
      collection's `versions.drafts` never breaks a `schema.ts` import):
      ```ts
      vex_versions: defineTable({
        collection: v.string(),
        documentId: v.string(),
        version: v.number(),
        status: v.union(v.literal("draft"), v.literal("published")),
        snapshot: v.any(),
        createdBy: v.optional(v.string()),
        parentVersion: v.optional(v.number()),
        restoredFrom: v.optional(v.number()),
        publishedAt: v.optional(v.number()),
      }).index("by_document_version", ["collection", "documentId", "version"])
      ```
      Emit the same three fields + two indexes on `vex_globals` when any registered
      global declares `versions.drafts: true`.
- [ ] `packages/core/src/schema/generateVexSchema.test.ts` — replace the existing "does
      not emit `vex_status`/`vex_version` tables" assertion (around line 354) with its
      inverse for a versioned collection, and keep a companion assertion that a
      NON-versioned collection in the same config still emits neither.
- Verify: `pnpm --filter @vexcms/core test`

## Step 3 — `deleteVersions` action `[agent]` — [ ]

Why: One-line access change Steps 8 and 13 both gate on. `readDrafts`/`saveDraft`/
`publish`/`unpublish` already exist in `DRAFT_ACTIONS` — this is the only gap.
- [ ] `packages/core/src/access/constants.ts` — add `deleteVersions: "deleteVersions"`
      to `DRAFT_ACTIONS`.
- [ ] `packages/core/src/access/types.test.ts` — the action appears on a resource with
      `versions.drafts: true` and is absent otherwise (extends the existing
      `HasDrafts`/`DraftAction` coverage — no new type plumbing per AP-008, it already
      composes by shape).
- Verify: `pnpm --filter @vexcms/core test`

## Step 4 — Version model helpers `[dev]` — [ ]

Why: Leaf utilities every mutation below calls. No `pruneVersions` (decision 3).
- [ ] `packages/core/src/versioning/extractUserFields.ts` — strips `_id`,
      `_creationTime`, and every `VERSION_SYSTEM_FIELDS` member before a document is
      written into a `vex_versions` snapshot.
- [ ] `packages/core/src/versioning/model.ts` — `createVersion`, `getLatestVersion` (via
      `by_document_version`, `.order("desc").first()` — never `.collect()`),
      `getVersion`, `listVersions`, `findDraftRow` (via `by_published`).
- [ ] `packages/core/src/versioning/extractUserFields.test.ts`,
      `packages/core/src/versioning/model.test.ts` — exact expected values per
      `AP-009` (real fixtures, no placeholder comments standing in for them).
- Verify: `pnpm --filter @vexcms/core test`

## Step 5 — `saveDraft` `[dev]` — [ ]

Why: First mutation, and the one every later step's "at most one draft row" invariant
assumes. Reuses F's pipeline instead of writing directly — the core correction this
re-scope makes.
- [ ] `packages/core/src/api/versions/types.ts` — shared server/client arg shape:
      `{ collection, id, data: Partial<...>, restoredFrom?, environmentId? }`. `data` is
      a partial patch, matching `update`'s contract exactly — draft save is "update, but
      targeting the draft row and allowed to be incomplete," not a distinct shape.
- [ ] `packages/core/src/api/versions/saveDraft.server.ts` — gate on `saveDraft` with
      `hasPermission({ ..., data: <stored draft row or undefined>, changes: args.data,
      throwOnDenied: true })` — fixes the original spec's stored-row-only check. Find
      the existing draft row (`findDraftRow`) or bootstrap one (first edit of a
      published doc: insert a draft row with `vex_publishedId` set to the published
      row's `_id`, and snapshot the published row to `vex_versions` as `v1 published`
      before the first draft write). Merge `draftRow ∪ args.data` for `beforeChange`,
      dispatch it, diff via the same `deepEqual`/`changedKeys` approach
      `api/update/server.ts:107-109` uses, validate with
      `getCollectionInputSchema({ collection, partial: true })` (F's lenient mode) over
      changed keys only, run `validateFields` over changed keys, patch/insert the draft
      row, `createVersion` with `status: "draft"`.
- [ ] `packages/core/src/api/versions/saveDraft.client.ts`
- [ ] `packages/core/src/api/versions/saveDraft.server.test.ts` — at most one draft row
      per document across repeated saves; bootstrap fires once; a role restricted to
      `update: ({ changes }) => ...` on one field gets the SAME restriction on
      `saveDraft` (launch-plan acceptance criterion, proven by test).
- Verify: `pnpm --filter @vexcms/core test`

## Step 6 — `publish` `[dev]` — [ ]

Why: Makes the model observable end to end, carries the identity-preservation
invariant, and is where decision 2 (strict validation) lives.
- [ ] `packages/core/src/api/versions/publish.server.ts` — gate on `publish` with
      `changes: args.data`. Merge the draft row's current fields with `args.data`
      (authoritative; matches `update`'s merge, no `JSON.stringify` comparison). Run
      `getCollectionInputSchema({ collection })` WITHOUT `partial` (decision 2 — same
      strength as `create`) plus `validateFields` over every key; on failure throw
      naming the missing/invalid field(s) and do not write anything. On success, two
      paths: never-published draft (`vex_publishedId === undefined`) ⇒ patch the draft
      row in place (`vex_status: "published"`, `vex_publishedAt: now`); draft with a
      parent ⇒ `emitVersion(published, status: "published")` for the superseded state,
      `patch(published, { ...userFields, vex_publishedAt: now })`, `delete(draftRow)`.
      **The published row's `_id` is never destroyed** (design-review §2.2). Dispatch
      `beforeChange` before validation, same ordering as `create`/`update`.
- [ ] `packages/core/src/api/versions/publish.client.ts`
- [ ] `packages/core/src/api/versions/publish.server.test.ts` — published `_id` is
      identical before and after a publish cycle; a relationship pointing at it still
      resolves; draft row is gone; publishing a draft missing a required field is
      rejected and names the field; the stored published document is unchanged when
      rejection occurs.
- Verify: `pnpm --filter @vexcms/core test`

## Step 7 — `unpublish` `[dev]` — [ ]

Why: Needs Step 4's `findDraftRow` to enforce its rejection rule.
- [ ] `packages/core/src/api/versions/unpublish.server.ts` — gate on `unpublish` with
      `changes: undefined` (no field values move, only status). Throw when a draft row
      exists ("publish or discard the active draft first"). Flip the published row to
      `vex_status: "draft"`; emit a history row with `publishedAt` carried forward
      (never rewritten backwards).
- [ ] `packages/core/src/api/versions/unpublish.client.ts`
- [ ] `packages/core/src/api/versions/unpublish.server.test.ts` — rejects with an
      outstanding draft; invariant holds that at most one draft row exists per document.
- Verify: `pnpm --filter @vexcms/core test`

## Step 8 — History reads + `deleteVersion` `[dev]` — [ ]

Why: Closes read/delete endpoints with real authorization from day one. No pruning
endpoint (decision 3) — `deleteVersion` is manual, one row at a time.
- [ ] `packages/core/src/api/versions/listVersions.server.ts`,
      `getVersionSnapshot.server.ts` — both gate on `readDrafts`.
- [ ] `packages/core/src/api/versions/deleteVersion.server.ts` — gates on
      `deleteVersions`.
- [ ] Matching `.client.ts` files.
- [ ] `.server.test.ts` per operation — a role without `readDrafts` receives no draft
      content; a role without `deleteVersions` cannot delete a version row.
- Verify: `pnpm --filter @vexcms/core test`

## Step 9 — `versionsApi` factory `[dev]` — [ ]

Why: Registration point; mirrors `globalsApi` so a project with no versioned
collection or global registers nothing.
- [ ] `packages/core/src/api/convex.ts` — `versionsApi(config, query, mutation)`
      exporting bare names (`saveDraft`, `publish`, `unpublish`, `listVersions`,
      `getVersionSnapshot`, `deleteVersion`) per the naming-conventions "no `adminXxx`
      prefix" rule.
- [ ] `packages/core/src/api/server.ts`, `packages/core/src/api/client.ts` — exports.
- [ ] `packages/core/src/api/convex.test.ts` — registers only declared operations; a
      config with no `versions.drafts` anywhere registers `{}`.
- Verify: `pnpm --filter @vexcms/core test`

## Step 10 — Status filter injection `[dev]` — [ ]

Why: Consumes the CURRENT `access-constraint-builder` API (`constraints`/
`resolveAccessIndex`/`resolveAccessConstraint`/`pickQueryIndex`), not the deleted
`AccessIndexDecl` shape the original design-review sketched this against. The point at
which public reads stop seeing draft rows — enforced as data integrity, independent of
`access.bypass`.
- [ ] `packages/core/src/api/find/server.ts`, `get/server.ts`, `search/server.ts` — add
      `drafts?: boolean` arg. For a versioned collection where `drafts` is falsy,
      compose an ADDITIONAL published-only condition alongside whatever
      `resolveAccessIndex`/`resolveAccessConstraint` already resolved for the caller's
      RBAC rule: if no index slot is claimed, push
      `withIndex("by_status", q => q.eq("vex_status", "published"))`; if the slot is
      already claimed (by the caller or by an access rule), `and` a
      `.filter(f => f.eq("vex_status", "published"))` onto whatever filter expression
      is already being applied. This composition runs UNCONDITIONALLY for a versioned
      collection when `drafts` is falsy — including when the caller passed
      `access: { bypass: true }`, since the status filter is not a permission rule.
- [ ] `packages/core/src/api/find/server.test.ts` — public read (including a
      `bypass: true` call) returns no draft rows and no duplicate logical documents;
      `drafts: true` with `readDrafts` returns both; a caller-supplied `withIndex`
      still gets the status filter via `.filter()`.
- Verify: `pnpm --filter @vexcms/core test`

## Step 11 — Two-row consequences `[dev]` — [ ]

Why: The three places two rows per document leak if unhandled. Decision 4: list-view
pair-collapsing ships here, not deferred.
- [ ] Slug-uniqueness validation (wherever the collection declares a unique-slug
      constraint) scopes its lookup to `vex_status === "published"`.
- [ ] `packages/core/src/api/remove/server.ts` — delete cascades to the document's
      draft row (if any) and every `vex_versions` row for that document.
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — collapse
      published/draft pairs to one row per logical document, preferring the draft when
      one exists, with an "unpublished changes" indicator.
- [ ] Tests colocated with each.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

## Step 12 — `StatusBadge` + draft toolbar `[dev]` — [ ]

Why: First visible UI; needs Steps 5-9 registered to have anything to call.
- [ ] `packages/react/src/components/views/StatusBadge.tsx`
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — Save Draft /
      Publish / Unpublish buttons, each gated by `usePermission` on its own action;
      Unpublish disabled with an outstanding draft; Publish surfaces the strict
      validation rejection from Step 6 as a field-level error, reusing the existing
      validation-error display.
- [ ] `packages/react/src/components/views/StatusBadge.test.tsx`
- Verify: `pnpm --filter @vexcms/react test && pnpm --filter www build`

## Step 13 — `VersionHistoryDropdown` `[dev]` — [ ]

Why: Depends on Step 8's gated reads and Step 12's toolbar slot.
- [ ] `packages/react/src/components/views/VersionHistoryDropdown.tsx` — version,
      status, `publishedAt`, creator, timestamp; restore and delete; current-version
      highlight; delete confirmation. Hidden without `readDrafts`; delete hidden
      without `deleteVersions`.
- [ ] Restore is client-side: read the snapshot, hydrate the form,
      `saveDraft({ restoredFrom })`.
- [ ] `packages/react/src/components/views/VersionHistoryDropdown.test.tsx`
- Verify: `pnpm --filter @vexcms/react test`

## Step 14 — Autosave `[dev]` — [ ]

Why: Needs the toolbar and `saveDraft` in place. Fires on settled change, not a fixed
interval — the same reasoning design-review §6.2 already established still holds.
- [ ] `packages/react/src/hooks/useAutosave.ts` — fires only when form values differ
      from the last saved values, debounced by `DEFAULT_AUTOSAVE_DEBOUNCE_MS`; calls
      `saveDraft` with the changed fields. No `isAutosave` flag, no coalescing.
- [ ] `packages/react/src/hooks/useAutosave.test.tsx` — no write when values are
      unchanged; one write per settled change.
- Verify: `pnpm --filter @vexcms/react test`

## Step 15 — `GlobalEditView` draft toolbar `[dev]` — [ ]

Why: Step 1 already widened `GlobalConfig.versions`; this wires it through.
- [ ] `packages/core/src/api/globals/upsert.server.ts` — honor `versions.drafts` for
      globals, reusing the same saveDraft/publish/unpublish model against `vex_globals`
      (design-review §9: globals reuse the shared `vex_versions` table with
      `collection: "vex_globals"`, and the two-row model applies as `vex_globals` + one
      draft row per slug).
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — same toolbar as Step 12.
- [ ] Tests colocated.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

## Step 16 — CLI dead-code removal + real backfill action `[dev]` — [ ]

Why: The existing `hasVersioning` auto-trigger calls a mutation reference that has
never existed; Step 1 landing would make it start firing for real against nothing. Ship
its replacement instead of resurrecting it.
- [ ] `packages/cli/src/commands/dev.ts` — delete the `hasVersioning` branch (:91,
      103-108) and the `backfillVersionStatus` import.
- [ ] `packages/cli/src/lib/generateSchema.ts` — delete the dead `hasVersioning` branch
      (:245-256).
- [ ] `packages/cli/src/lib/migrate.ts` — delete `backfillVersionStatus` (:206-238).
- [ ] `packages/core/src/api/versions/backfillStatus.server.ts` — a genuine,
      separately-invoked (not CLI-auto-fired) one-shot action that stamps `vex_status:
      "published"` on rows predating a `versions.drafts` toggle on an existing
      collection.
- [ ] `packages/core/src/api/versions/backfillStatus.server.test.ts` — patches only
      rows missing the field.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/cli test`

## Step 17 — `apps/www` wiring + docs `[dev]` — [ ]

Why: Proves the whole feature against a real deployment and closes the live-preview
base-layer obligation E left for this spec.
- [ ] `apps/www/src/vexcms/collections/pages.ts` — `versions: { drafts: true, autosave:
      true }`.
- [ ] `apps/www/convex/vex.ts` — register `versionsApi`.
- [ ] `apps/www/src/auth/access.ts` — draft actions per role.
- [ ] `apps/www/convex/pages.ts` — `getBySlug` (public, `access.bypass: true`) is
      unchanged and stays published-only via Step 10's default. Add a second,
      session-authenticated query the live-preview base layer calls instead when the
      already-shipped `vex-live-preview` marker cookie is present (ADR-012's amendment)
      — it passes `drafts: true` and runs under a real `readDrafts` permission check
      (not `bypass`), so an unauthenticated request can never reach draft content.
- [ ] `apps/www/src/app/(frontend)/(site)/PageContent.tsx` /
      `SiteLivePreviewProvider.tsx` — wire the preview-mode branch to the new query.
      `useVexPreview`/`useLivePreviewQuery` themselves are unchanged.
- [ ] `packages/core/README.md:155-161, 209-211` — rewrite from "not shipped" to
      describe the real draft/publish workflow and the migration path off a hand-rolled
      `status` field.
- [ ] `apps/docs/src/content/docs/guides/versioning-and-drafts.mdx`
- Verify: `pnpm --filter www typecheck && pnpm --filter www build && pnpm --filter docs build`

## Step 18 — Verification `[dev]` — [ ]

- [ ] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] Manual: create a page, publish it, note its `_id`; edit and save a draft (public
      route still serves the published copy, including through the `bypass: true`
      query); attempt to publish a draft with a required field cleared and confirm
      rejection naming the field; fill it in and publish again, confirming **the `_id`
      is unchanged** and inbound relationships still resolve; unpublish with an
      outstanding draft and confirm the rejection; restore an older version; confirm the
      admin list shows one row for a document with an active draft, not two.
- Verify: `pnpm build && pnpm test`
