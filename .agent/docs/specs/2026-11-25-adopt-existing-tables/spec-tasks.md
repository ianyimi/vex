---
status: in-progress
spec_id: 2026-11-25-adopt-existing-tables
touches: ["packages/cli/src/lib/schemaSource.ts", "packages/cli/src/lib/schemaSource.test.ts", "packages/cli/src/lib/generateSchema.ts", "packages/cli/src/lib/generateSchema.test.ts", ".changeset/cli-schema-collision-warning.md", "apps/docs/src/content/docs/guides/adopt-existing-tables.mdx", ".agent/docs/product/backlog.md", ".agent/docs/product/v0.1.0-launch-plan.md", ".agent/docs/product/v0.1.0-final-sprint.md", ".agent/docs/product/launch-coordination.md"]
prompt_version: 1
---

# 2026-11-25-adopt-existing-tables — Tasks

Launch plan item 19 (ADOPT, `v0.1.0-final-sprint.md` § 3b). Two deliverables: a docs guide for
adopting an existing Convex table today (a collection whose slug matches the table,
`timestamps: false`, no drafts, every Convex validator mapped to the field that describes it), and a
warning from `vex dev` / `vex deploy` when `convex/schema.ts` hand-writes a table or index that the
generated `vex.schema.ts` also defines. Agent-implemented (developer delegated, 2026-11-25).

Verified current behaviour (2026-11-25): `syncSchemaImports` never replaces a hand-written table. It
adds a generated export only when the name appears nowhere in `schema.ts` (substring match), so a
hand-written `posts: defineTable(...)` silently wins and the generated `posts` is never wired. The
same substring match also skips a new table whose name merely appears inside another identifier,
field or comment (`tags` vs a `tags:` field, `team` vs `teamMember`).

## Step 1 — Schema source reader, collision warning, key-based wiring [agent]
Why: the warning needs to know which tables `schema.ts` defines by hand and how they differ from the
generated ones; the same key reader fixes the substring false positives that leave new collections
unwired.
Verify: `pnpm --filter @vexcms/cli test` and `pnpm --filter @vexcms/cli typecheck` green; a throwaway
smoke run of `syncSchemaImports` against copies of `apps/www`, `apps/test` and both templates'
`schema.ts` changes nothing and prints nothing, and a copy with a drifted hand-written `posts`
prints one warning, once.
- [x] `packages/cli/src/lib/schemaSource.ts`: `readSchemaEntries`, `readTableShape`, `readGeneratedTables`, `findSchemaCollisions`, `formatSchemaCollision`
- [x] `packages/cli/src/lib/schemaSource.test.ts`
- [x] `packages/cli/src/lib/generateSchema.ts`: computed-key resolution, key-based "already wired" check, warn once per table per process
- [x] `packages/cli/src/lib/generateSchema.test.ts`
- [x] `.changeset/cli-schema-collision-warning.md` (patch)

## Step 2 — Docs guide `/guides/adopt-existing-tables/` [agent]
Why: there is no page telling a Convex user how to point VexCMS at a table that already holds data;
FT shipped the last four validator shapes, so every common validator now has a field.
Verify: `pnpm --filter docs build` green; `dist/guides/adopt-existing-tables/index.html` exists and
the page is in `dist/llms-full.txt` and `dist/llms-small.txt` (`llms.txt` lists sets, not pages); every link on the page resolves to a built page.
- [x] `apps/docs/src/content/docs/guides/adopt-existing-tables.mdx`

## Step 3 — Bookkeeping [agent]
Why: launch coordination rules (board rows, locks, log) and the record COPY links from.
Verify: launch plan item 19 and final-sprint § 3b ADOPT ticked; session log has the guide URL; board
ADOPT rows `done`, locks `free`.
- [x] `backlog.md` (lock): templates' hand-written `account` lacks 3 generated indexes; `select.mdx` storage line
- [x] launch plan item 19 + final-sprint § 3b ADOPT ticked (lock)
- [x] board ADOPT rows + log line
- [x] session log entry with the guide's final URL for COPY
- [x] `harness tasks`, `harness struct`
