# Launch kit — VexCMS 0.1.0

> Every public sentence in this kit — every post, title, comment, listing field and PR line —
> is written by the developer. Agent-run steps in this file only supply facts, links, rules
> and checks; nothing here is generated or AI-edited text, because Hacker News bans exactly
> that in both posts and comments ("Please don't put generated text in HN posts... Don't post
> generated text or AI-edited text", `sources.md` §1.7). A post slot below is empty until the
> developer fills it.
>
> Wording source: every verbatim string in this kit is copied from
> `.agent/docs/specs/2026-11-06-public-presence/public-copy.md`, never retyped. Nothing on any
> surface names a paid tier, a paid feature, a price, or a customer.
>
> Slot format: every post placeholder is wrapped `<!-- slot:<id> --> … <!-- /slot -->` on its
> own lines. A `post:<slug>` slot holds `title: …`, `excerpt: …`, a blank line, then the
> markdown body. A `page:launch-week` slot holds `title:`, `hero.badge:`, `hero.heading:`,
> `hero.subheading:`, `cta.heading:`, `cta.subheading:`, then five `action:<label>|<href>` lines. Every other slot
> holds plain text or front matter + body as noted in its channel brief.

## Dates

Filled in step 10, once L's start date is known.

| Day                | Date | PT time                        |
| ------------------ | ---- | ------------------------------ |
| T-1 (Release, Sun) | TBD  | —                              |
| D1 (Mon)           | TBD  | 05:30 checklist; 07:00 Show HN |
| D2 (Tue)           | TBD  | 00:01 Product Hunt live        |
| D3 (Wed)           | TBD  | —                              |
| D4 (Thu)           | TBD  | —                              |
| D5 (Fri)           | TBD  | —                              |

## Accounts

Filled in step 2. Columns match that step's Verify line.

| Channel                  | Handle    | Created | Profile complete | Email verified |
| ------------------------ | --------- | ------- | ---------------- | -------------- |
| Hacker News              | ianyimi   | created | y                | y              |
| Product Hunt             | ianyimi   | created | y                | y              |
| dev.to                   | ianyimi   | created | y                | n/a            |
| Hashnode                 | ianyimi   | created | y                | n/a            |
| DevHunt (GitHub sign-in) | zaye      | created | y                | n/a            |
| Convex Discord           | majin_zay | created | yes              | n/a            |

## Canonical links

From `public-copy.md`'s Canonical URLs section plus the launch-week routes this spec adds.

| Target                                        | URL                                                            |
| --------------------------------------------- | -------------------------------------------------------------- |
| Announcement                                  | https://vexcms.dev/posts/vexcms-0-1-0                          |
| Brand kit                                     | https://vexcms.dev/brand                                       |
| Roadmap (docs)                                | https://docs.vexcms.dev/roadmap/                               |
| Comparison (docs)                             | https://docs.vexcms.dev/compare/                               |
| Live demo                                     | https://vexcms.dev/admin                                       |
| Quickstart (docs)                             | https://docs.vexcms.dev/guides/quickstart/                     |
| Repository                                    | https://github.com/ianyimi/vex                                 |
| Feature post — real-time admin + live preview | https://vexcms.dev/posts/real-time-admin-and-live-preview      |
| Feature post — one config → schema + types    | https://vexcms.dev/posts/one-config-schema-and-types           |
| Feature post — RBAC + hooks and validation    | https://vexcms.dev/posts/access-control-hooks-validation       |
| Feature post — create-vexcms → deployed site  | https://vexcms.dev/posts/create-vexcms-to-deployed             |
| Recap page                                    | https://vexcms.dev/launch-week                                 |
| Clip — real-time admin + live preview         | https://vexcms.dev/launch/real-time-admin-and-live-preview.mp4 |
| Clip — one config → schema + types            | https://vexcms.dev/launch/one-config-schema-and-types.mp4      |
| Clip — RBAC + hooks and validation            | https://vexcms.dev/launch/access-control-hooks-validation.mp4  |
| Clip — create-vexcms → deployed site          | https://vexcms.dev/launch/create-vexcms-to-deployed.mp4        |

### Not-yet-live URLs

The link check (step 13) reads this table instead of failing on a draft route.

| URL                                                            | Live from                                  |
| -------------------------------------------------------------- | ------------------------------------------ |
| https://vexcms.dev/posts/vexcms-0-1-0                          | D1 (published from the admin the same day) |
| https://vexcms.dev/posts/real-time-admin-and-live-preview      | D2                                         |
| https://vexcms.dev/posts/one-config-schema-and-types           | D3                                         |
| https://vexcms.dev/posts/access-control-hooks-validation       | D4                                         |
| https://vexcms.dev/posts/create-vexcms-to-deployed             | D5                                         |
| https://vexcms.dev/launch-week                                 | D5                                         |
| https://vexcms.dev/launch/real-time-admin-and-live-preview.mp4 | D2 (linked from that day's post)           |
| https://vexcms.dev/launch/one-config-schema-and-types.mp4      | D3                                         |
| https://vexcms.dev/launch/access-control-hooks-validation.mp4  | D4                                         |
| https://vexcms.dev/launch/create-vexcms-to-deployed.mp4        | D5                                         |

## Channel briefs

### Show HN

Purpose/day: D1, ~07:00 PT, linking https://vexcms.dev.

Hard rules:

- "To post, submit a story whose title begins with \"Show HN\"." — `sources.md` §1.1.
- "Write your text by hand. Don't use an LLM to generate any of it (not even a tiny bit,
  including to edit or spruce it up)." — `sources.md` §1.4, reaffirmed §1.7.
- "If the title includes the name of the site, please take it out, because the site name will
  be displayed after the link." — `sources.md` §1.2. No "vexcms.dev" in the title text.
- "Please don't do things to make titles stand out, like using uppercase or exclamation
  points, or saying how great an article is." — `sources.md` §1.2.
- "If the title contains a gratuitous number or number + adjective, we'd appreciate it if
  you'd crop it." / "Otherwise please use the original title... don't editorialize." —
  `sources.md` §1.2.
- "Please submit the original source." — `sources.md` §1.2. Link https://vexcms.dev (Design Decision 5), not a
  third-party writeup.
- "Your text should show up at the top of the Show HN submission, but if for some reason it
  doesn't, add it as a first comment to the thread." — `sources.md` §1.4.
- "Include a clear statement of what your project is or does." / "Include text giving the
  backstory of how you came to work on this, and explaining what's different about it." —
  `sources.md` §1.4.
- "Don't solicit upvotes, comments, or submissions." — `sources.md` §1.2, reaffirmed §1.3
  ("Can I ask people to upvote my submission? No.") and §1.4 ("Make sure your friends and
  users do not add booster comments in the thread").
- "Don't have your username be that of your company or project." — `sources.md` §1.4.
  `@ianyimi` posts, not a `vexcms` account.
- "The project must be something you've worked on personally and which you're around to
  discuss." — `sources.md` §1.1. The maintainer stays in the thread.

Limits: none quoted in `sources.md` for title or text length.

What the post must contain: a plain one-sentence statement of what VexCMS is (fact sheet "What
VexCMS is"), the backstory and what's different, and the try-it path (demo or
`pnpm create vexcms` (the post-Release command; `copy-flip.patch` drops `@alpha`), since "Please make it easy for users to try your thing out,
ideally without barriers such as signups or emails" — `sources.md` §1.1 — note where Convex
signup is a real friction point per `sources.md` §1.4).

<!-- slot:hn:title -->
<!-- /slot -->

<!-- slot:hn:text -->
<!-- /slot -->

### Product Hunt

Purpose/day: D2, scheduled, live 00:01 PT — "Every launch goes live at 12:01 AM Pacific Time
on the day you schedule." `sources.md` §2.1, §2.2.

Hard rules:

- "Company and brand accounts can't submit launches or comment. Sign up with your own name" —
  `sources.md` §2.1. "Profiles appear human and represent an individual, not a company" —
  `sources.md` §2.6.
- "your account also needs a verified email address" — `sources.md` §2.1.
- "You can schedule a launch from tomorrow up to 30 days ahead." — `sources.md` §2.2.
- "Never pay for upvotes or use services that promise them." — `sources.md` §2.1, reaffirmed
  §2.4, §2.6, §2.7.
- "Don't use fake or extra accounts. Every account should belong to one real person." —
  `sources.md` §2.4.
- "We only feature products that are currently available." / "We only feature products that
  are ready for use" — `sources.md` §2.8. The scaffolder and demo must work end-to-end before
  scheduling.
- "We do not feature: ... Templates, Boilerplates" — `sources.md` §2.8. Frame VexCMS as a
  working CMS app, not a code template, given `create-vexcms` is a scaffolder.

Limits (`sources.md` §2.3):

- Name: up to 40 characters, no tagline or emoji.
- Tagline: up to 60 characters, no hype ("the best", "#1").
- Description: up to 500 characters, value first.
- Logo: 240×240px, JPG/PNG/GIF, ≤2MB.
- Gallery images: at least one, 1270×760px recommended.
- Pricing: Free.
- Launch tags: up to 3.
- Maker comment: up to 5,000 characters, posted and pinned at launch.
- Open-source field: link https://github.com/ianyimi/vex.

What the post must contain: the fields above, built from the fact sheet's "What VexCMS is" and
packages facts, plus the repo link in the open-source field.

<!-- slot:ph:name -->
<!-- /slot -->

<!-- slot:ph:tagline -->
<!-- /slot -->

<!-- slot:ph:description -->
<!-- /slot -->

<!-- slot:ph:maker-comment -->
<!-- /slot -->

<!-- slot:ph:tags -->
<!-- /slot -->

### LinkedIn

Purpose/day: D1–D5, one post every day (the announcement, then each feature post, then the
recap), each with that day's clip (silent H.264 MP4, ≤60s, ≤10MB, `apps/www/public/launch/`)
uploaded natively — "Silent → no caption track; post text describes the clip."

Hard rules: no official LinkedIn length or link-card limit was found —
"`sources.md` §5.17: no official length or link-card limit found... None was found, so this
channel has no quotable rule for the launch spec." Keep the clip native, the link in the post
body, and since the clip carries no audio or captions, the post text must describe what it
shows.

Limits: none quoted (`sources.md` §5.17, [UNVERIFIED]).

What each post must contain: a link to that day's canonical URL (announcement, feature post,
or recap) and a description of the attached clip.

<!-- slot:linkedin:d1 -->
<!-- /slot -->

<!-- slot:linkedin:d2 -->
<!-- /slot -->

<!-- slot:linkedin:d3 -->
<!-- /slot -->

<!-- slot:linkedin:d4 -->
<!-- /slot -->

<!-- slot:linkedin:d5 -->
<!-- /slot -->

### Convex Discord

Purpose/day: D1, a new comment under the developer's existing #show-and-tell post (not a new
post), linking the announcement.

Hard rules: the channel has no pinned rules (checked by the developer after joining,
2026-11-08; `sources.md` §5.10 could not read the channel logged out). The developer already
has a #show-and-tell post, so the D1 update goes in as a comment under it rather than a second
post. Written by the developer, like every other slot (Design Decision 2).

Limits: none published.

What the comment must contain: that 0.1.0 is out, the fact sheet's "What VexCMS is" if the
existing post doesn't already say it, and a link to the announcement.

<!-- slot:discord:d1 -->
<!-- /slot -->

### dev.to

Purpose/day: D1, cross-post of the www announcement.

Hard rules (`sources.md` §5.13):

- "canonical_url: link for the canonical version of the content" — set to
  `https://vexcms.dev/posts/vexcms-0-1-0`.
- "Add up to four comma-separated tags per post" — "tags: max of four tags, needs to be
  comma-separated".
- "ai_disclosure_level: AI usage disclosure (`not_disclosed`, `no_ai`, `some_ai`,
  `fully_autonomous`)" — front matter is required; the post text itself is hand-written
  (Design Decision 2), so disclose accordingly.

Limits: ≤4 tags (`sources.md` §5.13); front matter needs `title`, `published`, `tags`,
`canonical_url`, `ai_disclosure_level`.

What the post must contain: front matter with the fields above and a body that mirrors the www
announcement, canonical-linked to it.

<!-- slot:devto:announcement -->
<!-- /slot -->

### Hashnode

Purpose/day: D1, cross-post of the www announcement.

Hard rules (`sources.md` §5.14):

- "Click on the Add Original Article button to change the canonical URL of the article to the
  original article" — set the canonical URL to `https://vexcms.dev/posts/vexcms-0-1-0`.
- Optional: "Yes, hide from Hashnode and display on my blog only" if the cross-post should not
  appear in Hashnode's own feed.

Limits: none found (`sources.md` §5.14).

What the post must contain: the same body as the dev.to cross-post, canonical-linked via "Add
Original Article".

<!-- slot:hashnode:announcement -->
<!-- /slot -->

### DevHunt

Purpose/day: launch week, paid $49 slot bought in step 10; the listing text is drafted here.

Hard rules (`sources.md` §2.9, §2.10):

- "Sign in, open your account and submit your tool with its name, website, description, logo
  and screenshots." — `sources.md` §2.9.
- "Listing a tool is free: every tool gets a permanent page with a nofollow link." /
  "Launch ($49, one time): pick the launch week, a spot in the weekly newsletter, a permanent
  dofollow link, listed above other launches on equal votes, plus its own post on X." —
  `sources.md` §2.9, §2.10.
- Category list includes "Open Source," "DB," "Code" — `sources.md` §2.10.

Limits: no field-length limits were found (`sources.md` §2.9, §2.10, [UNVERIFIED]).

What the post must contain: name, website (`https://vexcms.dev`), description, logo, and
screenshots — the same assets as the Product Hunt gallery.

<!-- slot:devhunt:listing -->
<!-- /slot -->

### Cooperpress

Purpose/day: pitch email, sent after the D1 announcement is live.

Hard rules (`sources.md` §5.1): "No public 'submit a link' web form exists; the only official
contact channel is email." / "Editorial: editor@cooperpress.com" — one address covers
JavaScript Weekly, Node Weekly and React Status.

Limits: none — "a short, direct pitch email is the expected format, not a structured form"
(`sources.md` §5.1).

What the email must contain: a short pitch, angled per publication if the developer chooses —
general tool news for JS Weekly, a React/Next.js integration angle for React Status, a
backend/Convex-functions angle for Node Weekly (implication drawn in `sources.md` §5.1, not a
quoted rule) — plus the announcement link.

<!-- slot:cooperpress:email -->
<!-- /slot -->

### This Week in React

Purpose/day: optional, during the launch week — a note to the newsletter's author, not a
submission.

Hard rules: no documented submission route exists — "Site navigation exposes only: Articles,
Newsletter, Thread, Sponsor — no 'Submit' nav item... no quoted 'how to submit a link' rule
anywhere on the site" (`sources.md` §5.2, [UNVERIFIED]). The only route found is a direct
mention to the author, Sébastien Lorber, via the contact links on his newsletter issue pages
(GitHub, X, Bluesky, LinkedIn — `sources.md` §5.2).

Limits: none.

What the note must contain: a short, direct message — this is cold outreach, not a submission
queue (`sources.md` §5.2).

<!-- slot:twir:note -->
<!-- /slot -->

### jamstack.org

Purpose/day: D3, PR against `jamstack/jamstack.org` adding a new entry under
`src/site/headless-cms/`.

Hard rules (`sources.md` §5.4):

- "We accept contributions submitted as pull requests." Each CMS is its own markdown file
  (`caisy.md`, `strapi.md`, `sanity.md`, …) — VexCMS adds `vexcms.md`.
- Required front matter fields, from the `caisy.md` sample quoted verbatim: `title`,
  `homepage`, `twitter`, `opensource` (`"Yes"`/`"No"` as a string), `typeofcms`,
  `supportedgenerators` (a list), `description`, optional `images`.
- No numeric minimum (stars, age) was found in the repo's contribution docs.

Limits: the image spec quoted in the root README ("jpeg 600px wide and 400px tall") is for
resource thumbnails, not confirmed for CMS entries specifically
(`sources.md` §5.4, [UNVERIFIED exact pixel spec for this entry type]). Step 10 reads a
recently merged CMS-entry PR before drafting this one, per `sources.md` §5.19.

What the entry must contain: `opensource: "Yes"` (Apache-2.0), a `typeofcms` value, and
`supportedgenerators` including Next.js, plus the description below.

<!-- slot:jamstack:description -->
<!-- /slot -->

### awesome-nextjs

Purpose/day: D3, one PR against `unicodeveloper/awesome-nextjs`.

Hard rules (`sources.md` §5.7):

- "Make an individual pull request for each suggestion." — one PR, not bundled with anything
  else.
- "Use the following format: `[Title Case Name](link) - Description.`"
- "Start the description with a capital and end with a full stop/period." / "Keep descriptions
  short and simple, but descriptive."

Limits: none numeric found (`sources.md` §5.7).

What the line must contain: `[VexCMS](<link>) - <one capitalized, period-terminated sentence>`
— the link target (repo vs. vexcms.dev) is the developer's call; no rule in `sources.md` §5.7
specifies which.

<!-- slot:awesome-nextjs:line -->
<!-- /slot -->

## Fact sheet

### What VexCMS is

- GitHub repository description: "Type-safe headless CMS built on Convex, with a real-time
  admin panel, end-to-end type inference, auth, ABAC — no separate backend to run." (read via
  `gh api repos/ianyimi/vex --jq .description`; the "ABAC" wording there does not match the
  role-based `defineAccess` model below; the ABAC / RBAC consistency-matrix row in step 21
  resolves which surface changes.)
- Docs homepage description: "A type-safe headless CMS built natively on Convex — real-time
  reactivity, generated types, and zero database configuration." —
  `apps/docs/src/content/docs/index.mdx:3`.
- Homepage: https://vexcms.dev. Docs: https://docs.vexcms.dev.

### Packages

Eight published packages, all at `0.1.0-alpha.29` with `publishConfig.tag: "alpha"` today
(re-check in step 13 — Release's `changeset pre exit` moves every one to `0.1.0` before the
kit goes live):

| Package                       | Description                                               | Source                                      |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `@vexcms/core`                | Field factories, schema generation, typed collection APIs | `packages/core/package.json`                |
| `@vexcms/react`               | Admin components and hooks                                | `packages/react/package.json`               |
| `@vexcms/next`                | Next.js adapter and admin routes                          | `packages/next/package.json`                |
| `@vexcms/cli`                 | `vex` CLI: dev server orchestration and type generation   | `packages/cli/package.json`                 |
| `@vexcms/better-auth`         | Better Auth adapter                                       | `packages/better-auth/package.json`         |
| `@vexcms/file-storage-convex` | Convex file-storage adapter                               | `packages/file-storage-convex/package.json` |
| `@vexcms/richtext-plate`      | Plate rich-text editor integration                        | `packages/richtext-plate/package.json`      |
| `create-vexcms`               | Scaffolding CLI                                           | `packages/create-vexcms/package.json`       |

`@vexcms/telemetry` is `"private": true` (`packages/telemetry/package.json`) — not published,
not one of the eight.

### Requirements

Re-check in step 13 — these peer ranges live in a shared catalog a sibling dependency change
could move before Release.

| Requirement                        | Floor         | Source                                                                                                                                                                                                                       |
| ---------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node                               | `>=20.0.0`    | `package.json#engines` (repo root)                                                                                                                                                                                           |
| Next.js                            | `>=15.0.0`    | `pnpm-workspace.yaml` `catalogs.peers.next`; declared by `packages/react/package.json#peerDependencies.next` and `packages/next/package.json#peerDependencies.next`                                                          |
| React / react-dom                  | `>=18.0.0`    | `pnpm-workspace.yaml` `catalogs.peers.react`/`react-dom`; declared by `packages/react/package.json#peerDependencies` and `packages/next/package.json#peerDependencies`                                                       |
| Convex                             | `>=1.44.0 <2` | `pnpm-workspace.yaml` `catalogs.peers.convex`; declared by `packages/core/package.json#peerDependencies.convex`, `packages/react/package.json#peerDependencies.convex`, `packages/next/package.json#peerDependencies.convex` |
| Zod (for `@vexcms/next` consumers) | `>=4.0.0 <5`  | `pnpm-workspace.yaml` `catalogs.peers.zod`; declared by `packages/next/package.json#peerDependencies.zod`                                                                                                                    |

### Try it

| Path           | Detail                                                                                                     | Source                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Live demo      | https://vexcms.dev/admin, anonymous, read-only                                                             | `apps/www` production                                                                                                           |
| Quickstart     | `pnpm create vexcms` (after Release; `@alpha` until then) to a signed-in admin panel in under five minutes | `apps/docs/src/content/docs/guides/quickstart.mdx` (re-check in step 13 — launch-infrastructure may update this page's content) |
| Scaffold flags | `--bare`, `--orgs`, `--monorepo`, `--yes`                                                                  | `packages/create-vexcms/README.md` (re-check in step 13)                                                                        |
| Repository     | https://github.com/ianyimi/vex                                                                             | —                                                                                                                               |

### Day facts

#### D1 — Announcement

VexCMS 0.1.0's shipped feature list (16 field types, versioning and drafts, Convex schema +
type codegen, the real-time admin panel, RBAC with indexed rules, live preview, lifecycle
hooks and server-side validation, the CLI and `create-vexcms`) — `apps/docs/src/content/docs/roadmap.md:10-44`
("Shipped" section; re-check in step 13 — public-presence rewrites this page's shape to
Shipped/After-0.1.0/Not-planned before launch). Funding line and `planned`-issue links belong
in this post — `public-copy.md` "Funding" and its `planned` issues table.

Docs: https://docs.vexcms.dev/roadmap/

#### D2 — Real-time admin + live preview

- "✅ Real-time admin panel" — `apps/docs/src/content/docs/roadmap.md:15`.
- Live preview streams unsaved form state onto the real route, origin-allowlisted and gated by
  a session-verified cookie — `apps/docs/src/content/docs/roadmap.md:33`; mechanism documented
  in `apps/docs/src/content/docs/guides/live-preview.mdx` ("How it works", "Security: the gate
  is yours to set"); implemented in `packages/core/src/livePreview/resolveSettings.ts` (preview
  settings precedence) and `packages/core/src/livePreview/panelCookie.ts` (the session-verified
  cookie).

Docs: https://docs.vexcms.dev/guides/live-preview/

#### D3 — One config → Convex schema + end-to-end types

- "✅ Convex schema + type codegen" — `apps/docs/src/content/docs/roadmap.md:14`.
- `generateVexSchema` (`packages/core/src/schema/generateVexSchema.ts`) and `generateVexTypes`
  (`packages/core/src/types/generateVexTypes.ts`) turn one `vex.config.ts` into the Convex
  schema and the project's generated types; `vex dev` / `vex generate` run them —
  `packages/cli/src/lib/generateSchema.ts`, `packages/cli/src/commands/generate.ts`.

Docs: https://docs.vexcms.dev/guides/quickstart/ (config → running app); try the generated
types path with `pnpm create vexcms`.

#### D4 — RBAC + server-enforced hooks and validation

- RBAC compiles permission rules to indexed Convex queries: `packages/core/src/access/compileQueryConstraints.ts`
  ("Compiles a recorded constraint list to a `withIndex` range function"),
  `packages/core/src/access/pickConvexQueryIndex.ts`,
  `packages/core/src/access/createQueryIndexConstraintBuilder.ts`. Documented in
  `apps/docs/src/content/docs/guides/access-control.mdx` ("How it works", "Permission check
  shapes").
- Every write runs through `hasPermission` and the field validators regardless of client
  behavior — `packages/core/src/db/prepareEdit.ts` (calls `hasPermission` then
  `validateFields`). Lifecycle hooks (`beforeChange`/`beforeDelete`/`afterChange`/`afterDelete`)
  and the async, database-aware `validate()` are documented in
  `apps/docs/src/content/docs/guides/lifecycle-hooks.mdx` ("The four hooks", "Server-side field
  validation").

Docs: https://docs.vexcms.dev/guides/access-control/ and
https://docs.vexcms.dev/guides/lifecycle-hooks/

#### D5 — create-vexcms → deployed site

- "✅ `create-vexcms` scaffolder" — `apps/docs/src/content/docs/roadmap.md:27`.
- Two templates: `base-nextjs` (auth, admin panel, media, no starter collections) and
  `marketing-site` (adds pages/headers/footers/themes, 8 content blocks, a seeded home page) —
  `packages/create-vexcms/README.md` (re-check in step 13).

Docs: https://docs.vexcms.dev/guides/quickstart/

## Prepared answers

Facts and sources, not paste-ready text — HN bans AI-edited comments (`sources.md` §1.7).

### Q1 — Why not Payload, Sanity, or Strapi?

#### Facts

- VexCMS runs inside the Convex deployment already in use — no separate database to provision,
  no second backend process. Payload needs a self-managed Node/Next server plus a
  self-provisioned database (MongoDB, Postgres, or SQLite); Sanity's Content Lake is
  vendor-managed with no self-host option; Strapi needs a self-managed Node server plus a SQL
  database, or its paid Strapi Cloud — `.agent/docs/specs/2026-11-06-public-presence/competitors.md`,
  "Production deployment requirement" table.
- Real-time admin updates and live preview ship in VexCMS's free core
  (`apps/docs/src/content/docs/roadmap.md:15,33`). Compare each competitor's free-tier
  equivalent in `competitors.md` (rows 7–8) before answering; the comparison page covers free
  tiers only (public-presence Design Decision 20).
- Types and schema generate from one `vex.config.ts` via `generateVexSchema` /
  `generateVexTypes` (`packages/core/src/schema/generateVexSchema.ts`,
  `packages/core/src/types/generateVexTypes.ts`) — comparable in spirit to Payload's
  `payload generate:types` and Sanity's TypeGen, but there is no separate database schema to
  keep in sync: Convex's schema and VexCMS's types come from the same config run.
- The full row-by-row comparison, with a check date per competitor, is drafted for
  `apps/docs/src/content/docs/compare.mdx` (public-presence step 12) and lives in
  `.agent/docs/specs/2026-11-06-public-presence/competitors.md` today.

#### Verbatim

None — this question has no `public-copy.md` line; answer from the facts above, in your own
words.

#### Links

- https://docs.vexcms.dev/compare/ (once published — re-check in step 13)
- https://docs.vexcms.dev/roadmap/

#### Don't say

A price, a tier name, or that another product is bad — only what VexCMS does differently and
where it's not finished (its roadmap).

### Q2 — Does Convex lock you in?

#### Facts

- Convex is open source and self-hostable: "Self-hosted Convex runs the open-source backend,
  and contains the same fully up-to-date code the cloud service uses" — fetched from
  https://docs.convex.dev/self-hosting.md on 2026-11-06.
- Licence: "Convex uses an FSL Apache 2.0 License which is a fair source license. You can do
  almost anything Apache-2.0 allows, except create another product designed to compete with
  the hosted Convex Cloud... All code is automatically converted to full Apache-2.0 two years
  after its creation." — same source.
- The self-hosting guide itself lives at
  https://github.com/convex/convex-backend/blob/main/self-hosted/README.md (linked from the
  page above, not separately fetched in this pass).
- VexCMS's own code is unrelated to this question's licence: VexCMS is Apache-2.0
  (`LICENSE`), full stop; Convex's FSL terms govern Convex's own backend, not anything VexCMS
  ships.

#### Verbatim

None — this is a Convex-platform fact, not a `public-copy.md` line.

#### Links

- https://docs.convex.dev/self-hosting

#### Don't say

Don't claim VexCMS itself can run without Convex — it can't; don't overstate self-hosting as
effortless — the guide is Convex's own, not something VexCMS automates.

### Q3 — Will VexCMS go paid?

#### Facts

- `public-copy.md` "Paid-work line" is the verbatim public answer everywhere this question
  comes up.

#### Verbatim

"Paid add-ons may come later, as separate packages, after the free roadmap. The core stays
Apache-2.0, and nothing free becomes paid." — `public-copy.md` § Paid-work line.

#### Links

- https://docs.vexcms.dev/roadmap/

#### Don't say

No tier name, no price, no feature list for anything paid, no date.

### Q4 — What's the licence?

#### Facts

- `public-copy.md` "Licence line" is the verbatim answer.
- Full text lives in `LICENSE` (repo root); `NOTICE` carries the copyright line: "VexCMS /
  Copyright 2026 Isaiah Anyimi / This product includes software developed as part of the
  VexCMS project (https://github.com/ianyimi/vex)." — `NOTICE`.

#### Verbatim

"VexCMS is Apache-2.0 licensed." — `public-copy.md` § Licence line.

#### Links

- https://github.com/ianyimi/vex/blob/master/LICENSE

#### Don't say

Don't conflate VexCMS's licence with Convex's FSL Apache 2.0 terms (Q2) — they're two
different projects' licences.

### Q5 — What's the bus factor? (solo maintainer)

#### Facts

- `public-copy.md` "Who builds this" is the verbatim answer, including the triage window.

#### Verbatim

"VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in
their free time. New issues are triaged within a week; how fast a fix lands depends on its
severity and on sponsorship." — `public-copy.md` § Who builds this.

"Reports are acknowledged within a week. Supported versions: the latest 0.1.x release." —
`public-copy.md` § Security response window.

#### Links

- https://github.com/ianyimi/vex/discussions
- https://github.com/sponsors/ianyimi

#### Don't say

Don't promise a response time faster than a week, or imply a team.

### Q6 — Migrating from another CMS?

#### Facts

- No automated migration tooling exists today. There is no `vex migrate`/`vex import` CLI
  command (`packages/cli/src/commands/` holds only `dev.ts`, `deploy.ts`, `generate.ts`,
  `telemetry.ts` — none import content from another CMS), and no migration guide exists in
  `apps/docs/src/content/docs/guides/` (checked against the full file listing).
  `deploy.ts`/`dev.ts`'s "auto-migrate" refers only to Convex schema migration (field
  add/remove on your own project), not importing data from Payload/Sanity/Strapi.
- A "coming from Payload" guide was weighed in this spec's interview and deferred to the
  backlog (spec.md § Out of Scope).
- A related but different capability is on the public roadmap: "Brownfield adoption — Add
  VexCMS to an existing Convex app table by table, without migrating the data it already
  holds." — `public-copy.md` § Roadmap — after 0.1.0, item 3. That's about adopting VexCMS
  inside an existing Convex project, not importing content from a different CMS platform.

#### Verbatim

"Brownfield adoption — Add VexCMS to an existing Convex app table by table, without migrating
the data it already holds." — `public-copy.md` § Roadmap — after 0.1.0.

#### Links

- https://docs.vexcms.dev/roadmap/

#### Don't say

Don't imply an import tool exists, or that brownfield adoption (Convex-to-VexCMS) is the same
thing as migrating off another CMS product.

### Q7 — Telemetry: what's collected, how do I turn it off?

#### Facts

- `vex` and `create-vexcms` send one anonymous event per run (`dev`, `deploy`, `create`); the
  payload is an anonymized config shape (names replaced by generated paths like `c1.f2`),
  environment facts, a coarse ok/failed outcome, and scaffold choices — never a real name,
  value, or content —
  `apps/docs/src/content/docs/guides/telemetry.mdx` § Field reference, § Config payload.
- Precedence, highest first: `DO_NOT_TRACK` → `VEX_TELEMETRY_DISABLED` → CI detection → the
  stored setting → on by default. "None of the environment-variable overrides can [turn
  telemetry on against the stored setting]." — `apps/docs/src/content/docs/guides/telemetry.mdx` § Opting out.
- Opt out with `vex telemetry disable`, or set `DO_NOT_TRACK=1` / `VEX_TELEMETRY_DISABLED=1`;
  always off automatically in CI — same section, and `packages/create-vexcms/README.md` §
  Telemetry.
- `telemetry.hideLogs` in `defineServerConfig`'s `server` config silences only the two-line
  per-run reminder — it does not disable sending — `apps/docs/src/content/docs/guides/telemetry.mdx`
  § Silencing the reminder: "There is no config option to disable telemetry itself — only to
  silence this log line."
- Design rationale (private workspace package, size cap, allowlisted fields, no hashing of
  names): `.agent/docs/specs/2026-10-26-build-time-telemetry/spec.md` Design Decisions 1–14.

#### Verbatim

None — this is the telemetry docs page's own wording, not a `public-copy.md` line.

#### Links

- https://docs.vexcms.dev/guides/telemetry/

#### Don't say

Don't say telemetry can be disabled from `vex.config.ts` — it can't (the docs page states this
explicitly); don't understate what's collected — point to the field reference rather than
summarizing from memory.

### Q8 — Is VexCMS production-ready?

#### Facts

- VexCMS ships `0.1.0` at this launch (`packages/*/package.json#version`, re-check in
  step 13 — the version shown here is pre-Release `0.1.0-alpha.29`).
  `packages/create-vexcms/README.md`'s warning banner describes the pre-0.1.0 posture:
  "pre-release software... Use it for experiments and evaluation only; the projects it
  scaffolds should not carry production traffic or real user data." (re-check in step 13 —
  this banner is removed by the copy-flip patch at Release, so quote the _shipped_ 0.1.0
  posture from the roadmap and non-goals below, not this alpha-era banner.)
- What comes after 0.1.0 is `public-copy.md` § Roadmap — after 0.1.0 (plugin system → free
  features as demand appears → brownfield adoption) plus its "Not planned" line. The
  launch plan's internal non-goal list is not quoted: several of its items are kept off every
  public surface (public-presence Design Decision 5).
- The docs roadmap carries the same shape once public-presence step 9 lands
  (`apps/docs/src/content/docs/roadmap.md`, re-check in step 13).

#### Verbatim

"Everything below is free and lands in the Apache-2.0 core. It ships in this order." —
`public-copy.md` § Roadmap — after 0.1.0 (intro line, for framing what's still coming).

#### Links

- https://docs.vexcms.dev/roadmap/

#### Don't say

Don't claim feature parity with Payload, Sanity or Strapi (Q1); don't promise a date for any
roadmap item.

### Q9 — Can Convex be self-hosted?

#### Facts

Same material as Q2 — see Q2's Facts, Links and verbatim quote. Kept as its own question
because it's asked independently of the lock-in framing.

#### Verbatim

None — Convex-platform fact, quoted in Q2.

#### Links

- https://docs.convex.dev/self-hosting
- https://github.com/convex/convex-backend/blob/main/self-hosted/README.md

#### Don't say

Don't describe self-hosting as a VexCMS feature — it's a Convex-platform capability VexCMS
inherits, not something this repo builds or supports directly.

## Posts

Every slot below is empty — filled by the developer in step 6. Nothing here is prose.

### D1 — www announcement

Owned by `2026-11-06-public-presence` step 14 (`posts` draft seeded in `apps/www/convex/seed.ts`);
not transcribed from this kit. Linked from every D1 channel below.

### D1 — Show HN

See the Show HN brief above for the slots `hn:title` and `hn:text`.

### D1 — LinkedIn, Discord, dev.to, Hashnode

See the LinkedIn (`linkedin:d1`), Convex Discord (`discord:d1`), dev.to
(`devto:announcement`) and Hashnode (`hashnode:announcement`) briefs above.

### D2 — Feature post: real-time admin + live preview

<!-- slot:post:real-time-admin-and-live-preview -->
<!-- /slot -->

### D2 — LinkedIn

See `linkedin:d2` above.

### D2 — Product Hunt listing

See the Product Hunt brief above for `ph:name`, `ph:tagline`, `ph:description`,
`ph:maker-comment`, `ph:tags`.

### D3 — Feature post: one config → schema + types

<!-- slot:post:one-config-schema-and-types -->
<!-- /slot -->

### D3 — LinkedIn

See `linkedin:d3` above.

### D3 — jamstack.org, awesome-nextjs

See the jamstack.org (`jamstack:description`) and awesome-nextjs (`awesome-nextjs:line`)
briefs above.

### D4 — Feature post: RBAC + server-enforced hooks and validation

<!-- slot:post:access-control-hooks-validation -->
<!-- /slot -->

### D4 — LinkedIn

See `linkedin:d4` above.

### D5 — Feature post: create-vexcms → deployed site

<!-- slot:post:create-vexcms-to-deployed -->
<!-- /slot -->

### D5 — Recap page: launch-week

<!-- slot:page:launch-week -->
<!-- /slot -->

### D5 — LinkedIn

See `linkedin:d5` above.

### Passive channels

DevHunt (`devhunt:listing`), Cooperpress (`cooperpress:email`), This Week in React
(`twir:note`) — see their briefs above for timing.

## Submission list

| Target             | Route                                                                | Rules ref                | Timing                                                            | Status        |
| ------------------ | -------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------- | ------------- |
| Cooperpress        | Pitch email to editor@cooperpress.com                                | `sources.md` §5.1        | After the D1 announcement is live                                 | Not sent      |
| This Week in React | Direct note to Sébastien Lorber (GitHub/X/Bluesky/LinkedIn)          | `sources.md` §5.2        | Any day in launch week, optional                                  | Not sent      |
| jamstack.org       | PR to `jamstack/jamstack.org`, new `src/site/headless-cms/vexcms.md` | `sources.md` §5.4        | D3                                                                | Not drafted   |
| awesome-nextjs     | PR to `unicodeveloper/awesome-nextjs`, one README line               | `sources.md` §5.7        | D3                                                                | Not drafted   |
| DevHunt            | Listing submitted + $49 launch-week slot bought                      | `sources.md` §2.9, §2.10 | Listing + purchase in step 10; launch runs the same week as D1–D5 | Not submitted |

## Schedule

All times Pacific. Dates come from the Dates table above once step 10 fixes them. Every `www` publish row is one edit (cross-spec decisions 3 and 8 of `.agent/docs/product/launch-cross-spec-decisions.md`): publish the document from the production admin, then in a single commit set its `vex_status` to `"published"` in both seeds and remove that route's `draft: true` from `QUALITY_ROUTES` in `apps/www/e2e/routes.ts`.

| When (PT)                     | Day    | Channel        | Artifact                                                                                                                                                                                                                                | Link target                                                                        | Blocked reply block |
| ----------------------------- | ------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| T-1, after Release            | Sun    | —              | `changeset pre exit`, publish, `dev`→`master` merge, `npx convex run seed:reinit --prod`, then the launch-morning checklist (T-1 half)                                                                                                  | —                                                                                  | —                   |
| 05:30                         | D1 Mon | —              | Launch-morning checklist (D1 half)                                                                                                                                                                                                      | —                                                                                  | —                   |
| 06:45                         | D1 Mon | www            | Publish `/posts/vexcms-0-1-0` from the admin; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/vexcms-0-1-0` in `QUALITY_ROUTES`                                                           | https://vexcms.dev/posts/vexcms-0-1-0                                              | —                   |
| 07:00                         | D1 Mon | Show HN        | Title + text, linking https://vexcms.dev                                                                                                                                                                                                | https://vexcms.dev                                                                 | 07:00–19:00         |
| 07:15                         | D1 Mon | LinkedIn       | Announcement post + demo clip                                                                                                                                                                                                           | https://vexcms.dev/posts/vexcms-0-1-0                                              | —                   |
| 07:20                         | D1 Mon | Convex Discord | Comment under the existing #show-and-tell post (no new post)                                                                                                                                                                            | https://vexcms.dev/posts/vexcms-0-1-0                                              | —                   |
| 07:30                         | D1 Mon | dev.to         | Cross-post, `canonical_url` set                                                                                                                                                                                                         | https://vexcms.dev/posts/vexcms-0-1-0                                              | —                   |
| 07:30                         | D1 Mon | Hashnode       | Cross-post, canonical set via "Add Original Article"                                                                                                                                                                                    | https://vexcms.dev/posts/vexcms-0-1-0                                              | —                   |
| After D1 announcement is live | D1 Mon | Cooperpress    | Pitch email                                                                                                                                                                                                                             | editor@cooperpress.com                                                             | —                   |
| 00:01                         | D2 Tue | Product Hunt   | Listing goes live (scheduled in step 10)                                                                                                                                                                                                | PH listing page                                                                    | 06:00–20:00         |
| 09:00                         | D2 Tue | www            | Publish `real-time-admin-and-live-preview`; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/real-time-admin-and-live-preview` in `QUALITY_ROUTES`                                         | https://vexcms.dev/posts/real-time-admin-and-live-preview                          | 2h after posting    |
| 09:00                         | D2 Tue | LinkedIn       | Feature post + clip                                                                                                                                                                                                                     | https://vexcms.dev/posts/real-time-admin-and-live-preview                          | —                   |
| 09:00                         | D3 Wed | www            | Publish `one-config-schema-and-types`; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/one-config-schema-and-types` in `QUALITY_ROUTES`                                                   | https://vexcms.dev/posts/one-config-schema-and-types                               | 2h after posting    |
| 09:00                         | D3 Wed | LinkedIn       | Feature post + clip                                                                                                                                                                                                                     | https://vexcms.dev/posts/one-config-schema-and-types                               | —                   |
| Any time                      | D3 Wed | jamstack.org   | Open PR                                                                                                                                                                                                                                 | github.com/jamstack/jamstack.org                                                   | —                   |
| Any time                      | D3 Wed | awesome-nextjs | Open PR                                                                                                                                                                                                                                 | github.com/unicodeveloper/awesome-nextjs                                           | —                   |
| 09:00                         | D4 Thu | www            | Publish `access-control-hooks-validation`; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/access-control-hooks-validation` in `QUALITY_ROUTES`                                           | https://vexcms.dev/posts/access-control-hooks-validation                           | 2h after posting    |
| 09:00                         | D4 Thu | LinkedIn       | Feature post + clip                                                                                                                                                                                                                     | https://vexcms.dev/posts/access-control-hooks-validation                           | —                   |
| 09:00                         | D5 Fri | www            | Publish `create-vexcms-to-deployed` and the `launch-week` page; same edit: both seed `vex_status`es → `"published"` in both seeds, `draft` flags removed from `/posts/create-vexcms-to-deployed` and `/launch-week` in `QUALITY_ROUTES` | https://vexcms.dev/posts/create-vexcms-to-deployed, https://vexcms.dev/launch-week | 2h after posting    |
| 09:00                         | D5 Fri | LinkedIn       | Feature post + clip                                                                                                                                                                                                                     | https://vexcms.dev/posts/create-vexcms-to-deployed                                 | —                   |

DevHunt's paid launch runs for the whole week in parallel ("launches run for a whole week" —
`sources.md` §2.9) — no single slot above; reply as comments arrive on its page.

## Launch-morning checklist

One command or URL per check. `<reviewed-sha>` is the `dev` SHA `surface-review.md` (step 12)
recorded as reviewed.

### T-1, after Release

- [ ] Production www deploys from the merge: `gh api "repos/ianyimi/vex/deployments?environment=Production%20%E2%80%93%20vex-www" --jq '.[0].sha'` matches `origin/master`'s HEAD.
- [ ] Production docs deploys from the merge: `gh api "repos/ianyimi/vex/deployments?environment=Production%20%E2%80%93%20vex-docs" --jq '.[0].sha'` matches `origin/master`'s HEAD.
- [ ] Only Release mechanics changed since the review: `git diff --stat <reviewed-sha>..origin/master` lists only changeset version bumps, `scripts/sync-template-versions.mjs`'s output files, and `copy-flip.patch`'s files — nothing else.
- [ ] All 8 packages published at `0.1.0`, `latest` tag: `for p in @vexcms/core @vexcms/react @vexcms/next @vexcms/cli @vexcms/better-auth @vexcms/file-storage-convex @vexcms/richtext-plate create-vexcms; do npm view "$p" dist-tags --json; done` — every one's `latest` reads `0.1.0`. If `latest` still reads `0.0.20`, stop: `pnpm create vexcms` would install the old scaffolder (spec.md § Handoffs, Release).
- [ ] Each npm page's README renders (no broken Markdown): open `https://www.npmjs.com/package/<pkg>` for each of the 8 packages above and check the Readme tab renders.
- [ ] GitHub `master` serves the real README: `curl -s https://raw.githubusercontent.com/ianyimi/vex/master/README.md | head -5` shows the slimmed landing-page content, not the alpha banner.
- [ ] Community profile complete: `gh api repos/ianyimi/vex/community/profile --jq .health_percentage` prints `100`.
- [ ] Issue chooser shows the two forms: open `https://github.com/ianyimi/vex/issues/new/choose` and confirm the bug and docs forms, the Discussions and security contact links, and no blank-issue option.
- [ ] Sponsor button renders: open `https://github.com/ianyimi/vex` and confirm the "Sponsor" button is present in the repo header.
- [ ] `v0.1.0` release is Latest: `gh release view v0.1.0 --json isLatest --jq .isLatest` prints `true`.

### D1, 05:30 PT

- [ ] Docs production page renders: `curl -sI https://docs.vexcms.dev/ | head -1` returns `200`.
- [ ] www production page renders: `curl -sI https://vexcms.dev/ | head -1` returns `200`.
- [ ] Demo loads anonymously: `curl -sI https://vexcms.dev/admin | head -1` returns `200`; open it in a private window and confirm the panel renders read-only with no sign-in prompt.
- [ ] The 4 feature posts 404 anonymously until their day: `curl -sI https://vexcms.dev/posts/real-time-admin-and-live-preview | head -1` returns `404` on D1 (and the same for the other 3 slugs on the days before their publish day).
- [ ] Recap page 404s anonymously until D5: `curl -sI https://vexcms.dev/launch-week | head -1` returns `404` on D1–D4.
- [ ] Uptime monitors and analytics are live: see `.agent/docs/specs/2026-11-06-launch-infrastructure/operations.md`'s monitor table (UptimeRobot keyword/HTTP monitors) and its analytics section.

## Post-launch routine

Every day for 14 days after D1, in this order. Each item lands as a labelled GitHub issue, a
Discussions reply, or a `backlog.md` entry — never only in memory. New issues are triaged
within a week, matching `public-copy.md` § Who builds this.

1. GitHub issues labelled `status: needs-triage` — triage into a `type:`/`area:` label set, or
   reply and leave `needs-repro`. → labelled issue.
2. GitHub Discussions (Q&A, Ideas, Show and tell) — answer Q&A, mark accepted Ideas
   `type: feature` and file an issue for them. → Discussions reply + issue, where accepted.
3. The Show HN thread (D1–D3 only, while live) — reply within the blocked time block; every
   reply hand-written (Design Decision 2). → no artifact beyond the thread itself; file an
   issue for any bug or feature request raised in it.
4. Product Hunt comments (D2–D3 only, while live) — same reply discipline as Show HN. → issue
   for anything actionable.
5. dev.to and Hashnode comments on the cross-posts. → issue or Discussions reply.
6. LinkedIn comments on each day's post. → issue or Discussions reply.
7. Convex Discord #show-and-tell thread. → issue or Discussions reply.
8. DevHunt comments, for the full week its launch runs. → issue or Discussions reply.
9. `hello@vexcms.dev` — sponsorship, partnership, business enquiries, Code of Conduct reports
   (`public-copy.md` § Contact). → reply directly; Code of Conduct reports follow
   `CODE_OF_CONDUCT.md`'s enforcement path, not this log.
10. `security@vexcms.dev` — acknowledge within a week (`public-copy.md` § Security response
    window). → private vulnerability report or a tracked security issue, never a public one.

Every item swept also gets a row in the Feedback log above: date, source, a one-line summary,
and where it landed.

## Lint log

Filled and re-run in step 7. Columns: `Check` (the rule being tested) | `Post / slot` (which
kit slot it ran against) | `Result` (`pass` / `finding`) | `Note` (what the finding was, empty
on pass).

| Check | Post / slot | Result | Note |
| ----- | ----------- | ------ | ---- |

## Feedback log

Filled during the post-launch routine (step 5's routine section, used daily after launch).
Columns: `Date` | `Source` (GitHub issue / Discussions / HN thread / PH comment / dev.to or
Hashnode comment / LinkedIn / Convex Discord / DevHunt / `hello@` or `security@`) | `Summary` |
`Landed as` (issue number, Discussions reply link, or a `backlog.md` entry) | `Status`.

| Date | Source | Summary | Landed as | Status |
| ---- | ------ | ------- | --------- | ------ |
