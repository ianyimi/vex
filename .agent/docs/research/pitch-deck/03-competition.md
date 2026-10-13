# 03 — Competition: Payload, BaseHub, and the rest

> Feeds slides: **Competition and alternatives · Positioning · Differentiation**.
> Full citations: `sources/competitors.md` (as of 2026-10-12). This document corrects that file's
> VexCMS-status cells using the repo (`apps/docs/src/content/docs/roadmap.md`, `backlog.md`).
> DocSend data shows investors spend the most time on the competition slide (+51% YoY), so
> keep it specific (`sources/business-model-comps.md` §6.3).

## The two named competitors

### Payload — closest on developer experience

| | |
|---|---|
| What it is | MIT, TypeScript code-first CMS, Next.js-native, Mongo or Postgres that you run yourself |
| Status | **Acquired by Figma 2025-06-17**; still MIT. **Payload Cloud: "Deployment of new projects is currently paused"** ([FAQ](https://payloadcms.com/payload-has-joined-figma)). Figma's stated rationale ties it to Figma Sites ([Figma blog](https://www.figma.com/blog/payload-joins-figma/)) |
| Traction | 45.2k GitHub stars; ~998k weekly npm downloads; prior funding $4.7M seed (2022) |
| Enterprise tier | Sales-led: SSO, audit logs, publishing workflows, AI, A/B; **Visual Editor and Multi-Player Editing are "Coming Soon"** ([enterprise](https://payloadcms.com/enterprise/multi-player-editing)) |
| Weak spots developers report | Next.js coupling and peer-dependency breakage; MongoDB ops burden; v2→v3 migration bugs; data-migration friction (issue links in `sources/competitors.md` §3.6) |
| VexCMS angle | The same authoring model (`defineCollection`, globals, blocks, access), so "your content modelling carries over" (`apps/www/convex/seed.ts:878-904`). VexCMS adds live subscriptions and removes the database to operate. **Payload's multiplayer editing is unshipped; on Convex it is mostly a UI problem** (`backlog.md:323-404`). Access control is roughly at **parity**: Payload collection-level access functions can return a `Where` constraint that is merged into the database query ([Payload docs](https://payloadcms.com/docs/access-control/overview); field-level access cannot return constraints, per [field docs](https://payloadcms.com/docs/access-control/fields)). VexCMS's `{ constraints }` rules do the same on Convex (`withIndex` ranges), where no CMS offered this before. Don't pitch it as unique against Payload |

### BaseHub — the feature roadmap to borrow from

| | |
|---|---|
| What it is | Closed-source hosted SaaS: Git-style branching and commits, real-time multiplayer (yjs), AI agents, MCP server, analytics/forms/search blocks, GraphQL SDK |
| Status | **Joined Vercel 2026-06-02.** The founder moved to the v0 team. "Vercel is not planning to enter the CMS space … nothing changes for now … We'll share more information soon" ([blog](https://basehub.com/blog/basehub-is-joining-vercel)). In Dec 2025 BaseHub had announced a rewrite to Git/file-native storage and an open-source "BaseHub Core"; neither had shipped as of 2026-10-12, and BaseHub said its Postgres model meant "a lot of time fixing bugs and building new features that Git already had" ([blog](https://basehub.com/blog/files-agents-and-the-future-of-basehub)) |
| Pricing | Personal free · Team $15/user/mo · Unlimited $350/mo flat; usage-metered analytics events, emails, assets ([pricing](https://basehub.com/pricing)) |
| Traction | ~14k weekly npm downloads of `basehub`; funding not disclosed (only a passive stake from a fund linked to Vercel's CEO) |
| VexCMS angle | BaseHub had to build real-time on top of Postgres and Pusher (`<Pump />`). Convex provides live queries at the database layer. BaseHub customers have an uncertain roadmap, and VexCMS can offer a **code-first, self-hosted, Apache-2.0** alternative plus a migration path |

## BaseHub feature matrix → VexCMS adoption plan

The founder plans to adopt many BaseHub features (2026-10-12). VexCMS status below is
**repo-verified**. The "Free / paid" column is a **[HYPOTHESIS]**. Decide it before shipping
each feature, because the site promises "Nothing free today becomes paid later" (`seed.ts:989`).

| BaseHub feature | VexCMS today | Convex building block | Suggested tier |
|---|---|---|---|
| Live data / `<Pump />` refresh | ✅ Every read is a Convex subscription (`seed.ts:828`) | native | Free (already) |
| Draft mode / toolbar / preview | ✅ Live preview of unsaved state (ADR-012) | — | Free (already) |
| Webhooks / workflow triggers | ◐ Lifecycle hooks (`afterChange` via triggers) shipped; no outbound-webhook UI | scheduled functions, HTTP actions | Free |
| View-only role | ✅ RBAC + `anonRole` (stronger: field-level, compiled to indexes) | — | Free (already) |
| Templates / starters | ✅ `create-vexcms` marketing-site + bare templates | — | Free; premium templates optional |
| Media + asset explorer | ◐ Media library on Convex storage; no image transforms/CDN | file storage + actions | Free (self-hosted; the customer brings their own storage/CDN adapter) |
| Draft / WIP staging (Hidden Blocks) | 🔄 Versioning & drafts in progress (spec `2026-09-20-versioning-drafts`) | — | Free (promised) |
| History, diff, time-travel, restore | 🔄 Same spec; `vex_versions` stores whole-document snapshots, so diffs can be computed later (`backlog.md:614-618`) | — | Free history; compliance export → enterprise audit package |
| **Branching / commits / merge** | 📋 Enterprise (`roadmap.md:92`); data model is ready, merge semantics not designed (`backlog.md:548-627`) | index on `(branch, documentId)` | **Paid**, the main moat |
| Real-time multiplayer: presence, facepile, cursors, co-editing | 📋 Backlog. Presence ≈ the cost of one existing subscription; rich-text CRDT via Plate's `@platejs/yjs` + a custom Convex Yjs provider (`backlog.md:323-404`) | subscriptions; component for Yjs sync | Presence free (it is a core real-time story); paid tier optional for large-team co-editing |
| Search | ◐ Convex full-text index auto-generated per collection; list-view search UI is in progress (spec I) | full-text + vector search | Free |
| Localization / variants | 🔄 Storage design in progress; feature listed as Future (`apps/docs/.../roadmap.md:39,66`) | — | Paid (already listed as an enterprise package) |
| Analytics / event block | 🔭 Exploring: per-document and per-block metrics in the admin (`launch-readiness spec:1076-1090`) | tables, crons for rollups (in the customer's own deployment) | Free or enterprise licence — never metered |
| Forms / submissions | 📋 Form builder planned | tables, actions (email via the customer's provider) | Free |
| MCP server | ❌ (ships `llms.txt` only) | typed functions are easy to expose | Free (adoption driver for agents) |
| AI chat / agents / autofill / translation | ❌ | actions + LLM APIs (customer's own API keys) | Free or enterprise licence (bring-your-own-key, no VexCMS-run service) |
| Undo / redo | ❌ | — | Free |
| Approval workflows | 📋 Enterprise | — | Paid (BaseHub has no discrete approval feature, so this differentiates) |

Legend: ✅ shipped · ◐ partial · 🔄 in progress · 📋 planned · 🔭 exploring · ❌ none.

## Market map

```svg
<svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="13">
  <line x1="60" y1="200" x2="600" y2="200" stroke="var(--border)"/>
  <line x1="330" y1="30" x2="330" y2="370" stroke="var(--border)"/>
  <text x="60" y="390" fill="var(--muted)">Code-first (TypeScript config)</text>
  <text x="600" y="390" fill="var(--muted)" text-anchor="end">UI-first (dashboard-configured)</text>
  <text x="335" y="24" fill="var(--muted)">Real-time native</text>
  <text x="335" y="385" fill="var(--muted)">Request / response</text>
  <circle cx="120" cy="70" r="9" fill="var(--accent)"/><text x="134" y="74" fill="var(--fg)" font-weight="bold">VexCMS (self-host, Apache-2.0)</text>
  <circle cx="200" cy="110" r="6" fill="var(--c2)"/><text x="212" y="114" fill="var(--fg)">Sanity (closed Content Lake)</text>
  <circle cx="470" cy="70" r="6" fill="var(--c3)"/><text x="482" y="74" fill="var(--fg)">BaseHub (Vercel)</text>
  <circle cx="500" cy="110" r="6" fill="var(--c4)"/><text x="512" y="114" fill="var(--fg)">Storyblok</text>
  <circle cx="490" cy="145" r="6" fill="var(--c4)"/><text x="502" y="149" fill="var(--fg)">Builder.io</text>
  <circle cx="110" cy="260" r="7" fill="var(--c1)"/><text x="124" y="264" fill="var(--fg)">Payload (Figma)</text>
  <circle cx="150" cy="295" r="6" fill="var(--c5)"/><text x="162" y="299" fill="var(--fg)">Strapi</text>
  <circle cx="210" cy="230" r="6" fill="var(--c5)"/><text x="222" y="234" fill="var(--fg)">TinaCMS</text>
  <circle cx="190" cy="330" r="6" fill="var(--c5)"/><text x="202" y="334" fill="var(--fg)">Keystatic</text>
  <circle cx="440" cy="240" r="6" fill="var(--c6)"/><text x="452" y="244" fill="var(--fg)">DatoCMS</text>
  <circle cx="480" cy="290" r="6" fill="var(--c6)"/><text x="492" y="294" fill="var(--fg)">Contentful (Salesforce)</text>
  <circle cx="420" cy="330" r="6" fill="var(--c6)"/><text x="432" y="334" fill="var(--fg)">Directus · Hygraph</text>
</svg>
```

Placement is justified with sources in `sources/competitors.md` §7. Only VexCMS and
Sanity are both code-first and real-time, and Sanity's data layer is proprietary with no
self-host option. Caveat for the slide: VexCMS's "real-time" today means live data and
admin views. Multiplayer co-editing (BaseHub, Sanity) is still on the backlog.

## Differentiation table (slide-ready, repo-verified VexCMS column)

| | VexCMS | Payload | BaseHub | Sanity | Strapi | Directus |
|---|---|---|---|---|---|---|
| TS config generates schema + typed API | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Live data subscriptions (no polling/webhooks) | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Multiplayer co-editing / presence | 📋 | "Coming soon" (Ent.) | ✅ | ✅ | ❌ | ❌ |
| Row-level access rules applied inside the DB query | ✅ Convex `withIndex` | ✅ `Where` constraints (collection level) | ❌ not found | not verified | not verified | not verified |
| No separate database to operate | ✅ (Convex) | ❌ | n/a (SaaS) | n/a (SaaS) | ❌ | ❌ |
| Self-hostable, permissive OSS | ✅ Apache-2.0 | ✅ MIT | ❌ | ◐ Studio only | ✅ MIT core | ◐ source-available |
| Content branching | 📋 paid | ❌ | ✅ | ◐ releases (Ent.) | ❌ | ❌ |
| Drafts / versions | 🔄 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rich text | 🔄 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Maturity (stars) | 8 | 45.2k | closed | 6.4k | 73.3k | 38.4k |

Present this honestly. Investors will see the last three rows, so the story is
"architectural advantage, with a feature-parity roadmap", not "already better".

## Other alternatives (one line each, for the appendix)

- **Sanity:** the strongest real-time + TS-schema product, but closed Content Lake, GROQ lock-in, and an SSO tier that is +373% over base ($87M Series C, May 2025).
- **Strapi:** largest OSS footprint (73k stars, $31M Series B 2022); no co-editing; painful v4→v5 plugin breakage.
- **Contentful:** being acquired by Salesforce (~$1.5B); expensive, with API rate caps.
- **Directus:** wraps your own SQL database; source-available licence with a revenue threshold; $7M Series A.
- **Storyblok / Builder.io / DatoCMS / Prismic / Hygraph:** UI-first SaaS; different buyer (marketers).
- **TinaCMS / Keystatic / Decap:** git-based, not real-time by architecture.
- **Status quo on Convex:** hand-built admin pages, or the Convex dashboard (an ops console, not an editor UI).
- **Convex-native attempts:** `get-convex/cms-template` (official starter, 22★, last push 2026-02); `obkaro/convex-cms` (5★, stalled); `basic-blog-convex-blog-cms` (blog-only component, ~539 weekly downloads); `@cms-subir/*` (no public repo). None is a maintained, complete CMS (`sources/competitors.md` §6).
- **Analogues on other BaaS platforms:** FireCMS on Firebase; Supabase-cms and Supamode on Supabase. These show that "code-first CMS native to a BaaS" is an established category pattern.
