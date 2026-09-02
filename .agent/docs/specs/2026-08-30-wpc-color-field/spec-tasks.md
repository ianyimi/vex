---
status: done
spec_id: 2026-08-30-wpc-color-field
touches:
  - "apps/www/src/app/globals.css"
  - "packages/react/src/components/**"
  - "packages/core/src/fields/constants.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/fields/index.ts"
  - "packages/core/src/fields/color/**"
  - "packages/core/src/fields/validators/index.ts"
  - "packages/core/src/fields/inputSchemas/index.ts"
  - "packages/react/src/components/fields/index.tsx"
  - "packages/react/src/components/fields/index.test.tsx"
  - "packages/react/src/components/fields/color/**"
  - "packages/react/src/adapter.ts"
  - "apps/www/src/vexcms/collections/**"
  - "apps/www/src/vexcms/globals/**"
  - "apps/www/src/vex.config.ts"
  - "apps/www/src/auth/access.ts"
  - "apps/www/src/db/constants/index.ts"
  - "apps/www/src/components/ThemeStyle.tsx"
  - "apps/www/src/app/**"
  - "apps/www/convex/theme.ts"
  - "apps/www/convex/schema.ts"
  - "apps/www/convex/seed.ts"
  - ".changeset/*.md"
prompt_version: 1
---

# 2026-08-30-wpc-color-field — Tasks

Parent: `2026-08-30-launch-readiness` **WP-C**. Steps 0–6 are `[agent]`, Step 7
is `[dev]`. **Gates WP-2** — the marketing template has 57 `color()` call sites
and must be authored against the final field set.

**Done means the loop closes.** Today `apps/www` seeds a theme document that no
code reads. The finish line is Step 7's ten-point script: edit a theme colour,
save, reload, watch **both the site and the admin panel** change; switch the
active theme, watch it change again; set an admin theme, watch the two diverge.

## Amendment to parent decision D8

D8 pinned the "simplified 7-field `themes.ts` shape". **This spec supersedes
that**: the full shadcn 32-token set × light/dark, via `group` (`tabs` stays
cut). Master's `apps/www` root layout themed the admin panel too, and that only
works when the theme owns every token — a 4-field theme moves `--background`
without `--foreground` and breaks contrast. The token set *is* the feature.

Everything else in D8 stands: `ui`, `tabs`, `richtext` and `json` remain cut.

## Session decisions

- **Design tokens collapse 48 → shadcn's 32.** Measured: 13 of the 16 extras
  have **zero** component references; the other three have 14 call sites with
  exact shadcn equivalents (`muted-foreground`, `primary/90`, `destructive`).
  Matching shadcn is what lets tweakcn presets map with no gaps.
- **The theme applies to the whole document, admin included** — `<ThemeStyle />`
  in the root layout, as master's `apps/www` did.
- **The admin can opt out** via `siteSettings.adminTheme`, emitted at
  `:root:root` — specificity (0,2,0) beats `:root`'s (0,1,0), so it wins with no
  dependence on style-injection order. Empty by default.
- **`app/(frontend)/layout.tsx` is restored**, so the `@auth` parallel slot lands
  in the group that declares it instead of the root layout shared with `/admin`.
- **`format: "hex" | "rgb" | "hsl" | "oklch"`**, default `"hex"`; `themes.ts`
  uses `oklch` because that is what `globals.css` declares. Validation accepts
  all four, so changing `format` never invalidates existing documents.
- **The pivot type is `ColorValue` (sRGB + alpha), not HSVA** — which lets core
  own the whole conversion layer with zero dependencies. **No dependency is added
  anywhere by this spec.**
- **OKLCh precision is measured, not chosen** — L2 C5 H2, the coarsest with zero
  round-trip drift across a 4096-colour lattice.

Ordering is strict: Step 0 defines the token set both `themes.ts` and
`ThemeStyle` derive from; Step 1 is the guard rail that makes 2 and 3 safe.

## Step 0 — Collapse the design tokens from 48 to shadcn's 32 [agent]
Why: `themes.ts`'s field list and `ThemeStyle`'s token map are both derived from
this set, and a theme can only own tokens that exist. Cheap because almost
nothing uses the extras.
Verify:
- [x] `apps/www/src/app/globals.css` — 48 declaration lines removed (16 tokens × `:root` + `.dark` + `@theme inline`); file 315 → 267
- [x] 14 call sites migrated: 10 × `muted-foreground-subtle` → `muted-foreground`, 3 × `primary-hover` → `primary/90`, 1 × `text-warning` → `text-destructive`
- [x] `pnpm build` 10/10 and `pnpm typecheck` 14/14
- [x] The residual-reference grep in the spec returns nothing

## Step 1 — Make field-type dispatch exhaustive [agent]
Why: `fields/validators/index.ts`, `fields/inputSchemas/index.ts` and
`getCollectionColumnDefs` all end in `default: throw new Error(...)`, which
absorbs a missing case into a runtime failure. `noFallthroughCasesInSwitch` does
not catch it. Doing this first turns the most forgettable part of field work
(six registries) into a checklist the compiler writes.

Correction to the parent plan: a dummy `ADMIN_FIELDS` entry alone does **not**
trip the core dispatches — they switch on the `AdminField` union, not on
`keyof typeof ADMIN_FIELDS`. The negative test needs a dummy union member too.
Verify:
- [x] `never` assertion replaces the bare default in both core dispatches and the columnDef switch
- [x] `packages/react/src/components/fields/index.test.tsx` — registry-parity test
- [x] `pnpm test` green
- [x] Negative test: add `ADMIN_FIELDS.dummy` **and** a `DummyField` union member; `pnpm typecheck` must fail naming all six sites. Revert both

## Step 2 — Core `color` field [agent]
Why: the field must exist in core before React can import its type. This group
also carries the **entire colour-maths surface**, so Step 3 adds no conversion
code. `formats.ts` lands first — one `as const` map carries both the
`ColorFormat` union (P-003) and the per-notation pattern, so `inputSchema` and
`convert` cannot disagree about what `"oklch"` means. `convert.ts` follows, with
the lattice sweep that fixes its precision constants.
Verify:
- [x] `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS.color` + `ColorFieldType`
- [x] `packages/core/src/fields/color/{formats,convert,types,config,inputSchema,validator,index}.ts`
- [x] `packages/core/src/fields/color/{convert,config,inputSchema,validator}.test.ts`
- [x] `types.ts` union, `index.ts` barrel, both dispatches gain a `color` case
- [x] `pnpm --filter @vexcms/core test` green (873), including the 4096-colour sweep
- [x] `pnpm typecheck` fails **only** in `@vexcms/react`, which Step 3 fixes

## Step 3 — React `color` field [agent]
Why: closes the registries Step 2 opened. `@uiw/react-color-sketch@2.9.6` is
already a dependency and entirely unused — the field was started and abandoned.
No other dependency is needed: every conversion call goes to core.
Verify:
- [x] `color/{themeTokens.ts,themeTokens.test.ts,Cell.tsx,columnDef.tsx,Input.tsx,index.ts}`
- [x] `fields/index.tsx` — barrel, both maps, columnDef case; `adapter.ts` entry
- [x] `pnpm build && pnpm typecheck && pnpm test` green (43 React tests); parity counts 12 field types
- [x] `git diff packages/react/package.json pnpm-workspace.yaml` is **empty**

## Step 4 — `themes.ts` gains the full 32-token palette [agent]
Why: the D8 amendment in code. `format: "oklch"` throughout so `ThemeStyle`
interpolates stored strings into custom properties with no conversion. Defaults
are the Stark × Ember values already in `globals.css`, so a new theme starts from
the house palette instead of empty pickers.

Measured gotchas: `admin.defaultColumns` does not exist on `defineCollection`
(`TS2353`), and `vex generate` ignores `--cwd` — run it from inside `apps/www`.
Verify:
- [x] `apps/www/src/vexcms/collections/themes.ts` — `light`/`dark` groups of 32 `color({ format: "oklch" })` fields
- [x] `cd apps/www && node ../../packages/cli/dist/index.js generate` — `themes` becomes two 32-key `v.object`s
- [x] `pnpm typecheck` 14/14

## Step 5 — `siteSettings` becomes a global with two theme references [agent]
Why: nothing reads the themes collection today. `siteSettings` is a singleton —
the seed already enforces that with an `insertIfEmpty` guard — so it becomes a
global like `nav`, and both theme references sit where one `getGlobal` call
reaches them. `relationship` always stores an array (`hasMany` is a UI-only
hint), so consumers read `[0]`.

Measured gotcha: `convex/schema.ts` is hand-maintained and the CLI only *adds*
imports, so the dropped `site_settings` table must be removed by hand or `tsc`
fails with `TS2305`.
Verify:
- [x] `db/constants/index.ts` — `TABLE_SLUG_SITE_SETTINGS` out, `GLOBAL_SLUG_SITE_SETTINGS` in
- [x] `vexcms/globals/siteSettings.ts` new with `activeTheme` + `adminTheme`; collection file deleted
- [x] `collections/index.ts`, `globals/index.ts`, `vex.config.ts`, `auth/access.ts` updated
- [x] regenerate — `vex.types.ts` gains `SiteSettingsGlobal`, `GlobalSlug` becomes `"nav" | "siteSettings"`
- [x] `convex/schema.ts` — `site_settings` removed from the import list and `defineSchema`
- [x] `pnpm typecheck` 14/14

## Step 6 — Apply the theme to the whole app [agent]
Why: the observable half, and where the admin adopts the site's palette. The root
layout emits the site theme at `:root`; the admin layout emits its own at
`:root:root`, which outranks it on admin routes only and falls back to the site
theme when `adminTheme` is empty.

Also restores `app/(frontend)/layout.tsx` (three `git mv`s — route groups do not
change URLs) and deletes `apps/www/convex/themes.ts`, which despite its name
queries *pages* and is imported by nothing.

Measured gotcha: the ctx type is `QueryCtx` from `./_generated/server` —
deriving it from the `query` builder's parameter fails with `TS2339`.
Verify:
- [x] `convex/themes.ts` deleted; `convex/theme.ts` added with `getActive` + `getAdmin` (both access-bypassed)
- [x] `src/components/ThemeStyle.tsx` added
- [x] public pages + `PageContent` moved into `(frontend)/`; new `(frontend)/layout.tsx` takes the `auth` slot
- [x] root layout renders `<ThemeStyle />` and no longer takes `auth`
- [x] admin layout renders `<ThemeStyle scope="admin" />`
- [x] `pnpm build` 10/10 — `www#build`'s full Next build is what proves the moved routes compile

## Step 7 — Seed the palettes and rehearse the loop [dev]
Why: manual testing needs data, and the ten-point script is this spec's real
acceptance test. Four presets, each carrying all 32 tokens in both schemes:
Stark × Ember lifted verbatim from `globals.css` (so activating it is a visual
no-op and therefore the control case), plus Modern Minimal, Violet Bloom and
T3 Chat from tweakcn, converted with `serializeColor` — the same function the
picker writes with.
Verify:
- [x] `convex/seed.ts` — `init` writes the `vex_globals` row; inline theme dropped; `THEME_PRESETS` + `themes` mutation appended
- [x] `pnpm dev:vex` + `pnpm dev:app`, then `npx convex run seed:init && npx convex run seed:themes`
- [x] Activating Stark × Ember changes **nothing** visually (the control)
- [x] Theme edit view shows Light/Dark groups of 32 swatch rows each
- [x] Reopening a picker shows the **saved colour, not black** (the `parseColor` path)
- [x] Editing a colour re-skins **both** the public site and the admin panel
- [x] Saving twice without edits leaves the stored string **identical**
- [x] Switching Active Theme to "Violet Bloom" re-skins both; `--radius: 1.4rem` rounds cards
- [x] Setting Admin Theme makes the two diverge; clearing it re-couples them
- [x] Dark mode works on both, admin override still winning
- [x] Invalid input rejected with `Enter a colour, e.g. oklch(65.73% 0.17941 40.85).`
- [x] `.changeset/<name>.md` — minor for `@vexcms/core` and `@vexcms/react`, noting the token removal as a host-app-visible change
