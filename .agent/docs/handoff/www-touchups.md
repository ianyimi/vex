# Handoff — www touch-ups

> Paste everything below the line into a fresh session.

---

You are doing touch-up work on the VexCMS marketing site (www).

## Repo

`/Users/zaye/Documents/Projects/vex.git/dev` — branch `master` (`rebuild` was
promoted and merged; `master` is now the release branch). Read
`.agent/AGENTS.md`, then run `harness doctor` and `harness state`.

## What's live

- **vexcms.dev** → `apps/www` (Vercel, root dir `apps/www`), Convex **prod**
  deployment `usable-bee-730`.
- **docs.vexcms.dev** → `apps/docs` (Astro Starlight).
- Packages published at `0.1.0-alpha.9` under the `alpha` dist-tag. `latest` is
  still the old `0.0.20` line — do not touch it.
- Local dev loop:
  - `pnpm --filter www exec vex dev` — codegen + Convex watcher against the
    **dev** deployment `vexcms-www:dev` (`strong-anteater-637`).
    (`pnpm dev:www:vex` is the root alias.)
  - `pnpm --filter www dev` — Next.js on :3030.

## The workflow the developer wants

1. Make every change in `apps/www` **first**. That is the source of truth for
   the marketing overlay.
2. Verify it there.
3. **Then** decide whether it belongs in the template. Most often this will be
   seed data, but it can be anything. Ask if it's ambiguous.
4. To sync: run `node scripts/template-diff.mjs` (reports MISSING / CHANGED /
   ORPHANED against the *effective* template file) and follow the
   `template-sync` skill at `.agent/skills/template-sync/SKILL.md`. Templates
   live at `packages/create-vexcms/templates/{base-nextjs,marketing-site}`.
   `marketing-site` is an overlay applied on top of `base-nextjs`: it can only
   add and overwrite, never delete, and it must not touch `package.json` — see
   `finalizeMarketingOverlay()` in `packages/create-vexcms/src/installers/base.ts`.
5. Any change to a published package or a template needs a changeset.

## Design + content truth

- Content spec: `.agent/docs/specs/2026-09-01-www-content-spec/spec.md`
- Design deliverables: `.agent/docs/design/www/`
- Roadmap truth: `apps/docs/src/content/docs/roadmap.md` — if it and the spec
  disagree, **the docs file wins**. Never claim an unshipped feature.
- Known, deliberate gap: `/features` is spec'd as
  hero · features · split×3 · code-showcase · cta but currently ships
  hero · features · how-it-works · cta. The three `Split` blocks need verbatim
  code excerpts from real files. Home also still carries a Roadmap block the
  spec omits.

## Hard constraints

- **12 field types only**: text, url, number, checkbox, select, date, color,
  upload, relationship, group, array, blocks. No richtext / json / `ui()` /
  `tabs()`, no per-instance admin field components, no versioning or drafts.
  Long prose is multiline `text`.
- `group()` not `object()`; `select` `defaultValue` is always an array; `upload`
  stores an array of media ids; lucide icon names must be canonical PascalCase
  keys of `icons` (e.g. `Sparkles`).
- **No animation library.** CSS keyframes + Tailwind v4 (`tw-animate-css`), and
  respect `prefers-reduced-motion`.
- Stack: Next.js 16 (Turbopack, RSC), Tailwind v4 (CSS-first tokens), Base UI +
  shadcn re-exported from `@vexcms/react`, Convex.

## Gotchas already paid for — do not rediscover these

- **`convex/seed.ts` `init` is insert-only-if-absent.** Re-running `pnpm seed`
  does **not** update documents that already exist. Prod is already seeded, so
  content edits to `seed.ts` will **not** appear on vexcms.dev — change those in
  the admin panel, or delete the document and re-seed. Keep `seed.ts` correct
  regardless: it is what a fresh scaffold gets.
- **`SITE_URL` is a Convex env var, not a Vercel one.** Read in
  `convex/auth/options.ts` for `baseURL` + `trustedOrigins`.
- **`NEXT_PUBLIC_CONVEX_URL` ends in `.convex.cloud`; `NEXT_PUBLIC_CONVEX_SITE_URL`
  ends in `.convex.site`.** Swapping them fails the build with
  "Invalid deployment address".
- **Better Auth prefixes its session cookie with `__Secure-` on https.** Always
  read `__Secure-better-auth.session_token` first, then the bare name. Getting
  this wrong produces an admin panel that signs in, renders its shell, and shows
  an empty dashboard with zero errors anywhere (AP-022).
- **Quote globs in `package.json` scripts** — `eslint "packages/*/src/**/*.{ts,tsx}"`.
  Unquoted, macOS and Linux CI lint different file sets (AP-021).
- **`pnpm --filter <pkg> <word>` runs a *script* named `<word>`, never a binary.**
  Use the script name (`vex:dev`) or `pnpm --filter <pkg> exec vex dev`.
- **`convex/tsconfig.json` needs `customConditions: ["source"]`** in this
  monorepo, matching the app tsconfig. Without it `convex dev`'s typecheck
  resolves `@vexcms/*` through `dist` and reports 5 phantom errors in
  `src/auth/access.ts` and `src/vex.config.ts`. Harmless in scaffolded projects
  (TypeScript falls through when the `source` target isn't shipped), and it is
  what makes LSP jump to package source.
- Read `.agent/docs/standards/anti-patterns.md` (AP-018 → AP-022) before
  debugging anything auth-, scroll-, or CI-related. In particular: **"renders
  but empty, with no errors" means an authorisation filter returned empty**, not
  that a request failed.

## Verification

- Repo: `pnpm lint` (must be **0 errors**; ~222 warnings are pre-existing),
  `npx turbo typecheck test build --force` (**26/26**),
  `node scripts/check-packed-manifests.mjs` (exit 0).
- Templates: `node scripts/scaffold-smoke.mjs` and `node scripts/scaffold-smoke.mjs --bare`.
- UI changes: verify in a real browser against :3030 — not just tests.

## Committing

`workflow.commit_mode` is `message-only`, and project rule **P-016 is ONE commit
per run covering the whole working tree** — never split by concern; use
bold-headed paragraphs in the body instead. Write the message to
`.agent/docs/session-log/2026/09/<date>.commit.md`, add a section to
`.agent/docs/commits/MM-DD-YYYY.md` with the exact file list and a
copy-pasteable `git add … && git commit -F …` block, then let the developer run
it. Keep the trailing backslash on the **last** `git add` line or the `&&`
breaks.
