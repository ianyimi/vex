# Magazine — playbook

Private. Beats only — no spoken sentences (Design Decision 11); the developer speaks in their own
words.

## Stage tags

`magazine/01-scaffold`, `02-collections`, `03-access`, `04-seed`, `05-front-end`, `06-deployed`.

## Accounts

| Role | Env | Name |
|---|---|---|
| Admin | `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` | Demo Admin |
| Editor | `DEMO_EDITOR_EMAIL` / `DEMO_EDITOR_PASSWORD` | Demo Editor |
| Author A | `DEMO_AUTHOR_A_EMAIL` / `DEMO_AUTHOR_A_PASSWORD` | Mina Oduya (5 articles) |
| Author B | `DEMO_AUTHOR_B_EMAIL` / `DEMO_AUTHOR_B_PASSWORD` | Theo Castellanos (3 articles) |
| Author C | `DEMO_AUTHOR_C_EMAIL` / `DEMO_AUTHOR_C_PASSWORD` | Priya Natarajan (0 articles) |

## Seed data

- 4 categories: Technology, Culture, Business, Science.
- 3 author bylines, each a signed-in account (decision 22 — ownership = user, no separate
  `authors` collection): Mina Oduya (author A), Theo Castellanos (author B), Priya Natarajan
  (author C, 0 articles — demonstrates an author page with no published work yet).
- 8 articles: "The Fold Is Dead, Long Live the Fold" (featured), "Why Your Inbox Hates You", "The
  Four-Day Week, Three Years In", "Dispatch From a Flooded Archive" (featured, has an unpublished
  revision), "Notes on Being Terminally Online" (draft-only), "The Quiet Rise of Backyard
  Observatories", "What a Decade of Minimalism Actually Cost Me", "Small Press, Big Numbers".

## Launch day

D2–D5 (Design Decision 3 — magazine covers all four launch days).

## Start state + reset

Start from `magazine/05-front-end` with `pnpm seed:reinit` run. Between scripts: `pnpm seed:reset`
removes any take-created article and restores every seeded document to the file's content.

## 5-minute script

Starts from `05-front-end` with seeded data; one live change.

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 30s | 05-front-end | `:3200/admin` articles list, 8 seeded articles | F1, F2, F52 — https://docs.vexcms.dev/guides/quickstart/ | |
| 2 | 40s | 05-front-end | Open "The Fold Is Dead…" edit view, live-preview pane open on `/articles/the-fold-is-dead-long-live-the-fold` | F33 — https://docs.vexcms.dev/guides/live-preview/; F19 — https://docs.vexcms.dev/fields/richtext/ | No visitor comment form on the public article page — form builder for visitor submissions isn't shipped yet (#57) |
| 3 | 60s | (same) | Edit the excerpt live; preview updates with no save | F4, F7, F8, F11, F13 — https://docs.vexcms.dev/fields/text/, /fields/date/, /fields/textarea/, /fields/relationship/ | |
| 4 | 40s | (same) | Save as draft, don't publish | F31 — https://docs.vexcms.dev/guides/versioning-and-drafts/ | |
| 5 | 50s | (same) | Sign in as author B in a second session; "Mina's" draft is not visible in author B's article list | F39 — https://docs.vexcms.dev/guides/access-control/ | |
| 6 | 40s | (same) | As editor, publish the edited article; public `/articles/<slug>` updates | F49, F50 — https://docs.vexcms.dev/guides/local-api/, /guides/caching-and-seo/ | Articles publish immediately — no scheduled publish-at time yet (#63) |
| 7 | 40s | (same) | Open "Notes on Being Terminally Online" (draft-only) via its live-preview Draft Mode link | F35 — https://docs.vexcms.dev/guides/live-preview/ | |

## 15-minute script

Scaffolds live, jumps across tags, ends on the deploy beat shown from Step 11's run-through
transcript — never a live production deploy.

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 90s | (live scaffold) | `pnpm create vexcms@alpha magazine-demo --bare`; sign up; land in `/admin` as auto-promoted admin | F55 — https://docs.vexcms.dev/guides/quickstart/; F37 — https://docs.vexcms.dev/guides/auth/ | |
| 2 | 90s | 02-collections | `src/vexcms/collections/articles.ts` in the editor; `pnpm vex:dev` regenerating `vex.schema.ts`/`vex.types.ts` | F1, F2, F52 — https://docs.vexcms.dev/guides/quickstart/ | |
| 3 | 120s | (same) | Add `subtitle: text()` to `articles.ts` live; save; the field appears in the admin form and in `Article`'s generated type | F1, F2 (config → schema → types loop) | One locale only — no per-article translations yet (#59) |
| 4 | 150s | 03-access | `src/auth/access.ts` matrix; author cannot open another author's article; attempt a duplicate slug, show the server-rejected `VexError`; toggle `featured` as author (disabled) then as editor (works) | F39, F40, F43, F45 — https://docs.vexcms.dev/guides/access-control/, /guides/lifecycle-hooks/ | |
| 5 | 150s | 04-seed/05-front-end | Edit a published article twice, save each time, open History, restore the first version | F31, F32 — https://docs.vexcms.dev/guides/versioning-and-drafts/ | |
| 6 | 60s | (same) | Draft-only article's public URL signed out (404) vs. signed in with live preview (renders) | F35 — https://docs.vexcms.dev/guides/live-preview/ | |
| 7 | 90s | (narrated from Step 11's transcript) | Vercel build log showing `vex deploy --cmd` running; `demo:accounts --prod`; `convex env set AUTH_DISABLE_SIGN_UP true --prod`; the live URL in `magazine/README.md` | F53 — https://docs.vexcms.dev/guides/deployment/ | |

## Shot list

| File | ≤ 60 s | Shows | From | Day |
|---|---|---|---|---|
| `real-time-admin-and-live-preview.mp4` | yes | Article edit view with live-preview pane open; edit a field; preview updates with no reload | `:3200/admin`, an existing article edit view; preview iframe on `/articles/<slug>` | D2 |
| `one-config-schema-and-types.mp4` | yes | `articles.ts`'s `defineCollection`; `pnpm vex:dev` regenerating in a terminal; the generated `Article` type; the admin form rendering the new field | editor on `magazine/src/vexcms/collections/articles.ts`, a terminal, `:3200/admin` | D3 |
| `access-control-hooks-validation.mp4` | yes | `access.ts` matrix for `articles`; an author attempting another author's edit, denied; a duplicate slug rejected server-side | editor on `magazine/src/auth/access.ts`, `:3200/admin` under two sessions | D4 |
| `create-vexcms-to-deployed.mp4` | yes | `pnpm create vexcms@alpha magazine …` scaffolding end to end; the scaffolded site open in a browser | terminal in a scratch directory, the scaffold's own dev server | D5 |
