# Use-case backlog

Private (Design Decision 17, `2026-11-09-golden-use-cases`). One row per application type ×
the shipped-feature gaps blocking it, with "unblocked when" and a feature-rank table counting
how many app types each gap unblocks — for ordering post-launch feature work. Built from
`inventory.md`'s coverage matrix and "Not shipped" table in the same spec directory.

## The four golden scenarios

Every scenario is covered end to end today (`inventory.md`'s coverage matrix) and is not a
backlog entry — listed here only as the baseline the rest of this file compares against.

| Scenario | Template | Ports (dev) | Launch day(s) covered | Design decisions proved |
|---|---|---|---|---|
| Magazine | `--bare` | 3200 | D2–D5 | live preview (D2), config → schema/types (D3), author/editor RBAC + slug `validate()` (D4), `--bare` scaffold → production (D5) |
| Real estate | `--bare` | 3210 | D4 alternate | owner rules, field maps, saved views, bulk action |
| Conference | marketing-site | 3220 | D3/D4 alternate | config → blocks + global, cross-document `validate()` |
| Restaurant | marketing-site | 3230 | D2 alternate | menu + global live preview |

## Backlogged application types

"Buildable today?" means buildable using only shipped VexCMS primitives (fields, admin,
access control, Local API) without a developer hand-rolling a missing CMS primitive as custom
Convex/Next code. Every "Blocking gap(s)" cell below cites the matching `apps/docs` roadmap
item (`roadmap.md` § After 0.1.0) or a `backlog.md` heading that exists today. **Deviation:**
the spec's citation rule names a `planned`-labelled GitHub issue per gap (#53/#57/#59/#60/#63);
those issues were deleted from `ianyimi/vex` pre-launch (board § Log, CW/LK, 2026-11-10;
`roadmap.md` no longer links them either — LK decision 12 is re-deciding the public-tracking
convention). Citing the roadmap item name instead keeps every row traceable without a dead link;
re-link to new issue numbers if LK's re-decision restores public tracking.

| App type | Needs | Blocking gap(s) | Buildable today? | Unblocked when |
|---|---|---|---|---|
| Agency multi-client (`--orgs`) | Multi-tenant orgs, per-org teammate invites | API keys and team management (invites) — `roadmap.md` § After 0.1.0 | No — `--orgs` ships (F56) but nothing invites a second person into an org end to end | that roadmap item ships |
| Docs site | Structured doc tree, versioned pages, full-text search | — | Yes, but out of scope by developer preference (Design Decision 1) — dedicated docs tools serve this job better, not a VexCMS gap | N/A |
| Multilingual corporate site | Per-locale content + routing | Localization — `roadmap.md` § After 0.1.0 | No | that roadmap item ships |
| Newsroom with embargoes | Timed/embargoed publish | Scheduled publishing — `roadmap.md` § After 0.1.0 | No — drafts/publish exist (F31), no timed release | that roadmap item ships |
| Job board | Visitor-submitted applications | Form builder (visitor submissions) — `roadmap.md` § After 0.1.0 | Partial — postings buildable today; applications need a hand-rolled Convex mutation outside the content model | that roadmap item ships |
| Membership / community submissions | Visitor-submitted profiles or posts | Form builder (visitor submissions) — `roadmap.md` § After 0.1.0 | Partial — same workaround as job board | that roadmap item ships |
| Nonprofit donation / volunteer forms | Visitor-submitted volunteer signup; donation intake | Form builder (visitor submissions) — `roadmap.md` § After 0.1.0 | Partial — donation itself can link out to an external processor (no VexCMS gap there); volunteer signup needs the same workaround as job board | that roadmap item ships |
| Headless mobile-app content | API-key-authenticated REST reads for a native client | `backlog.md` § HTTP API for vex server functions (API-key auth) | No — the Local API (F49) is a server-side TypeScript import, not a REST surface a mobile client can call | that backlog entry ships |
| Franchise multi-site | One org per location, shared brand, local content | API keys and team management (invites) — `roadmap.md` § After 0.1.0 | No — same org-invite gap as Agency multi-client | that roadmap item ships |
| Event ticketing | Ticket/RSVP forms, embargoed event pages | Form builder (visitor submissions) — `roadmap.md` § After 0.1.0; Scheduled publishing — `roadmap.md` § After 0.1.0 | No | both roadmap items ship |
| Podcast network | Episode audio uploads, show/season relationships, RSS feed | — | Yes — `upload`/media (F14, F36), `relationship` (F13), `array`/`group` (F15, F16) cover the content model; an RSS route is app-level routing, not a CMS gap | N/A |
| Product catalog | Variants/SKUs, external inventory sync | Outbound webhooks — `roadmap.md` § After 0.1.0 | Partial — the catalog itself (F15/F16 array/group) is buildable today; syncing an external inventory system needs webhooks | that roadmap item ships |
| Course / LMS | Drip-released lessons, role-gated content | Scheduled publishing — `roadmap.md` § After 0.1.0 | Partial — role-gating is buildable today (F39–F41 RBAC); drip scheduling is not | that roadmap item ships |

### Shipped but not demoed (not backlogged)

Per `inventory.md`'s Listed exceptions, these ship but aren't shown on camera for reasons
unrelated to a feature gap — not new backlog rows:

- **F57 `--monorepo`/`--yes`** — the examples repo is independent folders (Design Decision 5);
  scenario answers are typed live, not defaulted. Revisit only if a monorepo example is added.
- **F59 custom storage adapter** — a guide-only extension point; no S3/decision 15 adapter exists to
  demo honestly. If a future app type specifically needs CDN-scale media (large product catalogs,
  a podcast network's audio library) past Convex file storage, re-evaluate against whichever
  storage adapter ships first.

## Feature rank

How many backlogged app types each gap unblocks, recounted from the table above:

| Gap | App types unblocked | Count |
|---|---|---|
| Form builder (visitor submissions) | Job board, Membership/community submissions, Nonprofit donation/volunteer forms, Event ticketing | 4 |
| Scheduled publishing | Newsroom with embargoes, Event ticketing, Course/LMS | 3 |
| API keys and team management (invites) | Agency multi-client, Franchise multi-site | 2 |
| Localization | Multilingual corporate site | 1 |
| HTTP API for vex server functions (API-key auth) | Headless mobile-app content | 1 |
| Outbound webhooks | Product catalog | 1 |

## How to use this file

When picking the next post-launch feature, prefer the top of the Feature rank table — it
unblocks the most backlogged app types per unit of work, not just the single app type that
prompted the request. Add a new app type as a new row whenever a backlogged project idea
surfaces (a support thread, a GitHub discussion, a developer's own next build); recompute the
rank table's counts in the same edit. A gap that reaches 0 (every citing roadmap item ships) is
removed from the rank table, and every row that cited it moves to "buildable today? yes".
