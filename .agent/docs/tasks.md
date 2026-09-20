## In Progress
- RBAC access control (spec 2026-08-12-rbac-access-control)
- Access index resolution (spec 2026-08-23-access-index-resolution)
- WP-5 publish alphas
- Build the real www marketing site (spec 2026-09-01-www-content-spec; seed rewrite and both code-showcase pairings done — the three `/features` Split blocks remain)
- 4. E — Live preview: `postMessage` transport + mount handshake, one `<VexLivePreviewProvider>` in the layout owning gate/origin-check/transport, `id → unsaved values` map, `useVexPreview` overlaying the consumer's own query result (optional `useVexQuery` sugar on top); target is the real route, not a preview route; deep merge extracted from `useLiveFieldMerge`; temp-id matching for unsaved-new docs (ADR-012). No drafts or autosave needed. ~~Prereq: config client/server split spec~~ — **done** (spec `2026-09-12-config-client-server-split`, ADR-013): the client config is a real module the browser imports, so `livePreview.url` can be a function

## Inbox
### v0.1.0 launch track — work in this order (`.agent/docs/product/v0.1.0-launch-plan.md`)
### Other
- 1. A — Data-table integrity & dead config: unreachable bulk delete, bogus `_createdAt` default, `updatedAt` verification, wire `pageSize` options, delete the UI-dependent table config (sorting/columns move to I), README `convex env set` + false sortable/searchable claims, ratify `vex_` table convention
- 2. B — Public API surface: un-export the 4 migrate stubs + gate `autoMigrate`; localization ADR (decision only, zero production diff)
- 5. C — Versioning & drafts (existing spec 2026-08-23-versioning-drafts, re-scope first) — calls F's pipeline and reuses its lenient validation mode; must pass `changes` to `hasPermission` on draft writes; adds the draft base layer to E's overlay
- 6. D — Richtext field: wire the existing 3,219 lines in `richtext-plate`, add `richtext()` + the 2 missing core types, drop 4 `@ts-nocheck`
- 7. G — Field input consistency pass: relationship field, loading states, media MIME filter, conditional fields
- 8. H — Edit-view overhaul: unsaved-changes nav guard, duplicate document, duplicate block
- 9. I — List-view overhaul: search, sort, column visibility, page size, saved views — reintroduces the config A deleted alongside the controls that consume it
- 10. J — Responsive / mobile UI pass — FINAL gate before tagging
- Rename naming outliers: MediaLibaryGrid.tsx, use-mobile.ts, blocks/logo-cloud.ts
- Access constraint builder (spec 2026-08-25-access-constraint-builder)
- Upload GitHub social preview 1280x640 (deferred from WP-4 step 7; brief in github-page.md)
- Release mechanics before tagging: `changeset pre exit` (15 queued changesets), publish via pnpm, `scripts/verify-scaffold.mjs` green
- Assessed-but-deferred features live in `.agent/docs/product/backlog.md`
- Fix scripts/vercel-build-check.mjs: since / prerenders via a live vex.query, the placeholder NEXT_PUBLIC_CONVEX_URL makes the pristine build fail on every run (pre-existing at a180967). Pass through a real dev URL when present, or make HomePage degrade when Convex is unreachable
- F follow-up — spec 2026-09-18-lifecycle-hooks-validation step 8: write `scripts/verify-hooks-wiring.mjs`, add a `createVexMutations` assertion to `scripts/verify-scaffold.mjs`, and write `apps/docs/src/content/docs/guides/lifecycle-hooks.mdx` (apps/test + base-nextjs template wiring, and the marketing-site slug validator, are done)
- Consume @vexcms/react from source in dev (removes the tsup watch loop; see backlog)

## Recently Done
- Re-enabled starlight-typedoc, multi-package (core/react/next/better-auth/file-storage), 120→0 TypeDoc warnings, treatWarningsAsErrors ON — see ADR-001
- Server API access options
- Refresh stale package names in scripts/sync-template-versions.mjs
- Re-enable tsup `dts: false` across packages when the CPU issue is resolved
- Dependency pinning & supply-chain hardening (spec 2026-08-30-wpa-dependency-pinning)
- WP-C color field
- WP-4 docs and repo polish (spec 2026-08-30-wp4-docs-repo-polish)
- WP-1 release integrity
- WP-2 CLI + templates (spec 2026-08-31-wp2-cli-templates)
- SEO prerendering and admin-panel revalidation
- React test suite for @vexcms/react — 12 field types, exported testing kit, apps dogfooding (spec 2026-09-04-react-test-suite)
- React test suite fixes
- React coverage expansion - 50% to 80% first-party, list-view + views + shell + modals + media + hooks (spec 2026-09-08-react-coverage-expansion)
- React bug fixes - clear all 87 failing assertions across react + core (spec 2026-09-08-react-bug-fixes)
- Field-level RBAC permissions
- **F — Lifecycle hooks & validation**: collection `beforeChange`/`beforeDelete` (inline, may reject a write) and `afterChange`/`afterDelete` (via convex-helpers triggers), typed hook/validator authoring factories, async field `validate()` with `ctx`, server-enforced min/max independent of `required` across all fields (ADR-010, ADR-011); wired into `apps/www`, `apps/test`, and the `base-nextjs`/`marketing-site` templates — the lifecycle-hooks guide and two verify-script assertions remain (see Inbox)
- **Discord show-and-tell readiness (spec 2026-09-13-discord-post-readiness)** — 8 steps: bulk-selection bar, un-export migrate stubs, admin mobile pass 375/390/768/1024, www mobile pass, mirror into create-vexcms templates, OG + social cards [dev], quickstart walk [dev], verification gate
