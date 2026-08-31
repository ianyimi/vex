---
status: draft
spec_id: 2026-08-30-wp4-docs-repo-polish
touches:
  - "README.md"
  - "ALL-FIELD-TYPES-ADDED.md"
  - "COLOR-AND-TABS-FIELDS-IMPLEMENTED.md"
  - "FIELD-TYPES-MIGRATION-PLAN.md"
  - "JSDOC-COMMENTS-ADDED.md"
  - "REBUILD-MASTER-GUIDE.md"
  - "REBUILD-QUICKSTART-FINAL.md"
  - "REBUILD-TEXT-FIELD-COMPLETE.md"
  - "REBUILD-TEXT-FIELD-INPUT-OUTPUT-TYPES.md"
  - ".rebuild/*.md"
  - "apps/docs/README.md"
  - "apps/docs/package.json"
  - "apps/docs/astro.config.mjs"
  - "apps/docs/src/content/docs/**"
  - "pnpm-workspace.yaml"
  - ".agent/docs/**"
prompt_version: 1
---

# 2026-08-30-wp4-docs-repo-polish — Tasks

Parent: `2026-08-30-launch-readiness` WP-4. All groups are [agent] except the
GitHub-page application, and are mutually independent — safe to run as one
parallel batch. Session decisions (incl. 2026-08-30 developer review): full
README rewrite; **docs written as if the full launch plan has shipped** —
quickstart leads with `pnpm create vexcms@latest`; MIT→Apache-2.0 text folded
in here (WP-1 keeps LICENSE/NOTICE + package.json fields); imminent features
shown as "Coming soon" (richtext, json, email, textarea, tabs, ui); RBAC docs
teach constraints-first; the server data surface is publicly named the
**Local API** and gets its own guide; llms.txt ships via
`starlight-llms-txt@0.10.0`; agents skim-and-decide on stale-file salvage;
GitHub page drafted by agents, applied by dev.

## Step 1 — Stale markdown sweep [agent]
Why: 8 root + 5 `.rebuild/` status dumps from past agent sessions pollute the
repo landing page. `.rebuild/reference/` MUST survive (WP-2 ports templates
from it).
Verify:
- [ ] The 13 listed files are gone; `.rebuild/reference/` untouched
- [ ] Disposition list reported (all pre-verdicted delete in spec.md; agent skim confirms)
- [ ] Dangling citation in `spacetimedb-vs-convex-port-feasibility.md` repointed
- [ ] `harness struct` run afterward

## Step 2 — README full accuracy rewrite [agent]
Why: The README is the meetup first impression and is wrong on ~6 axes:
fictional fields, a sample that cannot compile, master-era features, dead
package names, MIT license text. Docs assume the full release plan lands.
Verify:
- [ ] Field table lists exactly the real 11 types + a labeled "Coming soon" line
- [ ] RBAC feature example is constraints-first (`withIndex` read rule, predicate
      mutation rule); no bare-callback-as-default example; no vendor lock-in copy
- [ ] Quickstart leads with `pnpm create vexcms@latest` (`--bare`, `--orgs` noted), manual install as secondary path
- [ ] "Building with LLMs" section points agents at `/llms.txt` variants
- [ ] Every code sample imports only symbols exported from the real package barrels
- [ ] No "MIT" remains; license text says Apache-2.0
- [ ] Forbidden-token grep in spec.md Step 2 passes

## Step 3 — Starlight de-boilerplate [agent]
Why: `index.mdx`, `apps/docs/README.md`, and both Diataxis placeholders are
unedited template text — instant credibility loss for anyone clicking Docs.
Verify:
- [ ] Placeholders deleted; index.mdx sells VexCMS with real links
- [ ] `pnpm --filter docs build` passes (zero TypeDoc warnings — enforced)

## Step 4 — group + upload field doc pages [agent]
Why: 9 of 11 field types have `fields/*.mdx` pages; `group` and `upload` are
missing. Developer review adds a "Coming soon" fields page (DD 8). Drive-by:
`blocks.mdx` imports a nonexistent `image` factory.
Verify:
- [ ] `fields/group.mdx` + `fields/upload.mdx` follow the field-page format;
      every option row traced to the real `*FieldInput` types
- [ ] `fields/coming-soon.mdx` created (badge, no API docs, roadmap pointers)
- [ ] `blocks.mdx` unused `image` import removed
- [ ] `pnpm --filter docs build` passes

## Step 5 — Roadmap page rewrite [agent]
Why: `roadmap.md` is inverted from reality. Source is the WP-3 seed list as
corrected by developer review (DD 12): access index resolution SHIPPED,
per-collection Convex codegen removed (no plans), "In progress" holds only
genuinely active work (versioning & drafts), form builder directly after the
additional-fields entries.
Verify:
- [ ] Every "Shipped" claim exists in the codebase; nothing shipped listed as planned
- [ ] No "per-collection codegen"; no "*Specs written.*" caption
- [ ] `pnpm --filter docs build` passes

## Step 6 — Guides for the three undocumented features [agent]
Why: `defineGlobal`, pagination, and `defineAccess`/RBAC are the strongest
shipped features with zero docs. RBAC guide is constraints-FIRST (DD 9):
`{ constraints, filter? }` is the recommended shape — compiled into Convex
queries via the Local API — callbacks are the escape hatch.
Verify:
- [ ] `guides/globals.mdx`, `guides/pagination.mdx`, `guides/access-control.mdx` exist
- [ ] Access guide orders shapes constraints → callback → boolean, links `/guides/local-api/`,
      and documents the one-file `hasPermission` wrapper (closes over access +
      `useAuth()`, typed via the `__subjects` phantom — mirrors `apps/www/src/auth/hasPermission.ts`)
- [ ] Pagination guide imports generated row types from `~/vex.types` (never
      hand-rolled interfaces) and hardcodes the collection slug in examples
- [ ] Every code sample checked against the real exports/signatures in `packages/*/src`
- [ ] `pnpm --filter docs build` passes

## Step 7 — GitHub page drafts [agent drafts, dev applies]
Why: Repo description, topics, social preview are set in the GitHub UI; the
admin screenshot needs the WP-3/WP-6 deployed site.
Verify:
- [ ] Draft file `github-page.md` with description (≤350 chars), 10 topics, social-preview brief
- [ ] README screenshot placeholder confirmed (placed by Step 2)
- [ ] [dev] applies description/topics/preview in GitHub settings

## Step 8 — Local API guide [agent]
Why: The Local API (`vexServerApi` from `@vexcms/core/server` — the
Payload-familiar name for direct, typed data access inside your own Convex
functions) is the enforcement point for RBAC and the surface `{ constraints }`
rules compile into. Referenced by the RBAC guide; currently undocumented.
Verify:
- [ ] `guides/local-api.mdx` documents setup + get/find/search/create/update/remove/globals
      with compiling examples, constraint compilation, and server-only `access` overrides
- [ ] `pnpm --filter docs build` passes

## Step 9 — llms.txt for AI agents [agent]
Why: Users should be able to hand their coding agent the whole VexCMS API
surface. `starlight-llms-txt@0.10.0` (newest version compatible with astro 6 /
starlight 0.38) generates `/llms.txt`, `/llms-full.txt`, `/llms-small.txt`
from the docs content at build time.
Verify:
- [ ] Catalog entry exact `0.10.0`; `apps/docs` dep + plugin wired in `astro.config.mjs`
- [ ] `pnpm install` then `pnpm --filter docs build` passes
- [ ] `apps/docs/dist/llms.txt`, `llms-full.txt`, `llms-small.txt` exist and name VexCMS
