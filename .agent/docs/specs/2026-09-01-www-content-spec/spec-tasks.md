---
status: in-progress
spec_id: 2026-09-01-www-content-spec
touches:
  - "apps/www/**"
  - "packages/create-vexcms/templates/marketing-site/**"
  - ".agent/docs/design/www/**"
  - ".agent/docs/design/README.md"
  - ".agent/docs/specs/2026-09-01-www-content-spec/**"
  - "packages/core/src/types/generateVexTypes.ts"
  - "packages/core/src/types/generateVexTypes.test.ts"
  - ".changeset/*.md"
  - "pnpm-workspace.yaml"
  - "pnpm-lock.yaml"
  - "package.json"
prompt_version: 1
---

# 2026-09-01-www-content-spec — Tasks

Parent: `spec.md` in this folder (sitemap, per-page content, block inventory,
component sourcing). Design authority: `.agent/docs/design/www/design-spec.txt`
— **section B is normative per block; section C is only a seed order.** Theme
record: `.agent/docs/design/www/theme.stark-ember.json`. Extra `@theme` tokens:
`.agent/docs/design/www/globals.tokens.css`.

Build order below is the design agent's, unchanged (`design-spec.txt` §20). It
is ordered so the site is coherent at every intermediate step, and so the
CodeShowcase pane primitive exists before Split needs it.

**Ground truth (verified 2026-09-01):** `apps/www` was scaffolded from the
published marketing template with
`node packages/create-vexcms/dist/index.js www --monorepo --yes` and linked with
`pnpm install --no-frozen-lockfile` (13 workspace projects). It ships 8 blocks,
the `themes`/`themeColors` collections, the `siteSettings` global, the
`(site)` chrome layout, and the CSS-only `motion-primitives` kit. Port 3010.

**Confirmed deviations from the brief** (both argued in `design-spec.txt` §21,
both accepted): Roadmap renders In progress → Planned → Exploring → Shipped;
dark-mode `primaryForeground` is near-black. Contrast recomputed independently —
white on dark primary is **3.09:1** (fails normal-text AA), near-black is
**6.44:1**. Every other contrast figure in §18 is conservative.

**Standing rules for every group:** semantic tokens only (the fixed
`--color-code-*` pane palette is the sole exception); no `motion`/framer-motion;
no `radix-ui`; no required media; every block owns its own padding and container
and must read correctly stacked in any order.

## Step 1 — Theme record, `@theme` tokens, fonts [agent]
Why: every later step assumes the 32 properties resolve and a light/dark swap is
non-destructive. Building a block first means restyling it twice.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] Paste `globals.tokens.css` into `apps/www/src/app/globals.css` — motion, radius scale, shadow scale, section rhythm, the 9 `--color-code-*` tokens, `livepulse`, the `.reveal-group` stagger contract, the reduced-motion full stop, and the base layer (`::selection`, prose links, smooth scroll, skip link)
- [x] `next/font/google`: Geist 400/500/600/700/800 → `--font-sans`, Geist_Mono 400/500 → `--font-mono`, both `display: "swap"`; mono gets `font-feature-settings: "ss01" 1, "calt" 1`
- [x] Add the skip-to-content link to `src/app/(frontend)/(site)/layout.tsx`, visually hidden until focused, above the sticky header
- [x] Confirm `THEME_COLOR_TOKENS` ordering matches `theme.stark-ember.json` keys exactly — 32 in both maps, no extras, no omissions
- [x] Manual: swap `siteSettings.activeTheme` light↔dark on a bare page; no unstyled flash, no token resolving to `initial`

## Step 2 — Chrome: Header + Footer [agent]
Why: gives every route a frame, so no later step is judged against an
unfinished page.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] Header per §04: `sticky top-0 z-50`, `h-14` mobile / `h-16` md, dropping to `h-14` scrolled; at `scrollY > 8` add `bg-background/70 backdrop-blur-md border-b border-border` over 180ms
- [x] The scroll listener is passive and rAF-throttled and is the only client listener on the page
- [x] Below md the nav becomes a Sheet from the top, `rounded-lg`, 44px minimum rows, actions stacked full-width behind a Separator; at 7+ menu items the switch moves to lg — never wrap the bar, never shrink type
- [x] Inline chevron SVG mark in the layout (not media) so a fresh scaffold always has a logo; `logoImage` renders `h-5 w-auto` instead when present
- [x] Footer per §14: single wrapping link row, **not** a multi-column sitemap (`links` is a flat array with no group field); `border-t` suppressed when it follows a bordered block; `© {year}` generated at render; social icon falls back to the platform string as a text link when the lucide name does not resolve
- [x] Empty states: no links → logo alone, bottom rule dropped; no socials → copyright alone; zero action buttons → right cluster disappears

## Step 3 — Clear the scaffold's lint debt [agent]
Why: a freshly scaffolded project fails `pnpm lint` with **17 errors and 214
warnings** before anyone writes a line — measured on the untouched `apps/www`
scaffold, so it is what every `create-vexcms` user sees on first run. It also
means no later group can use lint as a gate. None of the errors come from the
design work; all of them ship in the template.
Verify: pnpm --filter www lint
- [x] `eslint --fix` the mechanical set — `perfectionist/sort-*` accounts for 3 errors and the bulk of the warnings
- [x] `PageContent.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`: 6 `no-unsafe-assignment` / `no-unsafe-member-access` errors from `anyApi` losing types. Type the Convex query results instead of widening to `any`
- [x] `FirstAdminBootstrap.tsx`, `WelcomePage.tsx`: 3 `react-hooks/set-state-in-effect` errors
- [x] `motion-primitives/text-effect.tsx`: 1 `react-hooks/immutability` error — the `animatedIndex` counter mutated during render
- [x] `src/vex.types.ts`: 2 `no-empty-object-type` errors in **generated** output. Fix the emitter in `@vexcms/cli`, or have it emit a file-level disable — never hand-edit the generated file
- [x] Re-baseline: `pnpm --filter www lint` exits 0, and Step 10 ports every fix into the template

## Step 4 — Hero, both variants [agent]
Why: `compact` unblocks both interior pages and is the simpler shape; `full`
carries the only entrance animation on the site.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] Amend `Hero/config.ts`: add `installCommand: text()` and `variant: select[full|compact] defaultValue: ["full"]`
- [x] `compact` first per §05: left-aligned band, no `min-h`, no install row, no decorative background, closed with `border-b`; `badgeText` renders as the 12px tracked uppercase eyebrow, not a pill
- [x] `full`: `min-h-[90vh]` centred, badge → 32px → h1 → 28px → sub → 40px → CTAs → 28px → install row
- [x] Decorative background is token-derived only — 80px hairline grid at 22% masked by a radial fade, plus one `bg-primary/10 blur-[120px]` ellipse. No image, no baked palette colours
- [x] Install row is the hero's only client component: `$` prompt is `aria-hidden` and excluded from the copied string; Copy → Check for 1.6s with `aria-live="polite"`; below 640 it is `overflow-x-auto`, never two lines
- [x] Entrance budget per §03 — badge 0ms, h1 `TextEffect per="word"` 80ms + 40ms/word, sub 280ms, CTAs 380ms, install 460ms. `compact` animates h1 + sub only at 0/100ms with no word split
- [x] Overflow: `text-wrap: balance` on h1, `pretty` on sub, no `min-h` on the text column, never clamp; blank subheading collapses h1→CTA to 32px

## Step 5 — CodeShowcase + the shared pane primitive [agent]
Why: the most important section on the site, and it produces the pane component
Split reuses. Doing the shiki pass, chrome, copy button, long-line scroll, and
tab mode here avoids a later refactor.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] Add `shiki` and build the 5-colour theme from `shiki.stark-ember.json`; one server pass, dark only, client ships no highlighter
- [x] Scope mapping per §19: comment → dim · keyword/storage.type/constant.language/support.type.primitive → key · entity.name.function/entity.name.type/support.class → ident · string/constant.numeric → string · punctuation/meta.brace → punct · rest → code-fg
- [x] New `CodeShowcase` block — `heading` · `subheading?` · `panes: array(group{ label, filename?, language: select[ts|tsx|bash|json], code, caption? })`; register in `blocks/config.ts` + `constants.ts`
- [x] Two panes share one frame split `xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]` with a `bg-border` seam; **both pane columns carry `min-w-0`** or the longest line sets min-content width and the code clips instead of scrolling
- [x] Pane chrome `h-10 bg-card border-b`: label 11px uppercase — `text-primary` on the authored pane, `text-muted-foreground` on every other, which is the entire hand-written-vs-generated signal — then filename, language chip, copy button
- [x] Body on `--color-code-bg`, `overflow-x-auto overscroll-x-contain white-space: pre`, `max-h-[560px]` / 420px below md then vertical scroll, thin styled scrollbar, no line numbers, no traffic lights
- [x] 3+ panes → `Tabs` from `@vexcms/react` replacing the chrome bar inside the same frame, all panels server-rendered and toggled with `hidden`; 1 pane → frame alone; 0 panes → block renders nothing
- [x] Captions sit outside the frame, per-pane and column-aligned; row omitted entirely when no pane has one

## Step 6 — CTA, then Features [agent]
Why: CTA closes all three pages and is half an hour. Features gives home and
`/features` their body — home is shippable at the end of this step.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] CTA per §12: full-bleed `bg-card border-y`, `py-16 md:py-24 xl:py-32` (the only block permitted more air), centred; renderer assigns variants by index — first `default`, rest `outline`; 0 actions still renders as a closing statement
- [x] CTA and Stats share `bg-card` and must never be adjacent; the footer's `border-t` is suppressed directly under CTA
- [x] Features per §07: hairline mesh — `gap-px bg-border border rounded-md overflow-hidden`, cells `bg-background p-6` — **not** gapped cards with shadows, which dark mode cannot have
- [x] 32px icon frame, `Icon size-4 text-primary`; blank/unresolvable icon drops the frame entirely rather than leaving it empty, and the title moves to the top of the cell
- [x] Icons `Wand · ShieldCheck · Radio · Lock · Boxes · LayoutGrid`, all verified canonical
- [x] Overflow: 1 item is one full-width cell; 2 at xl leaves the third column empty and does not centre; 12 items is 4 rows with no pagination

## Step 7 — Stats, HowItWorks, FAQ [agent]
Why: three independent low-risk blocks that finish the home page. Stats first —
it is the only other `bg-card` band and it validates the surface rhythm.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] New `Stats` block — `heading?` · `subheading?` · `items: array(group{ value, label, description? })`; `value` is `text` so `"0"`, `"12"`, `"~30s"` all render
- [x] Stats per §06: full-bleed `bg-card border-y`, `py-10 md:py-14 xl:py-16`, `grid-cols-1 md:grid-cols-2 xl:grid-cols-4` separated by 1px dividers not gaps; at md the 2×2 needs a horizontal divider too and the first cell per row drops its left border
- [x] Values are `items-start` top-aligned per cell, never baseline-aligned to each other; >6 characters drops to `text-4xl`; no count-up, no unit added by the renderer
- [x] HowItWorks per §10: horizontal numbered rail on `border-t pt-6`, `xl:grid-cols-4`; step head is mono index → `flex-1 h-px bg-border` connector → icon right; last connector retained. Origin UI's `Slot.Root` removed, its dot-and-line SVG replaced by border utilities
- [x] HowItWorks overflow: >8 items switches to `xl:grid-cols-3`; blank icon lets the connector run full width
- [x] FAQ per §11: two columns `xl:grid-cols-[4fr_7fr]`, header left with the support link, accordion right — items are rules not cards, `Plus`→`Minus` swap with no rotation, first open, 52px minimum hit target, answer capped at 68ch
- [x] Support-link label is fixed copy in the renderer ("Open an issue"); the field stores only the href

## Step 8 — Split [agent]
Why: reuses step 4's pane primitive and completes `/features`.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] New `Split` block — `eyebrow?` · `heading` · `body` · `bullets: array(group{ icon?, text })` · `media: select[code|image|none]` · `code?` · `codeFilename?` · `codeLanguage` · `image?: upload` · `mediaPosition: select[right|left]`
- [x] Build `code` first per §09 — it is the only variant a scaffolded project sees
- [x] Grid `xl:grid-cols-[5fr_6fr] gap-14 items-center`; `mediaPosition: "left"` is `[6fr_5fr]` **with order classes, never reversed source order**, so reading order stays text-first for assistive tech; mobile is one column with text always first
- [x] Bullets: 16px icon slot `text-primary`; a missing icon becomes a 4px `bg-primary` dot holding the same indent; 8+ bullets go `md:grid-cols-2`; `ul/li` with `list-none`
- [x] `media: "image"` with an empty `image` **falls through to `none`** — never a placeholder box, never a broken frame
- [x] `none` becomes `xl:grid-cols-[7fr_5fr]` with bullets as a divided list in the right column; no media and no bullets collapses to a single 46rem prose column
- [x] Consecutive Splits alternate by field value, not `:nth-child`, so an editor can break the alternation

## Step 9 — Roadmap, four statuses [agent]
Why: the only block with real branching logic, and it blocks nothing else.
Verify: pnpm --filter www typecheck && pnpm --filter www build
- [x] Amend `Roadmap/config.ts`: `status` options become `shipped | in-progress | planned | exploring`
- [x] Group order is **In progress → Planned → Exploring → Shipped** (§21, confirmed); array order within a bucket is preserved; an empty bucket prints nothing
- [x] Four densities per §13 — In progress: cards `md:grid-cols-2`, only when the bucket has ≥2 items · Planned: two-column rows · Exploring: dashed chips, description becomes a Tooltip · Shipped: dense two-column checklist at 14.5px, quieter than everything else
- [x] Badges share one geometry and differ only by border, fill, and glyph — no second accent hue. Status is never conveyed by colour alone
- [x] The In-progress dot is the one blessed `livepulse` loop
- [x] Statuses and grouping land before the tab filter; the page must be correct with JS disabled (all groups visible)
- [x] Tab filter counts come from the array, never hardcoded; not rendered below 8 total items; below md it is a scrollable row, never a Select

## Step 10 — Provision the `apps/www` Convex deployment [dev]
Why: the scaffold wrote `NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud`
and an empty `CONVEX_DEPLOYMENT` — `--yes` cannot provision. Steps 1–8 verify on
typecheck + build and do not need a backend, but the seed and all four manual
audits in Step 9 do. Provisioning creates a cloud resource on the developer's
Convex account and needs an interactive login, so an agent must not do it.
Verify: manual
- [x] `cd apps/www && npx convex dev` — log in, create the deployment, let it push the generated schema, then stop it
- [x] Confirm `.env.local` now carries a real `CONVEX_DEPLOYMENT` and a non-placeholder `NEXT_PUBLIC_CONVEX_URL`
- [x] Decide whether this deployment is the one the production site will use, or a dev deployment with a separate prod deployment created at WP-6 deploy time

## Step 11 — Seed all three pages, then audit [agent]
Why: the seed is the deliverable — `pnpm seed` must stand the whole site up from
an empty deployment, and Phase 4 ports it verbatim.
Verify: pnpm --filter www typecheck && pnpm --filter www build && pnpm --filter www lint
- [ ] Extend `convex/seed.ts` `init`: the Stark × Ember record from `theme.stark-ember.json`, `siteSettings`, Main Header, Main Footer, and the three pages with their full block sequences
- [ ] Content is `spec.md` §Page 1–3 verbatim; roadmap items are the 33 from `apps/docs/src/content/docs/roadmap.md`, which wins any disagreement
- [ ] Apply every content-truth correction: Apache-2.0 never MIT; versioning/drafts/live preview only ever "In progress"; no `/pricing`; no `x.com` social; `pnpm create vexcms@latest`
- [ ] Idempotent — every insert guarded by a natural-key lookup. Running twice reports everything skipped
- [ ] Manual audit 1: light theme on all three pages
- [ ] Manual audit 2: `prefers-reduced-motion: reduce` — animation is a full stop, final state painted immediately
- [ ] Manual audit 3: keyboard-only traversal including the code panes' scroll regions; focus-visible legible on both `bg-background` and the pane surface
- [ ] Manual audit 4: empty media library — no section may look broken

## Step 12 — Port to the marketing template, verify a fresh scaffold [agent]
Why: this site ships twice. A design that only exists in `apps/www` is half
delivered, and the template is what the meetup demo scaffolds.
Verify: pnpm build && pnpm typecheck && pnpm test
- [x] Port the 3 new blocks, 2 amended configs, 5 refined renderers, `globals.css` additions, the shiki theme, and `seed.ts` into `packages/create-vexcms/templates/marketing-site`
- [x] Port the four defects found by running the scaffold, all of which ship to users today:
      **(a)** `next.config.ts` — `turbopack.root` pinned to the app dir breaks every `--monorepo` scaffold's build (`Could not find the Next.js package`); replaced with a `pnpm-workspace.yaml` walk-up.
      **(b)** the marketing overlay must **delete** `src/app/(frontend)/page.tsx` — it collides with `(frontend)/(site)/page.tsx` on `/`, and the bare `WelcomePage` wins, so the marketing home is unreachable.
      **(c)** the marketing overlay needs its **own** `src/proxy.ts` — base's fail-closed matcher guards everything but `/`, so `/features` and `/roadmap` 307 to sign-in. Marketing guards `/admin/:path*` only. Base's variant must stay as-is.
      **(d)** the emitter, lint, and `anyApi` fixes from Step 3.
- [x] Strip every `apps/www`-specific value — no deployment URL, no Convex deployment id, no domain
- [x] Scaffold a throwaway project from the template outside the monorepo, run `pnpm seed`, and confirm all three pages render with an empty media library
- [x] Changesets: one for `packages/create-vexcms` (the template design), one for `@vexcms/core` (the generated-types eslint header — a published behaviour change)
