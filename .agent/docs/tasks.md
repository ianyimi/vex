## In Progress
- RBAC access control (spec 2026-08-12-rbac-access-control)
- Access index resolution (spec 2026-08-23-access-index-resolution)
- WP-5 publish alphas
- Build the real www marketing site (spec 2026-09-01-www-content-spec; seed rewrite and both code-showcase pairings done — the three `/features` Split blocks remain)
- 5. C — Versioning & drafts (spec 2026-08-23-versioning-drafts, 56 tasks, still `draft` — RE-SCOPE FIRST: it predates F and E). Calls F's write pipeline and reuses its lenient validation mode; must pass `changes` to `hasPermission` on draft writes; supplies the draft base layer E's overlay sits on (E needs no change — the overlay already applies to whatever document the consumer's query returned)
- 6. D — Richtext field: wire the existing 3,219 lines in `richtext-plate`, add `richtext()` + the 2 missing core types, drop 4 `@ts-nocheck`
- 7. G — Field input consistency pass: relationship field, loading states, media MIME filter, conditional fields
- 9. I — List-view overhaul: search, sort, column visibility, page size, saved views — reintroduces the config A deleted alongside the controls that consume it
- Build-time telemetry (spec 2026-10-26-build-time-telemetry)

## Inbox
### v0.1.0 launch track — work in this order (`.agent/docs/product/v0.1.0-launch-plan.md`)
### Other
- 1. A — Data-table integrity & dead config: unreachable bulk delete, bogus `_createdAt` default, `updatedAt` verification, wire `pageSize` options, delete the UI-dependent table config (sorting/columns move to I), README `convex env set` + false sortable/searchable claims, ratify `vex_` table convention
- 2. B — Public API surface: un-export the 4 migrate stubs + gate `autoMigrate`; localization ADR (decision only, zero production diff)
- 10. J — Responsive / mobile UI pass — FINAL gate before tagging
- Rename naming outliers: MediaLibaryGrid.tsx, use-mobile.ts, blocks/logo-cloud.ts
- Access constraint builder (spec 2026-08-25-access-constraint-builder)
- V — Accessibility, web standards & performance pass on `apps/www` and the admin panel (`apps/test` → fixes in `packages/react`): spec fetches WCAG 2.2, WAI-ARIA 1.2 + APG, HTML standard, Core Web Vitals; axe + Lighthouse CI + Nu validator + jsx-a11y; manual keyboard / focus-visible / VoiceOver / zoom pass; security headers; CI gates; accessibility statement. Target WCAG 2.2 AA + AAA focus appearance. After J, before K conformance and N (launch plan § V)
- N — Update + test create-vexcms templates: sync `base-nextjs` from `apps/test` and `marketing-site` from `apps/www` (template-sync skill), scaffold from packed tarballs, manual run-through per template on a fresh Convex deployment (launch plan § N)
- S — Harden the live demo: anonymous-user cleanup cron, anonymous sign-in rate limit, read-only proven by direct mutation calls, Convex sized for launch traffic, screenshot/video fallback (launch plan § S)
- P — Launch analytics & monitoring: Vercel Web Analytics + Speed Insights on www and docs, template default, privacy page, Vercel spend + Convex usage alerts, uptime checks (launch plan § P)
- Q — Write spec + publish post-0.1.0 roadmap: free-tier order only (plugins → free features → brownfield adoption); one line on paid work, no tiers or paid features named; docs `roadmap.md` is the single source (launch plan § Q)
- R — Funding & sustainability: community-funded framing (sponsorship funds free-tier bug fixes and features), GitHub Sponsors tiers + goal, Buy Me a Coffee, `.github/FUNDING.yml`, contact + `security@` addresses, "built in free time" copy, Q's paid-work line everywhere (launch plan § R)
- O — GitHub repo readiness: labels (`.github/labels.yml`), issue forms + `config.yml`, Discussions as the support channel (no Discord yet), PR template, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY + private vulnerability reporting, social preview, starter issues, claim `vexcms` org, community profile 100% (launch plan § O)
- T — Launch content: comparison page, README badges + hero GIF, media kit, 0.1.0 release notes, announcement post, newsletter signup (launch plan § T)
- U — Write spec + implement launch plan: research channel rules and launch formats (Supabase Launch Week), decide single day vs launch week, developer-feature highlight series (clip + post + docs link each), `launch-kit.md` with every post, prepared answers, submission list, schedule, post-launch routine (launch plan § U)
- L — Final human review of every public surface, after N–V and directly before Release; cross-surface consistency matrix (launch plan § L)
- Release mechanics before tagging: `changeset pre exit` (15 queued changesets), publish via pnpm, `scripts/verify-scaffold.mjs` green, publish T's release notes
- Launch — run U's plan
- Assessed-but-deferred features live in `.agent/docs/product/backlog.md`
- Fix scripts/vercel-build-check.mjs: since / prerenders via a live vex.query, the placeholder NEXT_PUBLIC_CONVEX_URL makes the pristine build fail on every run (pre-existing at a180967). Pass through a real dev URL when present, or make HomePage degrade when Convex is unreachable
- F follow-up — spec 2026-09-18-lifecycle-hooks-validation step 8: write `scripts/verify-hooks-wiring.mjs`, add a `createVexMutations` assertion to `scripts/verify-scaffold.mjs`, and write `apps/docs/src/content/docs/guides/lifecycle-hooks.mdx` (apps/test + base-nextjs template wiring, and the marketing-site slug validator, are done)
- Concurrent-edit conflict detection already assessed — see backlog.md § Concurrent-edit conflict-resolution UX

## Recently Done
- 4. E — Live preview — shipped `b5263dc`, 2026-09-20 (spec 2026-09-18-live-preview; ADR-012, with a dual `postMessage` + `BroadcastChannel` transport and a cookie-gated public route)
- 4. E follow-up — live preview amendments 1–3 (spec 2026-09-18-live-preview steps 9–14): root `admin.livePreview` maps, `{ server }` URL resolvers, `VexCallbackApi`, `VexDataModel`-typed callback ctx, globals overlay, root `VexConfigProvider`
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
- Consume @vexcms/react from source in dev (removes the tsup watch loop; see backlog)
- B3 — Backend-neutral query args (spec 2026-10-21-backend-neutral-query-args) — before 0.1.0 tag
- K — codebase conventions refactor (spec 2026-10-25-codebase-conventions-refactor)
- 8. H — Edit-view overhaul: unsaved-changes nav guard, duplicate document, duplicate block
