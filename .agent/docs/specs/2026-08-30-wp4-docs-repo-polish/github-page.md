# GitHub repo page — draft copy

Repo: `github.com/ianyimi/vex`. This file is the paste-ready source for the
repo's "About" panel and social preview card. [agent]-drafted, [dev]-applied —
see the checklist below for exact settings-page paths. Nothing here requires
the WP-3/WP-6 deployed site except the admin screenshot, which is out of scope
for this step (tracked separately, see "Screenshot slot" at the bottom).

## Description

Paste verbatim into the About panel's "Description" field:

~~~text
Type-safe headless CMS built on Convex, with a real-time admin panel, end-to-end type inference, role-based access control, and Better Auth integration — no separate backend to run.
~~~

Length check: 187 characters (limit 350). No hype numbers (stars, "10k
downloads", etc.) — none exist yet and none are claimed.

## Topics

Paste one at a time into the About panel's "Topics" field (GitHub topics are
lowercase, hyphen-separated, no spaces):

~~~text
cms
headless-cms
convex
nextjs
typescript
react
admin-panel
rbac
real-time
better-auth
~~~

Rationale (sanity-checked against `package.json` names and shipped features,
not aspirational ones):

| Topic | Why |
| --- | --- |
| `cms` | What it is, broad discovery term |
| `headless-cms` | More specific category match (Payload/Strapi/Sanity peers) |
| `convex` | The database/backend the whole project is built on — primary differentiator |
| `nextjs` | `@vexcms/next` is the admin panel package; the only supported frontend adapter today |
| `typescript` | End-to-end type inference is the headline feature |
| `react` | `@vexcms/react` ships hooks/components consumed by the admin panel |
| `admin-panel` | Real-time admin UI is a top-4 launch objective (parent spec Objective #2) |
| `rbac` | `defineAccess` role-based permissions — shipped, and the meetup demo headline (`anonRole`, D3) |
| `real-time` | Convex reactive subscriptions power live admin/frontend updates |
| `better-auth` | `@vexcms/better-auth` is a first-class published package, not a side integration |

Dropped from consideration: `payload-cms` (avoids implying affiliation),
`self-hosted` (true but lower discovery value than the 10 above — cut to stay
at "~10" per the task brief), `richtext`/`json`/`drafts` (not shipped fields —
see parent spec D8 and Non-goals; would misrepresent the repo).

## Social preview card

GitHub renders the social preview at **1280×640px** (also used as the
Open Graph / Twitter card image when the repo is linked). Design brief for
whoever builds the image (agent or dev, out of scope for this markdown file):

- **Canvas**: 1280×640px, PNG or JPG, under 1MB (GitHub's hard limit — files
  over 1MB are rejected on upload)
- **Title text**: `VexCMS`
- **One-liner** (directly under the title): `Type-safe headless CMS for Convex`
- **Safe area**: keep all text inside the center ~1100×540px — GitHub crops
  card edges differently across Twitter/Slack/Discord link unfurls
- **Tone**: match the README hero — dark background, no screenshot required
  (the admin panel isn't deployed yet; ship a wordmark/type-only card now,
  swap in an admin screenshot later if desired — not blocking for launch)

## [dev] Apply checklist

All three settings live in different places in the GitHub UI. Exact paths:

1. **Description**: go to `https://github.com/ianyimi/vex`, click the gear
   icon (⚙️) next to **About** in the right sidebar → paste the Description
   text above into the "Description" field → **Save changes**.
2. **Topics**: same About panel as step 1 (gear icon next to **About**) →
   paste each of the 10 topics above into the "Topics" field (press Enter
   after each one) → **Save changes**.
3. **Social preview**: go to
   `https://github.com/ianyimi/vex/settings` → scroll to the **Social
   preview** section (under "Features", near the bottom of General settings)
   → click **Edit** → upload the 1280×640px image per the brief above.

## Screenshot slot

The README's admin-panel screenshot/GIF placeholder is placed by Step 2 of
this spec (a comment near the top of `README.md` marking where it lands).
It stays empty until WP-6 deploys the site — filling it in is WP-6 scope, not
this step. Do not upload an admin screenshot as the social preview image
until WP-6 ships; use the type-only card described above for launch.
