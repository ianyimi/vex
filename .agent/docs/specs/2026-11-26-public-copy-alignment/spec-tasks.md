---
status: in-progress
spec_id: 2026-11-26-public-copy-alignment
touches: [".agent/docs/specs/2026-11-06-public-presence/public-copy.md", "README.md", "apps/docs/src/content/docs/roadmap.md", "apps/docs/src/content/docs/compare.mdx", "apps/www/convex/seed.ts", "apps/test/convex/seed.ts", "apps/www/src/vexcms/blocks/FAQ/config.ts", "apps/test/src/vexcms/blocks/FAQ/config.ts", ".agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md", ".agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch", ".agent/docs/product/post-v0.1.0-plan.md", ".agent/docs/product/roadmap.md", ".agent/docs/product/v0.1.0-launch-plan.md", ".agent/docs/product/v0.1.0-final-sprint.md", ".agent/docs/product/launch-coordination.md"]
prompt_version: 1
---

# 2026-11-26-public-copy-alignment — Tasks

Launch plan item 21 (COPY, `v0.1.0-final-sprint.md` § 3b). Agent-implemented. Copy only: no
package code, no changesets.

## Step 1 — Wording source: `public-copy.md` [agent]
Why: VW-001: every surface quotes `public-copy.md`, so it changes first.
Verify: `rg -n "after the free roadmap" .agent/docs/specs/2026-11-06-public-presence/public-copy.md` empty; roadmap section lists the 5 groups in spec order.
- [ ] Paid-work line, Sponsors bio, Funding (+ company sponsor ask), Roadmap, Founding members empty state, vote Discussion link

## Step 2 — Docs: roadmap + compare [agent]
Why: docs roadmap is the roadmap's source of truth; compare page carries the paid line and the scope section.
Verify: `pnpm --filter docs build` green; `rg "after the free roadmap" apps/docs` empty.
- [ ] `roadmap.md` new order, vote link, adoption-guide link, paid line
- [ ] `compare.mdx` paid line, "When to pick something else" → Convex-scope section linking Convex limits

## Step 3 — README [agent]
Why: H10 (skill), adoption guide, Founding members, sponsor ask, roadmap, paid line.
Verify: `rg "after the free roadmap" README.md` empty; every new link returns 200 after the docs deploy.
- [ ] Roadmap paragraph, Docs section (skill + adoption guide), Sponsors (ask) + `### Founding members`, License line

## Step 4 — Seeds + FAQ block defaults (both apps) [agent]
Why: www/apps/test FAQ + roadmap page + announcement draft quote the old line and order.
Verify: `pnpm --filter www typecheck`, `pnpm --filter test typecheck`; `seed:reinit` on both dev deployments; `rg "after the free roadmap" apps` empty.
- [ ] FAQ answers + block defaults, roadmap page planned items, announcement "What's next"

## Step 5 — Launch kit + internal plans [agent]
Why: Q3/Q6/Q8 answers; internal track order mirrors the public one.
Verify: `rg -n "after the free roadmap|as demand appears|search improvements" .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md .agent/docs/product/post-v0.1.0-plan.md .agent/docs/product/roadmap.md` empty.
- [ ] launch-kit Q3/Q6/Q8; post-v0.1.0-plan track order; product/roadmap.md table; GUARD prompt line

## Step 6 — Rebuild `copy-flip.patch` [agent]
Why: seed hunks stopped applying; SK's new `@alpha` lines are uncovered.
Verify: `git apply --check .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch` exits 0.
- [ ] Regenerate against the post-COPY tree

## Step 7 — Vote Discussion [dev]
Why: the roadmap's voted group links it.
Verify: the Discussion is pinned in Ideas; its URL replaces the Ideas-category link on every surface (step 7 list in spec.md).
- [ ] Developer posts + pins, sends URL; agent swaps the link

## Step 8 — Bookkeeping [agent]
Why: launch plan item 21, final-sprint box, board rows, session log.
Verify: item 21 ticked; board COPY rows done/human.
- [ ] Tick item 21 + final-sprint COPY; board section; session log
