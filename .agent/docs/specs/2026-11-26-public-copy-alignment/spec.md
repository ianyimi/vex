---
status: in-progress
spec_id: 2026-11-26-public-copy-alignment
prompt_version: 1
---

# Public copy alignment (COPY)

Launch plan item 21, `v0.1.0-final-sprint.md` § 3b. Brings every public surface in line with the
business plan's approved copy decisions. Copy only: no package code, no changeset.

## Sources

- `.agent/docs/business/plan/10-handoffs.md` is **not on disk** (2026-11-26: `.agent/docs/business/`
  holds only `.DS_Store`; no copy anywhere under `~`). Developer: the launch plan and final sprint
  are the most current files. Sources used instead: developer decisions 2026-11-22 (session log),
  the final-sprint COPY prompt (2026-11-24 edit), launch plan item 21, and this spec's interview
  (2026-11-26).

## Design Decisions

1. **Paid-work line** (every surface): "Paid add-ons may come later, as separate packages. The core
   stays Apache-2.0, and nothing free becomes paid." Only "after the free roadmap" is dropped. No paid
   add-on or tier is ever named.
2. **Public roadmap order** (interview: `vex init` first):
   1. `vex init`; 2. the plugin launch (plugin system + marketplace + free agent plugin);
   3. form builder, SEO fields, localization; 4. brownfield adoption; 5. the rest, ordered by votes:
   scheduled publishing, TanStack Start adapter, outbound webhooks, API keys + team management.
   No "search improvements". **Presence/facepile is never public** (developer, 2026-11-26): not on
   the roadmap, the vote, or any "coming soon" copy; the developer builds it some time after 0.1.0.
3. **Stale-write guard** is not listed by COPY: it ships *in* 0.1.0 (GUARD, § 3c, not built yet).
   GUARD's prompt gains a line to add it to "Shipped in 0.1.0" on the docs + www roadmap when it lands.
4. **Vote link.** Until the developer posts the Discussion (step 7), every surface links the Ideas
   category (`https://github.com/ianyimi/vex/discussions/categories/ideas`, 200 on 2026-11-26), a
   live page where the vote will sit. Step 7 swaps in the Discussion URL.
5. **Company sponsor ask** (interview): "If your company relies on VexCMS, please sponsor." goes in
   `public-copy.md` § Funding and the README Sponsors section only. The Sponsors bio only loses
   "after the free roadmap", so it is final now (PP-8).
6. **Compare page** (developer, interview): "When to pick something else" becomes one short
   section. Pick something else when Convex doesn't fit your problem. Link Convex's limits page
   (`https://docs.convex.dev/production/state/limits`, 200 on 2026-11-26). Otherwise, if you're on
   Convex, VexCMS is the content layer built for it. The six product-by-product bullets go.
7. **README** gains: a `### Founding members` subsection under `## Sponsors`, reading "No founding
   members yet." (LEGAL adds the /founding link later); the agent skill guide (H10) and the adoption
   guide in `## Docs`; the sponsor ask; the new roadmap paragraph and the paid line.
8. **Launch kit Q3**: Verbatim = the new paid line only. Facts: `/founding` is public at launch;
   point to it, don't summarise it. No tier name, no date. Q6 links the adoption guide; Q8 quotes
   the new order.
9. **Internal plans**: `post-v0.1.0-plan.md` track order = INIT → PL → FR-core → paid add-ons
   (private, unchanged wording and date: out of scope) → AD → FR-rest (voted). PRES is unscheduled,
   post-launch, off the voted list. The
   maprios migration (MW) stays out of the order. `product/roadmap.md` mirrors this.
10. **Mirrors**: the www and apps/test seeds carry the same roadmap items and order (apps/test keeps
    its own `status` values). Re-seed both with `seed:reinit` (P-021).
11. **Out of scope**: the marketing-site template's roadmap/FAQ (template-sync), the paid-release
    date in `post-v0.1.0-plan.md`, LEGAL's /founding page.

## Canonical copy (lands in `public-copy.md` § Roadmap)

Intro: Everything below is free and lands in the Apache-2.0 core. It ships in this order.

1. **`vex init`** — One command adds VexCMS to an existing Next.js + Convex app. It never changes your existing Convex tables.
2. **Plugin launch** — The extension points 0.1.0 ships become a supported plugin API for collections, fields, hooks, access rules and admin views. It launches with a plugin marketplace and a free agent plugin.
3. **Form builder, SEO fields and localization** — Forms for site visitors with generated validation and stored submissions; meta title, description, Open Graph image, canonical URL and redirects; per-field locale values with locale-aware drafts.
4. **Brownfield adoption** — Add VexCMS to an existing Convex app table by table, without migrating the data it already holds. Until then, [adopt a table by hand](https://docs.vexcms.dev/guides/adopt-existing-tables/).
5. **Voted features** — Ordered by votes in the [roadmap vote](<vote URL>) on GitHub Discussions.
   - **Scheduled publishing** — Publish and unpublish at a set time, on Convex's scheduler.
   - **TanStack Start adapter** — The admin panel and the caching helpers on a second framework.
   - **Outbound webhooks** — Notify other services when content changes.
   - **API keys and team management** — Invite people, assign roles, and issue scoped keys for reading content from outside.
   - **Presence and facepile** — See who else is viewing or editing a document.

## Vote Discussion draft (developer posts in Ideas and pins it; step 7)

**Title:** Roadmap vote: which free feature ships next?

**Body:**

> After 0.1.0, VexCMS ships `vex init`, then the plugin launch, then the form builder, SEO
> fields and localization, then brownfield adoption. The features below come after those, and
> your votes decide their order.
>
> **How to vote:** upvote (▲) the comment for each feature you want. Vote for as many as you
> like. Please don't reply with "+1"; an upvote counts, a reply doesn't.
>
> Want something that isn't listed? Open a new discussion in Ideas.
>
> Everything here is free and lands in the Apache-2.0 core. The full roadmap:
> https://docs.vexcms.dev/roadmap/

Then post one top-level comment per feature, each with the roadmap line as its text:

1. **Scheduled publishing**: Publish and unpublish at a set time, on Convex's scheduler.
2. **TanStack Start adapter**: The admin panel and the caching helpers on a second framework.
3. **Outbound webhooks**: Notify other services when content changes.
4. **API keys and team management**: Invite people, assign roles, and issue scoped keys for reading content from outside.

Swap targets once the URL exists (`rg -n "discussions/categories/ideas"` lists them):
`public-copy.md`, `README.md`, `apps/docs/src/content/docs/roadmap.md`, both seeds' roadmap
items, `launch-kit.md` Q8.

## Implementation

Steps and verifies: `spec-tasks.md`. Each step is a text edit against the strings above. Locks
(board § Locks): both seeds, the launch plan + backlog, the launch kit.

### Step 6: rebuilding `copy-flip.patch`

The scope is LK spec step 11's, plus SK's lines (`skills/vexcms-project-init/SKILL.md`,
`guides/agent-skills.mdx`, `guides/deployment.mdx`). Build it outside git: copy each target file
twice into `/tmp/copy-flip/{a,b}`, apply the flip edits to `b`, run
`git diff --no-index a b`, and rewrite the prefixes to repo paths. No worktree, no index writes.
The announcement stays a draft (LK decision 13).
