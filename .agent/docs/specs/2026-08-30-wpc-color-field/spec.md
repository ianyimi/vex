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

# 2026-08-30-wpc-color-field — Spec

## Overview

Parent: `2026-08-30-launch-readiness` **WP-C**. Adds the 12th field type,
`color()`, and the theme system it exists to serve.

WP-C gates WP-2: the marketing template being ported has **57** `color()` call
sites, so templates must be authored against the final field set or they get
rewritten twice. This spec builds that field, then proves it by wiring
`apps/www`'s themes collection end to end — the same wiring WP-2's template
ships with, so it has to work here first.

### What "done" means

Today `apps/www` seeds a theme document that **no code reads** — verified:
outside `collections/themes.ts` and the generated `vex.types.ts`, nothing in the
app references the themes collection. The finish line is Step 7's manual script:
edit a theme colour in the admin, save, reload, watch **both the site and the
admin panel** change; then switch `siteSettings.activeTheme` and watch it change
again.

### Amendment to parent decision D8

D8 pinned "rebuild's simplified 7-field `themes.ts` shape rather than master's
57-colour one". **This spec supersedes that**: `themes.ts` becomes the full
shadcn 32-token set × light/dark, expressed with `group` (`tabs` stays cut).

The reason is not preference. Master's `apps/www` root layout rendered
`<ThemeStyle />`, so a theme re-skinned the admin panel too — which only works
because master's theme owned every token, so foreground and background moved
together. A 4-field theme cannot be applied globally: `--background` moves,
`--foreground` does not, and light-mode text stops being legible. The token set
*is* the feature.

### Package split

The dividing line, which future field work should follow:

> **`@vexcms/core` owns value transforms** — anything derivable from a field
> definition plus a stored value. **A framework package owns environment reads
> and widget wiring** — anything needing a live document or a component tree.

| Concern | Package | Why |
| --- | --- | --- |
| `formats.ts` — the notation contract | core | The `ColorFormat` union and its patterns are part of the field's public API |
| `convert.ts` — parse/serialise, sRGB↔OKLCh↔HSL | core | Pure arithmetic on a value. No DOM, no React, no dependencies |
| `themeTokens.ts` — CSSOM token discovery | react | Reads the live `document`. Its output is a list of *picker options*, not a field value |
| `Input` / `Cell` / `columnDef` | react | Components |
| `ThemeStyle` / `theme.getActive` / the seed | `apps/www` | Application wiring. It moves into the WP-2 template, not into a package |

Two consequences that make the split cheap:

1. **The pivot type is `ColorValue` (sRGB + alpha), not HSVA.** HSVA is the
   *picker's* model — `@uiw/react-color-sketch` happens to use it — while sRGB is
   what every CSS notation converts through. Pivoting on sRGB lets core own the
   whole conversion layer with zero dependencies.
2. **This spec adds no dependency at all.** The bridge is two calls:
   `ColorResult.rgba` is already `{ r, g, b, a }` and goes straight into
   `serializeColor`; reading back normalises through
   `serializeColor({ …, format: "hex" })` because `Sketch`'s `color` prop parses
   hex and nothing else. `@uiw/react-color-sketch@2.9.6` is already a dependency
   of `@vexcms/react` and imported nowhere — the field was started and abandoned.

`themeTokens.ts` **could** live in core (core extends
`@vexcms/tsconfig/react-library.json`, so `lib` already includes `DOM`, and it
guards on `typeof document === "undefined"`). It stays in react deliberately:
core's other exports run inside Convex functions, and its pure half is ~30 lines
that only mean anything while walking a CSSOM.

### Prototype evidence

Every code block below was written to disk, compiled and run before this spec
was presented, then reverted (AP-009, AP-012 — an unexecuted acceptance
criterion is a guess). Measured with **all eight groups applied at once**:

| Claim | Result |
| --- | --- |
| Whole monorepo builds, including a full Next production build of `apps/www` | `pnpm build` **10/10** — this compiles the moved routes, both layouts, `ThemeStyle`, the 64-field themes collection and the reduced token set |
| Typecheck | `pnpm typecheck` **14/14** |
| Tests | **974** (933 baseline + 30 core + 11 React) |
| Step 1's `never` guard actually fires | `TS2322: Type 'ColorField<…>' is not assignable to type 'never'` at both core dispatches |
| Adding `ColorField` to `AdminField` breaks exactly the three React registries | `adapter.ts(70,3) TS2741`, `fields/index.tsx(47,14) TS2741`, `fields/index.tsx(152,14) TS2741` |
| OKLCh conversion is correct | `#E8622A → oklch(65.73% 0.17941 40.85)`; painting that to a canvas in Chromium reads back `#e8622a`. Four cases, byte-exact |
| Every notation round-trips exactly | 4096-colour lattice through serialise → parse → 8-bit compare: **0 drift** |
| 13 of the 16 non-shadcn tokens are dead | Zero component references. The other three have 14 call sites total |
| Token consolidation is safe | 48 declaration lines removed from `globals.css`, 14 call sites migrated, zero residual references, build still 10/10 |
| `themeTokens.ts` works under jsdom | **7** assertions green — but only with `style[i]`; `style.item(i)` throws |
| A self-referential token really does break a site | In Chromium, `:root{--primary:var(--primary)}` computes `--primary` to `""` and `color: var(--primary)` paints `rgb(0, 0, 0)` |

Findings the prototype produced that review would not have:

1. **OKLCh precision had to be measured.** shadcn's hand-authored style
   (`oklch(60.5% 0.175 42)`) drifts on **869 of 4096** colours. The cliff:
   L1C3H1 → 869, L1C4H1 → 251, L2C4H2 → 5, **L2C5H2 → 0**.
2. **`@uiw/color-convert`'s `hsvaToHslString` is lossy** — rounds S and L to whole
   percents while printing a raw float hue. `#E8622A` came back `#E9632B`.
3. **`@uiw/color-convert`'s `color()` parser handles hex only.** `rgb()`,
   `hsl()` and `oklch()` return `{ hex: undefined }` *silently*.
4. **`vex generate` ignores `--cwd`** and reads `process.cwd()`. It must be run
   from inside `apps/www`.
5. **`convex/schema.ts` is hand-maintained** and the CLI only *adds* imports.
   Dropping a collection breaks the build until two lines are deleted by hand.
6. **`admin.defaultColumns` does not exist** on `defineCollection` in rebuild.
7. **`apps/www/convex/themes.ts` is dead code** — despite the name it queries
   *pages*, and nothing imports it.

## Design Decisions

1. **Exhaustiveness first, field second.** Three switches on field type end in
   `default: throw new Error(...)`, which absorbs a missing case into a runtime
   failure. Replacing them with `never` assertions converts the riskiest step
   into a compile error.
2. **A dummy `ADMIN_FIELDS` entry is not a sufficient negative test.** The core
   dispatches switch on the `AdminField` union, assembled from the per-field
   interfaces — not from `keyof typeof ADMIN_FIELDS`. The negative test must add
   a dummy union member too.
3. **A permanent runtime parity test beside the compile-time guard**, covering
   `fieldInputComponents`, `fieldCellComponents` and `reactAdapter.fields`.
4. **No type assertion in the exhaustiveness error.** The parent's snippet used
   `(props.field as { type: string }).type`, which AP-002 forbids. The type
   string is read into a `const` before the switch.
5. **`format: "hex" | "rgb" | "hsl" | "oklch"`, default `"hex"`.** The notation is
   the front end's choice. Storing `oklch` is what removes `colorConvert.ts` and
   the `culori` dependency from every site WP-2 generates.
6. **Validation accepts every notation; `format` governs only what the picker
   writes.** Narrowing to `field.format` would invalidate existing documents the
   moment an author switched notation. Storage is `v.string()` either way, so a
   format change never triggers a Convex migration.
7. **Conversion lives in core, pivoting on sRGB, with zero dependencies.**
   Ottosson's matrices verified byte-exact against Chromium.
8. **Round-trip exactness is a tested property.** `convert.test.ts` sweeps a
   4096-colour lattice; the precision constants are that sweep's output.
9. **Stored alpha is supported**, emitted only when the colour is translucent.
10. **The design-token set collapses from 48 to the shadcn 32.** Measured: 13 of
    the 16 extras have **zero** component references; the other three have 14
    call sites with exact shadcn equivalents. Matching shadcn means tweakcn
    presets map with no gaps, and a theme can own every token the app renders.
11. **`themes.ts` carries all 32 tokens × light/dark**, via `group` since `tabs`
    is cut. Defaults are the Stark × Ember values already in `globals.css`, so a
    new theme starts from the house palette.
12. **The theme applies to the whole document, admin included** — `<ThemeStyle />`
    in the root layout, which is what master's `apps/www` did. Coherent now that
    the theme owns every token.
13. **The admin can opt out via `siteSettings.adminTheme`.** The admin layout
    emits `:root:root` — specificity (0,2,0) against `:root`'s (0,1,0) — so it
    wins without depending on style-injection order. Empty by default, and
    `api.theme.getAdmin` falls back to the site theme.
14. **`siteSettings` becomes a global, not a collection.** It is a singleton (the
    seed already enforces that with `insertIfEmpty`), `nav` is already a global,
    and it puts the theme references where one `getGlobal` call reaches them.
15. **`app/(frontend)/layout.tsx` is restored.** Master had it. It makes the
    `@auth` parallel slot land in the group that declares it instead of leaking
    to the root layout, which is shared with `/admin`.
16. **`getActive` and `getAdmin` bypass access control.** A site's palette is
    public; an anonymous visitor must get the same colours as an editor.
17. **A theme pick in the picker's Theme tab stores `var(--token)`.** Master
    stored the frozen light-mode value, so it did not follow dark mode.
18. **Token discovery reads declared CSSOM values, not `getComputedStyle`** —
    that yields both palettes regardless of the panel's current mode.
19. **No `CSS.supports` in the colour-value check.** jsdom does not implement it,
    so a token is recognised by notation regex. Named colours are excluded on
    purpose: `--radius: 0.25rem` must not be mistaken for one.
20. **`themes.ts` keeps `themeColors` off on its own fields.** They *produce* the
    tokens; `--primary: var(--primary)` is a cycle Chromium resolves to the
    empty string (measured).

## Out of Scope

- `ui`, `tabs`, `richtext`, `json` fields — cut by the parent's **D8**, which
  otherwise stands. `tabs` is why `themes.ts` uses `group` for light/dark.
- Named CSS colours and `color()`/`lab()`/`lch()` notation. Four notations cover
  the picker's output and every token in `globals.css`.
- Moving `themeTokens.ts` into core. Possible, deliberately not done.
- Rewriting stored values when `format` changes.
- Live preview of theme edits. Versioning/drafts is unbuilt, so Step 7's script
  reloads after each save — stated up front so it is not read as a bug.
- Re-adding any of the 13 deleted tokens. If a component later needs a hover
  tint, it uses `/90` opacity like the rest of shadcn.
- `apps/www` → `apps/test` rename. That is WP-3.
- Per-instance custom admin field components (`admin.components.Field`).

## Implementation

### Step 0 — Collapse the design tokens from 48 to shadcn's 32 [agent]

First, because `themes.ts`'s field list and `ThemeStyle`'s token map are both
derived from this set. Measured usage of the 16 non-shadcn tokens:

| Extra token | Component uses | Replacement |
| --- | ---: | --- |
| `--muted-foreground-subtle` | 10 | `text-muted-foreground` — every use is placeholder or empty-state text |
| `--primary-hover` | 3 | `hover:text-primary/90` — shadcn expresses hover as an opacity modifier |
| `--warning` | 1 | `text-destructive` — an at-limit upload counter, i.e. an error state |
| `--primary-pressed`, `--accent-glow`, `--accent-line`, `--hover`, `--muted-foreground-faint`, `--border-strong`, `--border-soft`, `--success`, `--success-foreground`, `--success-bg`, `--warning-foreground`, `--warning-bg`, `--destructive-bg` | **0** | Delete — declared, consumed by nothing |

- [x] `apps/www/src/app/globals.css` — delete all 16 from `:root`, `.dark` and `@theme inline`
- [x] 14 call sites across `packages/react` and `apps/www`
- [x] `pnpm build && pnpm typecheck`

#### apps/www/src/app/globals.css

Delete every declaration of the 16 tokens — three places each: the `:root`
block, the `.dark` block, and the `--color-*` alias in `@theme inline`.
**48 lines removed**, file 315 → 267. Nothing else changes; the 32 shadcn tokens
are already all present with light and dark values.

#### packages/react and apps/www call sites

Fourteen edits, all mechanical:

```bash
# 10 sites — placeholder and empty-state text
sed -i '' 's/text-muted-foreground-subtle/text-muted-foreground/g' \
  packages/react/src/components/ui/{select,textarea,input}.tsx \
  packages/react/src/components/fields/relationship/{Cell,Input}.tsx \
  apps/www/src/components/ui/input.tsx

# 3 sites — hover tint becomes an opacity modifier
sed -i '' 's|hover:text-primary-hover|hover:text-primary/90|g' \
  packages/react/src/components/{AdminLayout,AdminTopNav}.tsx

# 1 site — at-limit upload counter is an error state
sed -i '' 's/"text-warning"/"text-destructive"/' \
  packages/react/src/components/fields/upload/FilledInput.tsx
```

Verify: `pnpm build` 10/10 and `pnpm typecheck` 14/14 (measured). Then confirm
nothing survives:

```bash
grep -rE "(bg|text|border|ring|shadow|placeholder)-(primary-hover|primary-pressed|accent-glow|accent-line|muted-foreground-subtle|muted-foreground-faint|border-strong|border-soft|success|warning|destructive-bg)([^a-z-]|$)" \
  packages apps --include=*.tsx --include=*.ts
# → no output
```

### Step 1 — Make field-type dispatch exhaustive [agent]

- [x] `packages/core/src/fields/validators/index.ts` — replace the default arm
- [x] `packages/core/src/fields/inputSchemas/index.ts` — replace the default arm
- [x] `packages/react/src/components/fields/index.tsx` — same on `getCollectionColumnDefs`
- [x] `packages/react/src/components/fields/index.test.tsx` — registry-parity test
- [x] Negative test (below) — the only proof the guard rail works

#### packages/core/src/fields/validators/index.ts

Three edits; everything not shown is unchanged.

**1 — import the discriminant type.**

```ts
import { ADMIN_FIELDS, type AdminFieldType } from "../constants";
```

**2 — read the discriminant before narrowing.** Immediately above the
`switch (props.field.type)` inside `adminFieldToValidator`:

```ts
  // Captured before the switch narrows `props.field`: inside the default arm the
  // union is exhausted to `never`, and `never.type` is not a usable string.
  const fieldType: AdminFieldType = props.field.type;

```

**3 — replace the default arm.**

```ts
    default: {
      const unhandled: never = props.field;
      throw new Error(
        `unrecognized field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
      );
    }
```

Update the `@throws` line too:

```ts
 * @throws An Error if an unrecognized field type is given. Reaching this is a
 * compile error: the default arm binds the exhausted union to `never`, so a new
 * member of `AdminField` fails typecheck here until a case is added.
```

#### packages/core/src/fields/inputSchemas/index.ts

The same three edits on `adminFieldToInputSchema`. Bodies are identical.

#### packages/react/src/components/fields/index.tsx

Two edits inside `getCollectionColumnDefs`. `AdminFieldType` is already imported.

```ts
    const fieldType: AdminFieldType = fieldDef.type;
```

```ts
      default: {
        const unhandled: never = fieldDef;
        throw new Error(
          `unsupported column def field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
        );
      }
```

#### packages/react/src/components/fields/index.test.tsx

New file. `packages/react/vitest.config.ts` already sets `environment: "jsdom"`
and includes `src/**/*.test.tsx`.

```tsx
import { describe, it, expect } from "vitest";
import { ADMIN_FIELDS } from "@vexcms/core";

import { fieldInputComponents, fieldCellComponents } from "./index";
import { reactAdapter } from "../../adapter";

/**
 * Registry parity.
 *
 * The `Record<AdminFieldType, …>` annotations on the two component maps make a
 * missing key a compile error today, but nothing enforces that at runtime, and
 * `reactAdapter.fields` is guarded only by a code comment saying the two "must
 * be kept in sync". These assertions fail loudly the moment a field type is
 * registered in core without a React component.
 */
describe("react field registries", () => {
  const fieldTypes = Object.keys(ADMIN_FIELDS).sort();

  it("registers an input component for every core field type", () => {
    expect(Object.keys(fieldInputComponents).sort()).toEqual(fieldTypes);
  });

  it("registers a cell component for every core field type", () => {
    expect(Object.keys(fieldCellComponents).sort()).toEqual(fieldTypes);
  });

  it("registers an adapter entry for every core field type", () => {
    expect(Object.keys(reactAdapter.fields).sort()).toEqual(fieldTypes);
  });

  it("gives every adapter entry both an input and a cell", () => {
    for (const [fieldType, slot] of Object.entries(reactAdapter.fields)) {
      expect(slot.input, `${fieldType}.input`).toBeTypeOf("function");
      expect(slot.cell, `${fieldType}.cell`).toBeTypeOf("function");
    }
  });
});
```

**Negative test — run it, do not skip it** (AP-013). Apply both halves of a dummy
field type, run `pnpm typecheck`, then revert both.

1. `packages/core/src/fields/constants.ts`, in `ADMIN_FIELDS`:
   `dummy: { type: "dummy", interfaceType: "string", validator: "v.string()", defaultValue: "" },`
2. `packages/core/src/fields/types.ts`, in the `AdminField` union:
   `| { readonly type: "dummy"; defaultValue?: string }`. Without this the core
   dispatches stay exhaustive and pass — the whole point of decision 2.

`pnpm typecheck` must fail at **six** sites: both core dispatches (`TS2322` on
`const unhandled: never`), `fieldInputComponents`, `fieldCellComponents` and
`reactAdapter.fields` (`TS2741` missing `dummy`), and `getCollectionColumnDefs`
(`TS2322`). `pnpm test` must fail all four parity assertions. Revert both.

Verify: `pnpm typecheck && pnpm test` green, and the negative test named all six
sites before being reverted.

### Step 2 — Core `color` field [agent]

Everything here is pure: no DOM, no React, no new dependencies — and it is the
whole colour-maths surface, so Step 3 adds no conversion code.

- [x] `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS.color`, `ColorFieldType`
- [x] `packages/core/src/fields/color/formats.ts`
- [x] `packages/core/src/fields/color/convert.ts` + `convert.test.ts`
- [x] `packages/core/src/fields/color/types.ts`
- [x] `packages/core/src/fields/color/config.ts` + `config.test.ts`
- [x] `packages/core/src/fields/color/validator.ts` + `validator.test.ts`
- [x] `packages/core/src/fields/color/inputSchema.ts` + `inputSchema.test.ts`
- [x] `packages/core/src/fields/color/index.ts`
- [x] `packages/core/src/fields/{types,index}.ts` + both dispatches
- [x] `pnpm --filter @vexcms/core test`

#### packages/core/src/fields/constants.ts

Two edits. After the `url` entry in `ADMIN_FIELDS`:

```ts
  color: {
    type: "color",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
  },
```

Beside `UrlFieldType`:

```ts
/** Literal type `"color"` — the discriminant value on {@link ColorField}. */
export type ColorFieldType = typeof ADMIN_FIELDS.color.type;
```

#### packages/core/src/fields/color/formats.ts

New file, and the reason `format` costs so little: one `as const` map carries
both the literal union (P-003) and the pattern that recognises each notation, so
`inputSchema` and `convert` cannot disagree about what `"oklch"` means.

```ts
/**
 * Supported storage notations for a `color()` field, keyed by format name.
 *
 * Each entry carries the anchored pattern that recognises values written in
 * that notation. The patterns accept exactly what `serializeColor` in
 * `@vexcms/react` emits, plus the equivalent hand-typed spellings.
 *
 * @internal
 */
export const COLOR_FORMATS = {
  hex: {
    format: "hex",
    /** `#E8622A`, `#E8622A80`. Shorthand is rejected — the picker never emits it. */
    pattern: /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/,
  },
  rgb: {
    format: "rgb",
    /** `rgb(232, 98, 42)`, `rgba(232, 98, 42, 0.5)`. */
    pattern:
      /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/,
  },
  hsl: {
    format: "hsl",
    /** `hsl(17.7, 81%, 54%)`, `hsla(17.7, 81%, 54%, 0.5)`. */
    pattern:
      /^hsla?\(\s*-?\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/,
  },
  oklch: {
    format: "oklch",
    /** `oklch(65.7% 0.179 40.9)`, `oklch(65.7% 0.179 40.9 / 0.5)`. */
    pattern:
      /^oklch\(\s*\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*(?:\/\s*(?:0|1|0?\.\d+)\s*)?\)$/,
  },
} as const;

/** Union of the notations a `color()` field can store: `"hex" | "rgb" | "hsl" | "oklch"`. */
export type ColorFormat = (typeof COLOR_FORMATS)[keyof typeof COLOR_FORMATS]["format"];

/** Every supported notation's pattern, in declaration order. */
export const COLOR_FORMAT_PATTERNS = Object.values(COLOR_FORMATS).map((f) => f.pattern);

/** A value that is entirely one CSS custom-property reference: `var(--primary)`. */
export const CSS_VAR_REFERENCE = /^var\(--[A-Za-z0-9_-]+\)$/;
```

#### packages/core/src/fields/color/convert.ts

New file. The whole conversion layer, dependency-free. `PRECISION` is the output
of the sweep in `convert.test.ts`, not a preference.

```ts
import { COLOR_FORMATS, type ColorFormat } from "./formats";

/**
 * A colour in 8-bit sRGB with straight (non-premultiplied) alpha.
 *
 * This is the pivot representation for every notation: parsing produces one,
 * serialising consumes one. sRGB rather than HSV because HSV is a *picker's*
 * working model — `@uiw/react-color-sketch` happens to use it — while sRGB is
 * what every CSS notation converts to and from.
 *
 * @example
 * ```ts
 * const ember: ColorValue = { r: 232, g: 98, b: 42, a: 1 };
 * ```
 */
export interface ColorValue {
  /** Red channel, `0`–`255`. */
  r: number;
  /** Green channel, `0`–`255`. */
  g: number;
  /** Blue channel, `0`–`255`. */
  b: number;
  /** Alpha, `0`–`1`. `1` is fully opaque. */
  a: number;
}

/** A colour in the OKLCh polar form: lightness 0–1, chroma, hue in degrees. */
interface OklchColor {
  l: number;
  c: number;
  h: number;
}

/** A colour in the HSL cylindrical form: hue in degrees, saturation and lightness 0–100. */
interface HslColor {
  h: number;
  s: number;
  l: number;
}

/**
 * Decimal places used when serialising each notation.
 *
 * Chosen by measurement, not taste. `convert.test.ts` sweeps a 4096-colour
 * lattice through serialise → parse and requires an exact 8-bit match; these are
 * the coarsest values that reach zero drift. The measured cliff for OKLCh:
 *
 * | precision | colours that drift |
 * | --- | --- |
 * | L1 C3 H1 (shadcn's hand-authored style) | 869 |
 * | L1 C4 H1 | 251 |
 * | L2 C4 H2 | 5 |
 * | **L2 C5 H2** | **0** |
 *
 * Trailing zeros are dropped when serialising, so a grey still reads
 * `oklch(14.51% 0 0)` rather than `oklch(14.51% 0.00000 0.0)` — the extra
 * digits appear only on colours that need them.
 *
 * For comparison, `@uiw/color-convert`'s `hsvaToHslString` rounds saturation
 * and lightness to whole percents, which turns `#E8622A` into `#E9632B` in one
 * round trip.
 */
const PRECISION = {
  hslHue: 1,
  hslPercent: 1,
  oklchLightness: 2,
  oklchChroma: 5,
  oklchHue: 2,
  alpha: 3,
} as const;

/** `#RRGGBB` or `#RRGGBBAA`, captured in two-digit groups. */
const HEX_STRING = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})?$/;

/** `rgb(232, 98, 42)` / `rgba(232, 98, 42, 0.5)`. */
const RGB_STRING =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)$/;

/** `hsl(17.7, 80.5%, 53.7%)` / `hsla(17.7, 80.5%, 53.7%, 0.5)`. */
const HSL_STRING =
  /^hsla?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)$/;

/** `oklch(65.7% 0.1793 40.9)` / `oklch(0.657 0.1793 40.9 / 0.5)`. */
const OKLCH_STRING =
  /^oklch\(\s*(\d+(?:\.\d+)?)(%?)\s+(\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*(?:\/\s*(\d*(?:\.\d+)?)\s*)?\)$/;

/**
 * Clamps a value into a closed range.
 *
 * @param props - Input props.
 * @param props.value - The value to clamp.
 * @param props.min - Lower bound, inclusive.
 * @param props.max - Upper bound, inclusive.
 * @returns The value, bounded.
 */
function clamp(props: { value: number; min: number; max: number }): number {
  return Math.min(props.max, Math.max(props.min, props.value));
}

/**
 * Rounds to a fixed number of decimals, dropping trailing zeros.
 *
 * Used for alpha so `0.5` serialises as `0.5` rather than `0.500`.
 *
 * @param props - Input props.
 * @param props.value - The value to round.
 * @param props.decimals - Maximum decimal places to keep.
 * @returns The rounded value.
 */
function round(props: { value: number; decimals: number }): number {
  return Number(props.value.toFixed(props.decimals));
}

/**
 * Converts a gamma-encoded sRGB channel to its linear-light value.
 *
 * @param props - Input props.
 * @param props.channel - Channel in the 0–1 range.
 * @returns The linear-light channel value.
 */
function srgbToLinear(props: { channel: number }): number {
  const c = props.channel;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converts a linear-light channel back to gamma-encoded sRGB.
 *
 * @param props - Input props.
 * @param props.channel - Linear-light channel in the 0–1 range.
 * @returns The gamma-encoded channel value.
 */
function linearToSrgb(props: { channel: number }): number {
  const c = props.channel;
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * Converts sRGB to OKLCh.
 *
 * Uses Björn Ottosson's sRGB→OKLab matrices — the same transform browsers
 * implement for the `oklch()` notation, verified against Chromium's own output
 * to the byte. Hand-rolled rather than pulled from a colour library: it is
 * twenty lines of closed-form arithmetic, and the alternative (`culori`) would
 * become a runtime dependency of `@vexcms/core`.
 *
 * @param props - Input props.
 * @param props.color - The sRGB colour. Alpha is ignored.
 * @returns The equivalent OKLCh colour. Hue is `0` for achromatic input.
 */
function rgbToOklch(props: { color: ColorValue }): OklchColor {
  const lr = srgbToLinear({ channel: props.color.r / 255 });
  const lg = srgbToLinear({ channel: props.color.g / 255 });
  const lb = srgbToLinear({ channel: props.color.b / 255 });

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(a * a + b * b);
  // Below this chroma the hue angle is numerical noise — pin it to 0 so grey
  // serialises as `oklch(14.5% 0 0)` rather than an arbitrary angle.
  const hue = chroma < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;

  return { l: lightness, c: chroma, h: hue };
}

/**
 * Converts OKLCh to sRGB, clamping to the sRGB gamut.
 *
 * OKLCh describes colours sRGB cannot show; those clamp per channel rather than
 * failing, which matches what a browser paints for an out-of-gamut `oklch()`.
 *
 * @param props - Input props.
 * @param props.oklch - The OKLCh colour.
 * @param props.alpha - Alpha to carry onto the result, `0`–`1`.
 * @returns The equivalent sRGB colour.
 */
function oklchToRgb(props: { oklch: OklchColor; alpha: number }): ColorValue {
  const radians = (props.oklch.h * Math.PI) / 180;
  const a = props.oklch.c * Math.cos(radians);
  const b = props.oklch.c * Math.sin(radians);

  const lCube = (props.oklch.l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCube = (props.oklch.l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCube = (props.oklch.l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const toChannel = (linear: number) =>
    clamp({ value: Math.round(linearToSrgb({ channel: linear }) * 255), min: 0, max: 255 });

  return {
    r: toChannel(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube),
    g: toChannel(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube),
    b: toChannel(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube),
    a: props.alpha,
  };
}

/**
 * Converts sRGB to HSL.
 *
 * @param props - Input props.
 * @param props.color - The sRGB colour. Alpha is ignored.
 * @returns Hue in degrees, saturation and lightness as percentages.
 */
function rgbToHsl(props: { color: ColorValue }): HslColor {
  const r = props.color.r / 255;
  const g = props.color.g / 255;
  const b = props.color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: lightness * 100 };

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  return { h: ((hue * 60) % 360 + 360) % 360, s: saturation * 100, l: lightness * 100 };
}

/**
 * Converts HSL to sRGB.
 *
 * @param props - Input props.
 * @param props.hsl - Hue in degrees, saturation and lightness as percentages.
 * @param props.alpha - Alpha to carry onto the result, `0`–`1`.
 * @returns The equivalent sRGB colour.
 */
function hslToRgb(props: { hsl: HslColor; alpha: number }): ColorValue {
  const h = ((props.hsl.h % 360) + 360) % 360 / 360;
  const s = clamp({ value: props.hsl.s / 100, min: 0, max: 1 });
  const l = clamp({ value: props.hsl.l / 100, min: 0, max: 1 });

  if (s === 0) {
    const grey = Math.round(l * 255);
    return { r: grey, g: grey, b: grey, a: props.alpha };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toChannel = (offset: number) => {
    let t = h + offset;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return {
    r: Math.round(toChannel(1 / 3) * 255),
    g: Math.round(toChannel(0) * 255),
    b: Math.round(toChannel(-1 / 3) * 255),
    a: props.alpha,
  };
}

/**
 * Serialises a colour into one of the supported CSS notations.
 *
 * Alpha is emitted only when the colour is not fully opaque, so an opaque
 * colour produces `#e8622a` rather than `#e8622aff` and `rgb(...)` rather than
 * `rgba(..., 1)`.
 *
 * @param props - Input props.
 * @param props.color - The colour to write.
 * @param props.format - The notation to write it in.
 * @returns A CSS colour string in `format`.
 * @throws An Error if an unrecognised format is given. Reaching this is a
 * compile error: the default arm binds the exhausted union to `never`.
 *
 * @example
 * ```ts
 * const ember = { r: 232, g: 98, b: 42, a: 1 };
 * serializeColor({ color: ember, format: "hex" })   // "#e8622a"
 * serializeColor({ color: ember, format: "oklch" }) // "oklch(65.7% 0.1793 40.9)"
 * ```
 */
export function serializeColor(props: { color: ColorValue; format: ColorFormat }): string {
  const { color } = props;
  const isOpaque = color.a >= 1;
  const alpha = round({ value: color.a, decimals: PRECISION.alpha });

  switch (props.format) {
    case COLOR_FORMATS.hex.format: {
      const pair = (channel: number) =>
        clamp({ value: Math.round(channel), min: 0, max: 255 })
          .toString(16)
          .padStart(2, "0");
      const rgb = `#${pair(color.r)}${pair(color.g)}${pair(color.b)}`;
      return isOpaque ? rgb : `${rgb}${pair(color.a * 255)}`;
    }
    case COLOR_FORMATS.rgb.format: {
      const channels = `${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}`;
      return isOpaque ? `rgb(${channels})` : `rgba(${channels}, ${alpha})`;
    }
    case COLOR_FORMATS.hsl.format: {
      const hsl = rgbToHsl({ color });
      const h = round({ value: hsl.h, decimals: PRECISION.hslHue });
      const s = round({ value: hsl.s, decimals: PRECISION.hslPercent });
      const l = round({ value: hsl.l, decimals: PRECISION.hslPercent });
      return isOpaque ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    }
    case COLOR_FORMATS.oklch.format: {
      const oklch = rgbToOklch({ color });
      const l = round({ value: oklch.l * 100, decimals: PRECISION.oklchLightness });
      const c = round({ value: oklch.c, decimals: PRECISION.oklchChroma });
      const h = round({ value: oklch.h, decimals: PRECISION.oklchHue });
      return `oklch(${l}% ${c} ${h}${isOpaque ? "" : ` / ${alpha}`})`;
    }
    default: {
      const unhandled: never = props.format;
      throw new Error(`unsupported colour format: ${JSON.stringify(unhandled)}`);
    }
  }
}

/**
 * Parses a stored colour value into a {@link ColorValue}.
 *
 * Accepts every notation {@link serializeColor} can emit, regardless of the
 * field's current `format` — so a field whose format changed still reads its
 * stored colour instead of resetting. Values with no literal colour
 * (`var(--token)`, the empty string) return `null`.
 *
 * @param props - Input props.
 * @param props.value - The stored field value.
 * @returns The parsed colour, or `null` when the value is empty, a theme-token
 * reference, or not a recognised notation.
 *
 * @example
 * ```ts
 * parseColor({ value: "oklch(65.7% 0.1793 40.9)" }) // { r: 232, g: 98, b: 42, a: 1 }
 * parseColor({ value: "var(--primary)" })           // null
 * ```
 */
export function parseColor(props: { value: string }): ColorValue | null {
  const value = props.value.trim();
  if (!value) return null;

  const hex = HEX_STRING.exec(value);
  if (hex) {
    return {
      r: parseInt(hex[1], 16),
      g: parseInt(hex[2], 16),
      b: parseInt(hex[3], 16),
      a: hex[4] === undefined ? 1 : parseInt(hex[4], 16) / 255,
    };
  }

  const rgb = RGB_STRING.exec(value);
  if (rgb) {
    const channels = [rgb[1], rgb[2], rgb[3]].map(Number);
    if (channels.some((channel) => channel > 255)) return null;
    return {
      r: channels[0],
      g: channels[1],
      b: channels[2],
      a: rgb[4] === undefined ? 1 : clamp({ value: Number(rgb[4]), min: 0, max: 1 }),
    };
  }

  const hsl = HSL_STRING.exec(value);
  if (hsl) {
    return hslToRgb({
      hsl: { h: Number(hsl[1]), s: Number(hsl[2]), l: Number(hsl[3]) },
      alpha: hsl[4] === undefined ? 1 : clamp({ value: Number(hsl[4]), min: 0, max: 1 }),
    });
  }

  const oklch = OKLCH_STRING.exec(value);
  if (oklch) {
    const lightness = Number(oklch[1]);
    return oklchToRgb({
      oklch: {
        l: oklch[2] ? lightness / 100 : lightness,
        c: Number(oklch[3]),
        h: Number(oklch[4]),
      },
      alpha: oklch[5] === undefined ? 1 : clamp({ value: Number(oklch[5]), min: 0, max: 1 }),
    });
  }

  return null;
}
```

#### packages/core/src/fields/color/convert.test.ts

New file. The lattice sweep is load-bearing — it turns "round-trips correctly"
from a claim into a property. Expected values are the measured ones.

```ts
import { describe, it, expect } from "vitest";
import { parseColor, serializeColor, type ColorValue } from "./convert";
import { COLOR_FORMATS, type ColorFormat } from "./formats";

/** Ember brand colour from apps/www/src/app/globals.css. */
const EMBER: ColorValue = { r: 232, g: 98, b: 42, a: 1 };

const FORMATS = Object.values(COLOR_FORMATS).map((entry) => entry.format);

describe("serializeColor", () => {
  it("writes each notation for an opaque colour", () => {
    expect(serializeColor({ color: EMBER, format: "hex" })).toBe("#e8622a");
    expect(serializeColor({ color: EMBER, format: "rgb" })).toBe("rgb(232, 98, 42)");
    expect(serializeColor({ color: EMBER, format: "hsl" })).toBe("hsl(17.7, 80.5%, 53.7%)");
    expect(serializeColor({ color: EMBER, format: "oklch" })).toBe("oklch(65.73% 0.17941 40.85)");
  });

  it("adds an alpha channel only when the colour is translucent", () => {
    const translucent: ColorValue = { ...EMBER, a: 0.5 };

    expect(serializeColor({ color: translucent, format: "hex" })).toBe("#e8622a80");
    expect(serializeColor({ color: translucent, format: "rgb" })).toBe("rgba(232, 98, 42, 0.5)");
    expect(serializeColor({ color: translucent, format: "hsl" })).toBe(
      "hsla(17.7, 80.5%, 53.7%, 0.5)",
    );
    expect(serializeColor({ color: translucent, format: "oklch" })).toBe(
      "oklch(65.73% 0.17941 40.85 / 0.5)",
    );
  });

  it("pins hue to zero for achromatic colours", () => {
    const black: ColorValue = { r: 10, g: 10, b: 10, a: 1 };

    expect(serializeColor({ color: black, format: "oklch" })).toBe("oklch(14.48% 0 0)");
    expect(serializeColor({ color: black, format: "hsl" })).toBe("hsl(0, 0%, 3.9%)");
  });
});

describe("parseColor", () => {
  it("reads each notation back to the same colour", () => {
    for (const format of FORMATS) {
      const value = serializeColor({ color: EMBER, format });

      expect(parseColor({ value }), format).toEqual(EMBER);
    }
  });

  it("round-trips every 8-bit colour on a deterministic sweep", () => {
    // 4096 colours on a 16-step lattice, covering every channel extreme and the
    // full hue circle. A precision regression in any notation shows up here
    // rather than in a hand-picked example that happens to survive.
    const drifted: string[] = [];
    for (let r = 0; r < 256; r += 17) {
      for (let g = 0; g < 256; g += 17) {
        for (let b = 0; b < 256; b += 17) {
          const color: ColorValue = { r, g, b, a: 1 };
          for (const format of FORMATS) {
            const parsed = parseColor({ value: serializeColor({ color, format }) });
            if (parsed?.r !== r || parsed?.g !== g || parsed?.b !== b) {
              drifted.push(`${format} ${serializeColor({ color, format })}`);
            }
          }
        }
      }
    }

    expect(drifted).toEqual([]);
  });

  it("reads a value written in a format the field no longer uses", () => {
    const parsed = parseColor({ value: "#E8622A" });

    expect(serializeColor({ color: parsed!, format: "oklch" })).toBe("oklch(65.73% 0.17941 40.85)");
  });

  it("accepts oklch lightness as a fraction as well as a percentage", () => {
    expect(parseColor({ value: "oklch(0.6573 0.17941 40.85)" })).toEqual(
      parseColor({ value: "oklch(65.73% 0.17941 40.85)" }),
    );
  });

  it("preserves alpha through a round trip", () => {
    for (const format of FORMATS) {
      const value = serializeColor({ color: { ...EMBER, a: 0.5 }, format });

      expect(parseColor({ value })?.a, format).toBeCloseTo(0.5, 2);
    }
  });

  it("clamps an out-of-gamut oklch to sRGB rather than failing", () => {
    const parsed = parseColor({ value: "oklch(70% 0.4 30)" });

    expect(parsed).not.toBeNull();
    for (const channel of [parsed!.r, parsed!.g, parsed!.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });

  it("returns null for theme tokens, empty values, and unrecognised notation", () => {
    expect(parseColor({ value: "var(--primary)" })).toBeNull();
    expect(parseColor({ value: "" })).toBeNull();
    expect(parseColor({ value: "   " })).toBeNull();
    expect(parseColor({ value: "rebeccapurple" })).toBeNull();
    expect(parseColor({ value: "#fff" })).toBeNull();
    expect(parseColor({ value: "rgb(999, 0, 0)" })).toBeNull();
  });

  it("throws on an unsupported format", () => {
    expect(() =>
      serializeColor({ color: EMBER, format: "cmyk" as ColorFormat }),
    ).toThrow(/unsupported colour format/);
  });
});
```

#### packages/core/src/fields/color/types.ts

New file.

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";
import type { ColorFormat } from "./formats";

/**
 * Configuration input for a `color()` field.
 *
 * Colour fields store a CSS colour string. `format` decides which notation the
 * picker writes — `"hex"` (default), `"rgb"`, `"hsl"` or `"oklch"`. With
 * `themeColors` the field may instead store a CSS custom-property reference,
 * `var(--primary)`, which resolves per colour scheme at render time.
 *
 * **Defaults applied by `color()`:**
 * ```ts
 * {
 *   type:        "color",
 *   label:       "",       // inferred from the field key by defineCollection
 *   required:    false,    // field is optional by default
 *   format:      "hex",    // picker writes #RRGGBB / #RRGGBBAA
 *   themeColors: false,    // picker shows the custom swatch only
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // swatch aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Brand Color"), stored as hex
 * brandColor: color()
 *
 * // Stored as oklch, ready to interpolate straight into a CSS custom property
 * primaryLight: color({ format: "oklch", required: true, defaultValue: "oklch(65.7% 0.179 40.9)" })
 *
 * // Half-width, and offer the host app's design tokens as a second tab
 * overlayTint: color({ themeColors: true, admin: { width: "half" } })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface ColorFieldInput<TFieldMeta extends {} = {}>
  extends BaseFieldInput<TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect existing database values.
   */
  defaultValue?: string;
  /**
   * The CSS notation the picker writes.
   *
   * Validation is deliberately wider than this: every supported notation is
   * accepted on save, so changing `format` never invalidates existing
   * documents. `format` governs new writes, not stored history.
   *
   * Pick the notation the front end consumes. A theme collection feeding CSS
   * custom properties should use `"oklch"` so values interpolate directly with
   * no conversion step.
   *
   * @defaultValue `"hex"`
   */
  format?: ColorFormat;
  /**
   * When `true`, the picker gains a **Theme** tab listing the CSS custom
   * properties declared by the host application's stylesheet, and selecting one
   * stores a `var(--token)` reference instead of a literal colour.
   *
   * The admin panel renders inside the host app, so those tokens are the site's
   * own tokens. Leave this `false` on the fields that *define* the tokens: a
   * field whose value is written back out as `--primary: var(--primary)` is a
   * custom-property cycle, which CSS discards at computed-value time.
   *
   * @defaultValue `false`
   */
  themeColors?: boolean;
}

/**
 * Resolved configuration for a `color()` field, after all defaults are applied.
 *
 * This is the type framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<ColorField>` and
 * `CellComponentProps<ColorField>` is this type.
 *
 * @see {@link ColorFieldInput} for the user-facing input type
 * @see {@link color} for the config function that produces this type
 */
export interface ColorField<TFieldMeta extends {} = {}>
  extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.color.type;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Defaults to `""` — an empty picker.
   */
  defaultValue?: string;
  /** The CSS notation the picker writes. */
  format: ColorFormat;
  /** Whether the picker offers the host app's design tokens as a second tab. */
  themeColors: boolean;
}
```

#### packages/core/src/fields/color/config.ts

New file. `format` and `themeColors` resolve **after** `...options` so the output
type is never `| undefined`.

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { COLOR_FORMATS } from "./formats";
import type { ColorFieldInput, ColorField } from "./types";

/**
 * Creates a colour field with all defaults applied.
 *
 * Colour fields store a CSS colour string and render a swatch picker in the
 * admin form. Common uses: theme palettes, per-document accent colours, block
 * background overrides.
 *
 * Accepts {@link ColorFieldInput} (all optional) and returns {@link ColorField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `""`
 * - `format` — `"hex"`
 * - `themeColors` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Colour field configuration. All properties are optional.
 * @returns Resolved colour field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { color, defineCollection } from '@vexcms/core'
 *
 * themes: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Brand Color"), stored as hex
 *     brandColor: color(),
 *
 *     // Stored as oklch so the front end can interpolate it directly
 *     primaryLight: color({ format: "oklch", required: true }),
 *
 *     // Offer the host app's design tokens as a second picker tab
 *     overlayTint: color({ themeColors: true, admin: { width: "half" } }),
 *   }
 * })
 * ```
 *
 * @see {@link ColorFieldInput} for the full input type
 * @see {@link ColorField} for the resolved output type
 */
export function color<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>(
  options?: ColorFieldInput<TFieldMeta>,
): ColorField<TFieldMeta> {
  return {
    type: ADMIN_FIELDS.color.type,
    interfaceType: ADMIN_FIELDS.color.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.color.defaultValue,
    ...options,

    // Resolved after `...options` so both are always defined.
    format: options?.format ?? COLOR_FORMATS.hex.format,
    themeColors: options?.themeColors ?? false,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/color/config.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { color } from "./config";

describe("color", () => {
  it("defaults format to hex and themeColors to false", () => {
    const field = color();

    expect(field.format).toBe("hex");
    expect(field.themeColors).toBe(false);
  });

  it("keeps an explicit format and themeColors", () => {
    const field = color({ format: "oklch", themeColors: true });

    expect(field.format).toBe("oklch");
    expect(field.themeColors).toBe(true);
  });

  it("resolves format even when options spread an explicit undefined", () => {
    const field = color({ format: undefined, themeColors: undefined });

    expect(field.format).toBe("hex");
    expect(field.themeColors).toBe(false);
  });
});
```

#### packages/core/src/fields/color/validator.ts

New file. Same shape as `url`'s — notation is a form concern, not a schema one,
which is what makes `format` free of migrations.

```ts
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import type { ColorField } from "./types";

/**
 * Converts a colour field definition to a Convex schema validator string.
 *
 * Colour fields are stored as plain strings in Convex — the notation (and the
 * `var(--token)` alternative allowed by `themeColors`) is enforced at the admin
 * form layer, not in the database schema. This function generates only the type
 * constraint, so changing `format` never triggers a schema migration.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns Convex validator string: `"v.string()"` for required fields,
 * `"v.optional(v.string())"` for optional fields.
 *
 * @example
 * ```ts
 * colorFieldToValidator({ field: color({ required: true }) })   // "v.string()"
 * colorFieldToValidator({ field: color({ required: false }) })  // "v.optional(v.string())"
 * ```
 *
 * @see {@link colorFieldToInputSchema} for the admin-form Zod schema that enforces the notation
 * @internal Used by schema generation, not typically called directly.
 */
export function colorFieldToValidator(props: { field: ColorField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.color.validator,
  });
}
```

#### packages/core/src/fields/color/validator.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { color } from "./config";
import { colorFieldToValidator } from "./validator";

describe("colorFieldToValidator", () => {
  it("generates a bare string validator for required fields", () => {
    expect(colorFieldToValidator({ field: color({ required: true }) })).toBe("v.string()");
  });

  it("wraps optional fields in v.optional()", () => {
    expect(colorFieldToValidator({ field: color({ required: false }) })).toBe(
      "v.optional(v.string())",
    );
  });

  it("stores the same Convex type for every format", () => {
    for (const format of ["hex", "rgb", "hsl", "oklch"] as const) {
      expect(colorFieldToValidator({ field: color({ required: true, format }) })).toBe(
        "v.string()",
      );
    }
  });

  it("stores the same Convex type whether or not themeColors is enabled", () => {
    expect(colorFieldToValidator({ field: color({ required: true, themeColors: true }) })).toBe(
      "v.string()",
    );
  });

  it("ignores defaultValue — defaults are a form concern, not a schema one", () => {
    expect(
      colorFieldToValidator({ field: color({ required: true, defaultValue: "#E8622A" }) }),
    ).toBe("v.string()");
  });
});
```

#### packages/core/src/fields/color/inputSchema.ts

New file. The only place the colour notation is enforced.

```ts
import { z, type ZodType } from "zod";
import { ColorField } from "./types";
import {
  COLOR_FORMAT_PATTERNS,
  CSS_VAR_REFERENCE,
  type ColorFormat,
} from "./formats";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/** One worked example per notation, used to make the form error actionable. */
const FORMAT_EXAMPLES: Record<ColorFormat, string> = {
  hex: "#E8622A",
  rgb: "rgb(232, 98, 42)",
  hsl: "hsl(17.7, 81%, 54%)",
  oklch: "oklch(65.7% 0.179 40.9)",
};

/**
 * Builds the accepted-value pattern for a colour field.
 *
 * Deliberately accepts **every** supported notation rather than only
 * `field.format`: `format` decides what the picker writes, and narrowing
 * validation to it would invalidate every existing document the moment a field
 * switched notation. Each notation's pattern is already anchored, so the
 * alternation stays anchored.
 *
 * @param props - Input props.
 * @param props.themeColors - Whether `var(--token)` references are also accepted.
 * @returns A regex matching any supported colour notation.
 */
function colorPattern(props: { themeColors: boolean }): RegExp {
  const sources = COLOR_FORMAT_PATTERNS.map((pattern) => pattern.source);
  if (props.themeColors) sources.push(CSS_VAR_REFERENCE.source);
  return new RegExp(sources.join("|"));
}

/**
 * Builds the form error shown when a value matches no accepted notation.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns A message leading with the field's own notation, since that is what
 * the picker produces and therefore what the author most likely wants.
 */
function colorMessage(props: { field: ColorField }): string {
  const example = FORMAT_EXAMPLES[props.field.format];
  const base = `Enter a colour, e.g. ${example}.`;
  if (!props.field.themeColors) return base;
  return `${base} A theme token such as var(--primary) is also accepted.`;
}

/**
 * Builds a Zod schema for validating a colour field value in the admin form.
 *
 * Accepts hex, `rgb()`, `hsl()` and `oklch()` notation — plus `var(--token)`
 * when the field enables `themeColors`. Required fields add a `.min(1)` check so
 * an empty field reports "required" rather than a notation complaint. Optional
 * fields accept the empty string, since `color()` defaults `defaultValue` to
 * `""` and a cleared picker must round-trip.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns A Zod string schema. Optional fields are wrapped in `.optional()` by
 * `applyBaseInputSchemaMeta` and carry `.default(field.defaultValue)`.
 *
 * @example
 * ```ts
 * // Required — rejects "", "#fff" and "var(--primary)"
 * colorFieldToInputSchema({ field: color({ required: true }) })
 *
 * // themeColors — additionally accepts "var(--primary)"
 * colorFieldToInputSchema({ field: color({ required: true, themeColors: true }) })
 * ```
 */
export function colorFieldToInputSchema(props: { field: ColorField }): ZodType {
  const { field } = props;
  const pattern = colorPattern({ themeColors: field.themeColors });
  const message = colorMessage({ field });

  let inputSchema: ZodType = z.string().regex(pattern, message);
  if (field.required) {
    inputSchema = z.string().min(1, "This field is required.").regex(pattern, message);
    if (field.defaultValue) {
      inputSchema = inputSchema.default(field.defaultValue);
    }
  } else if (field.defaultValue !== undefined) {
    inputSchema = z
      .union([z.string().regex(pattern, message), z.literal("")])
      .default(field.defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

#### packages/core/src/fields/color/inputSchema.test.ts

New file. Exact expected values — the test is the spec of the accepted notations,
including the "existing documents stay valid" guarantee.

```ts
import { describe, it, expect } from "vitest";
import { color } from "./config";
import { colorFieldToInputSchema } from "./inputSchema";

describe("colorFieldToInputSchema", () => {
  it("accepts every supported notation regardless of the field's format", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true }) });

    expect(schema.safeParse("#E8622A").success).toBe(true);
    expect(schema.safeParse("#e8622a").success).toBe(true);
    expect(schema.safeParse("#E8622A80").success).toBe(true);
    expect(schema.safeParse("rgb(232, 98, 42)").success).toBe(true);
    expect(schema.safeParse("rgba(232, 98, 42, 0.5)").success).toBe(true);
    expect(schema.safeParse("hsl(17.7, 81%, 54%)").success).toBe(true);
    expect(schema.safeParse("hsla(17.7, 81%, 54%, 0.5)").success).toBe(true);
    expect(schema.safeParse("oklch(65.7% 0.179 40.9)").success).toBe(true);
    expect(schema.safeParse("oklch(65.7% 0.179 40.9 / 0.5)").success).toBe(true);
  });

  it("still accepts hex after a field switches to oklch — existing documents stay valid", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true, format: "oklch" }) });

    expect(schema.safeParse("#E8622A").success).toBe(true);
    expect(schema.safeParse("oklch(65.7% 0.179 40.9)").success).toBe(true);
  });

  it("rejects shorthand hex, malformed notation, and non-strings", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true }) });

    expect(schema.safeParse("#fff").success).toBe(false);
    expect(schema.safeParse("E8622A").success).toBe(false);
    expect(schema.safeParse("#E8622AZZ").success).toBe(false);
    expect(schema.safeParse("rgb(232 98 42)").success).toBe(false);
    expect(schema.safeParse("oklch(65.7 0.179 40.9)").success).toBe(false);
    expect(schema.safeParse("red").success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("rejects theme tokens unless themeColors is enabled", () => {
    const off = colorFieldToInputSchema({ field: color({ required: true }) });
    const on = colorFieldToInputSchema({ field: color({ required: true, themeColors: true }) });

    expect(off.safeParse("var(--primary)").success).toBe(false);
    expect(on.safeParse("var(--primary)").success).toBe(true);
    expect(on.safeParse("var(--sidebar-primary-foreground)").success).toBe(true);
    expect(on.safeParse("#E8622A").success).toBe(true);
  });

  it("rejects var() fallback syntax even when themeColors is enabled", () => {
    const schema = colorFieldToInputSchema({
      field: color({ required: true, themeColors: true }),
    });

    expect(schema.safeParse("var(--primary, #fff)").success).toBe(false);
    expect(schema.safeParse("var(primary)").success).toBe(false);
  });

  it("names the field's own format in the error message", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true, format: "oklch" }) });
    const result = schema.safeParse("nope");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Enter a colour, e.g. oklch(65.7% 0.179 40.9).",
      );
    }
  });

  it("mentions theme tokens in the error message when they are accepted", () => {
    const schema = colorFieldToInputSchema({
      field: color({ required: true, themeColors: true }),
    });
    const result = schema.safeParse("nope");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Enter a colour, e.g. #E8622A. A theme token such as var(--primary) is also accepted.",
      );
    }
  });

  it("reports 'required' rather than a notation error on an empty required field", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true }) });
    const result = schema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("This field is required.");
    }
  });

  it("returns the empty-string default for an optional field given undefined", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: false }) });
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("accepts a cleared optional field", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: false }) });

    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("#E8622A").success).toBe(true);
    expect(schema.safeParse("nope").success).toBe(false);
  });

  it("applies an explicit default on a required field", () => {
    const schema = colorFieldToInputSchema({
      field: color({ required: true, defaultValue: "#E8622A" }),
    });
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("#E8622A");
    }
  });
});
```

#### packages/core/src/fields/color/index.ts

New file.

```ts
// Re-export the factory function
export * from "./config";
export * from "./convert";
export * from "./formats";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
```

#### packages/core/src/fields/types.ts

Beside `import { UrlField } from "./url";`:

```ts
import { ColorField } from "./color";
```

After `| UrlField<TFieldMeta>` in the `AdminField` union:

```ts
  | ColorField<TFieldMeta>
```

And in the union's doc comment:

```ts
 * - `ColorField` — CSS colour string, or a `var(--token)` reference when `themeColors` is on
```

#### packages/core/src/fields/index.ts

```ts
export * from "./color";
```

#### packages/core/src/fields/validators/index.ts

```ts
import { colorFieldToValidator } from "../color";
```

```ts
    case ADMIN_FIELDS.color.type:
      return colorFieldToValidator({ field: props.field });
```

Step 1's `never` assertion is what tells you this case is missing.

#### packages/core/src/fields/inputSchemas/index.ts

The same two edits with `colorFieldToInputSchema`.

Verify: `pnpm --filter @vexcms/core test` green with 30 new assertions (873
total). `pnpm typecheck` now fails **only** in `@vexcms/react` — the three
registries and the columnDef switch all report a missing `color`. That is Step
1's guard rail working; Step 3 closes it.

### Step 3 — React `color` field [agent]

No new dependency, no colour maths — every conversion call goes to core.

- [x] `packages/react/src/components/fields/color/themeTokens.ts` + `themeTokens.test.ts`
- [x] `packages/react/src/components/fields/color/{Cell.tsx,columnDef.tsx,Input.tsx,index.ts}`
- [x] `packages/react/src/components/fields/index.tsx` — barrel, both maps, columnDef case
- [x] `packages/react/src/adapter.ts` — `reactAdapter.fields.color`
- [x] `pnpm build && pnpm typecheck && pnpm test`

#### packages/react/src/components/fields/color/themeTokens.ts

New file. A pure DOM read with no React dependency — the one piece that stays in
`@vexcms/react` rather than moving to core.

```ts
/**
 * A CSS custom property declared by the host application's stylesheet that
 * holds a colour value.
 */
export interface ThemeColorToken {
  /** The custom-property name, including the leading dashes: `"--primary"`. */
  name: string;
  /** The value stored when this token is selected: `"var(--primary)"`. */
  reference: string;
  /** The value declared for the light colour scheme. */
  lightValue: string;
  /** The value declared under `.dark`, or `null` when the token has no dark variant. */
  darkValue: string | null;
}

/**
 * Selectors that declare light-scheme tokens. Anchored: a compound selector
 * such as `:root.dark` must not be read as a light declaration.
 */
const LIGHT_SELECTOR = /^(?::root|html)$/;

/**
 * Selectors that declare dark-scheme tokens. Anchored so Tailwind's `dark:`
 * utilities — whose `selectorText` is `.dark\:bg-red-500` — are excluded.
 */
const DARK_SELECTOR = /^(?:html|:root)?\.dark$/;

/**
 * CSS colour notations a token may use. Matching by notation rather than
 * `CSS.supports` because jsdom does not implement `CSS.supports`, so a
 * supports-based check would be untestable. Named colours are excluded
 * deliberately: `--radius: 0.25rem` must not be classified as a colour, and no
 * shadcn token is a named colour.
 */
const COLOR_VALUE =
  /^(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\()/;

/** A value that is entirely one custom-property reference: `var(--primary)`. */
const VAR_REFERENCE = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/;

/**
 * Tailwind's `@theme inline` block re-declares every token under a `--color-`
 * namespace as `var(--<token>)`. Those are aliases, not tokens, and listing
 * them would double the picker.
 */
const TAILWIND_ALIAS_PREFIX = "--color-";

/** Maximum `var()` hops followed when resolving a declared value. */
const MAX_VAR_DEPTH = 4;

/**
 * Reads a stylesheet's rules, returning an empty list when access throws.
 *
 * A cross-origin stylesheet throws `SecurityError` on `cssRules`. That is
 * expected — a CDN font stylesheet declares no theme tokens — so it is skipped
 * rather than surfaced.
 *
 * @param props - Input props.
 * @param props.sheet - The stylesheet to read.
 * @returns The sheet's rules, or `[]` if they are inaccessible.
 */
function safeCssRules(props: { sheet: CSSStyleSheet }): CSSRule[] {
  try {
    return Array.from(props.sheet.cssRules);
  } catch {
    return [];
  }
}

/**
 * Recursively collects declared custom properties into the light and dark maps.
 *
 * Grouping rules (`@layer`, `@media`, `@supports`) carry their own `cssRules`
 * and are descended into — Tailwind v4 emits `:root` inside `@layer base`, so
 * skipping them would find nothing.
 *
 * @param props - Input props.
 * @param props.rules - Rules to walk.
 * @param props.light - Accumulator for light-scheme declarations, mutated in place.
 * @param props.dark - Accumulator for dark-scheme declarations, mutated in place.
 */
function collectDeclarations(props: {
  rules: CSSRule[];
  light: Map<string, string>;
  dark: Map<string, string>;
}): void {
  for (const rule of props.rules) {
    const grouping = rule as CSSRule & { cssRules?: CSSRuleList };
    if (grouping.cssRules) {
      collectDeclarations({
        rules: Array.from(grouping.cssRules),
        light: props.light,
        dark: props.dark,
      });
      continue;
    }

    const styleRule = rule as CSSStyleRule;
    if (!styleRule.selectorText || !styleRule.style) continue;

    const selectors = styleRule.selectorText.split(",").map((s) => s.trim());
    const isLight = selectors.some((s) => LIGHT_SELECTOR.test(s));
    const isDark = selectors.some((s) => DARK_SELECTOR.test(s));
    if (!isLight && !isDark) continue;

    // Indexed access, not `.item(i)`: jsdom's `CSSStyleDeclaration` does not
    // implement `item`, so `.item(i)` throws under vitest (measured).
    for (let i = 0; i < styleRule.style.length; i += 1) {
      const name = styleRule.style[i];
      if (!name.startsWith("--")) continue;
      const value = styleRule.style.getPropertyValue(name).trim();
      if (!value) continue;
      // Later declarations win, matching the cascade for equal specificity.
      if (isLight) props.light.set(name, value);
      if (isDark) props.dark.set(name, value);
    }
  }
}

/**
 * Resolves a declared value through up to {@link MAX_VAR_DEPTH} `var()` hops.
 *
 * @param props - Input props.
 * @param props.value - The declared value.
 * @param props.declared - The scheme's declaration map.
 * @param props.depth - Hops already followed. Callers pass nothing.
 * @returns The resolved value, or the last unresolvable value seen.
 */
function resolveValue(props: {
  value: string;
  declared: Map<string, string>;
  depth?: number;
}): string {
  const depth = props.depth ?? 0;
  const match = VAR_REFERENCE.exec(props.value);
  if (!match || depth >= MAX_VAR_DEPTH) return props.value;
  const target = props.declared.get(match[1]);
  if (target === undefined) return props.value;
  return resolveValue({ value: target, declared: props.declared, depth: depth + 1 });
}

/**
 * Reads every colour-valued CSS custom property declared by the document's
 * stylesheets, with both its light and dark values.
 *
 * Reads **declared** values out of the CSSOM rather than calling
 * `getComputedStyle` on the live tree: the admin panel may itself be in dark
 * mode, in which case computed values would report the dark palette twice.
 *
 * The admin panel renders inside the host application, so these are the site's
 * own design tokens.
 *
 * @returns Colour tokens sorted by name. Empty when there is no `document`
 * (SSR) or when no stylesheet declares a colour-valued custom property.
 *
 * @example
 * ```ts
 * readThemeColorTokens()
 * // [{ name: "--primary", reference: "var(--primary)",
 * //    lightValue: "oklch(60.5% 0.175 42)", darkValue: "oklch(72% 0.175 50)" }, …]
 * ```
 */
export function readThemeColorTokens(): ThemeColorToken[] {
  if (typeof document === "undefined") return [];

  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  for (const sheet of Array.from(document.styleSheets)) {
    collectDeclarations({ rules: safeCssRules({ sheet }), light, dark });
  }

  const tokens: ThemeColorToken[] = [];
  for (const [name, declared] of light) {
    if (name.startsWith(TAILWIND_ALIAS_PREFIX)) continue;
    const lightValue = resolveValue({ value: declared, declared: light });
    if (!COLOR_VALUE.test(lightValue)) continue;

    const declaredDark = dark.get(name);
    const darkValue =
      declaredDark === undefined
        ? null
        : resolveValue({ value: declaredDark, declared: dark });

    tokens.push({ name, reference: `var(${name})`, lightValue, darkValue });
  }

  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}
```

#### packages/react/src/components/fields/color/themeTokens.test.ts

New file. The fixture mirrors real shapes in `globals.css`: an `@layer` wrapper,
a `--color-*` Tailwind alias, a non-colour token, and a Tailwind `dark:` utility.

```ts
import { describe, it, expect, afterEach } from "vitest";
import { readThemeColorTokens } from "./themeTokens";

function injectStylesheet(props: { css: string }): void {
  const style = document.createElement("style");
  style.setAttribute("data-test-stylesheet", "true");
  style.textContent = props.css;
  document.head.appendChild(style);
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll("[data-test-stylesheet]"))) {
    el.remove();
  }
});

describe("readThemeColorTokens", () => {
  it("pairs each token's light and dark declarations", () => {
    injectStylesheet({
      css: `
        :root { --primary: oklch(60.5% 0.175 42); --background: #F5F5F5; }
        .dark { --primary: oklch(72% 0.175 50); }
      `,
    });

    expect(readThemeColorTokens()).toEqual([
      {
        name: "--background",
        reference: "var(--background)",
        lightValue: "#F5F5F5",
        darkValue: null,
      },
      {
        name: "--primary",
        reference: "var(--primary)",
        lightValue: "oklch(60.5% 0.175 42)",
        darkValue: "oklch(72% 0.175 50)",
      },
    ]);
  });

  it("descends into @layer blocks", () => {
    injectStylesheet({ css: `@layer base { :root { --accent: #E8622A; } }` });

    expect(readThemeColorTokens().map((t) => t.name)).toEqual(["--accent"]);
  });

  it("skips non-colour tokens", () => {
    injectStylesheet({
      css: `:root { --primary: #E8622A; --radius: 0.25rem; --font-sans: Geist, sans-serif; }`,
    });

    expect(readThemeColorTokens().map((t) => t.name)).toEqual(["--primary"]);
  });

  it("skips Tailwind's --color-* @theme aliases", () => {
    injectStylesheet({
      css: `:root { --primary: #E8622A; --color-primary: var(--primary); }`,
    });

    expect(readThemeColorTokens().map((t) => t.name)).toEqual(["--primary"]);
  });

  it("ignores Tailwind dark: utility selectors", () => {
    injectStylesheet({
      css: `:root { --primary: #E8622A; } .dark\\:bg-x { --primary: #000000; }`,
    });

    const primary = readThemeColorTokens()[0];
    expect(primary.darkValue).toBeNull();
  });

  it("resolves a token declared as a reference to another token", () => {
    injectStylesheet({
      css: `:root { --brand: #E8622A; --primary: var(--brand); }`,
    });

    const primary = readThemeColorTokens().find((t) => t.name === "--primary");
    expect(primary?.lightValue).toBe("#E8622A");
  });

  it("returns an empty list when no stylesheet declares colour tokens", () => {
    expect(readThemeColorTokens()).toEqual([]);
  });
});
```

#### packages/react/src/components/fields/color/Cell.tsx

New file, declared before `columnDef.tsx` which imports it. Setting
`backgroundColor` from the raw value means every notation — including
`var(--token)` — renders with no parsing.

```tsx
import { TDocument, type CellComponentProps, type ColorField } from "@vexcms/core";

/**
 * Colour field cell component for the data-table list view.
 *
 * Renders a swatch beside the stored value. `backgroundColor` is set from the
 * raw value, so a `var(--token)` reference resolves through CSS and the swatch
 * follows the active colour scheme for free.
 *
 * @param props - Component props.
 * @param props.value - Raw colour value from the document — hex or `var(--token)`.
 * @returns The cell component for this field type, or `null` for an empty value.
 *
 * @example
 * ```tsx
 * <ColorFieldCell value={doc.primaryLight} fieldDef={primaryLightField} row={row} isTitleField={false} />
 * ```
 */
export function ColorFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<ColorField, TData>,
) {
  if (!props.value) return null;
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded border border-border"
        style={{ backgroundColor: props.value }}
      />
      <span className="font-mono text-xs">{props.value}</span>
    </span>
  );
}
```

#### packages/react/src/components/fields/color/columnDef.tsx

New file. Mirrors `url/columnDef.tsx`.

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, ColorField, TDocument } from "@vexcms/core";
import { ColorFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a colour field.
 *
 * Generates column config with proper typing, cell renderer, alignment, and
 * metadata. Uses `ColorFieldCell` for rendering — a swatch plus the stored
 * value.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved colour field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @param props.collection - Parent collection config, forwarded to `ColorFieldCell`.
 * @returns TanStack Table column definition typed to `ColumnDef<TDocument, string>`.
 *
 * @example
 * ```ts
 * const column = colorFieldToColumnDef({
 *   fieldDef: collection.fields.primaryLight,
 *   fieldKey: "primaryLight",
 *   isTitleField: false,
 *   collection,
 * });
 * ```
 */
export function colorFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: ColorField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <ColorFieldCell
          value={value ?? ""}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    enableSorting: true,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/components/fields/color/Input.tsx

New file. Uses the package's own `Popover` and `Tabs` primitives rather than
master's hand-rolled click-outside. The two `@vexcms/core` calls in
`pickerColor` and `onChange` are the entire bridge between the picker's colour
model and the field's.

```tsx
"use client";

import {
  parseColor,
  serializeColor,
  type ColorField,
  type ColorFormat,
} from "@vexcms/core";
import Sketch from "@uiw/react-color-sketch";
import { useEffect, useMemo, useState } from "react";

import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { createFieldInput, FormDescription, FormLabel, FormError } from "../../form";
import { readThemeColorTokens, type ThemeColorToken } from "./themeTokens";

/** Colour the picker opens on when the field holds no parseable value. */
const PICKER_FALLBACK = "#000000";

/** Placeholder shown per notation, so the expected shape is visible before typing. */
const FORMAT_PLACEHOLDERS: Record<ColorFormat, string> = {
  hex: "#E8622A",
  rgb: "rgb(232, 98, 42)",
  hsl: "hsl(17.7, 80.5%, 53.7%)",
  oklch: "oklch(65.73% 0.17941 40.85)",
};

/**
 * Colour field input component for the admin edit form.
 *
 * Renders a swatch button that opens a `Sketch` picker, alongside a text input
 * for pasting an exact value. All colour maths lives in `@vexcms/core` —
 * this component only bridges the picker's model to it, which is two calls:
 *
 * - **write** — `ColorResult.rgba` is already `{ r, g, b, a }`, so it goes
 *   straight into `serializeColor` with the field's `format`.
 * - **read** — `Sketch`'s `color` prop parses hex and nothing else (its
 *   `@uiw/color-convert` helper returns `{ hex: undefined }` for `rgb()`,
 *   `hsl()` and `oklch()` alike), so the stored value is normalised to hex by
 *   `serializeColor` first. That is what lets a field storing `oklch` reopen on
 *   its saved colour rather than black.
 *
 * With `fieldDef.themeColors` the popover gains a **Theme** tab listing the host
 * application's CSS custom properties; selecting one stores `var(--token)` so
 * the colour follows the active colour scheme.
 *
 * Notation validation lives in `colorFieldToInputSchema`, not here — the text
 * input accepts free text and reports on submit, so a half-typed value is not
 * fought character by character.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <ColorFieldInput name="primaryLight" fieldDef={primaryLightField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const ColorFieldInput = createFieldInput<string, {}, ColorField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [tokens, setTokens] = useState<ThemeColorToken[]>([]);

    const value = field.state.value ?? "";
    const disabled = readOnly || fieldDef.admin.readOnly;

    // Read on open rather than on mount: the host stylesheet is in place by
    // then, and a closed picker should not walk the CSSOM.
    useEffect(() => {
      if (!isOpen || !fieldDef.themeColors) return;
      setTokens(readThemeColorTokens());
    }, [isOpen, fieldDef.themeColors]);

    const filteredTokens = useMemo(() => {
      if (!search) return tokens;
      const query = search.toLowerCase();
      return tokens.filter((token) => token.name.toLowerCase().includes(query));
    }, [tokens, search]);

    // A `var(--token)` value has no literal colour, so the picker falls back.
    const pickerColor = useMemo(() => {
      const parsed = parseColor({ value });
      return parsed ? serializeColor({ color: parsed, format: "hex" }) : PICKER_FALLBACK;
    }, [value]);

    const picker = (
      <Sketch
        color={pickerColor}
        disableAlpha={false}
        onChange={(next) =>
          field.handleChange(serializeColor({ color: next.rgba, format: fieldDef.format }))
        }
      />
    );

    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <div className="flex items-center gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
              nativeButton={false}
              render={(triggerProps) => (
                <button
                  {...triggerProps}
                  type="button"
                  aria-label={`Pick a colour for ${fieldDef.label || name}`}
                  disabled={disabled}
                  className="size-9 shrink-0 rounded-md border border-input shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: value || "transparent" }}
                />
              )}
            />
            <PopoverContent className="w-auto p-2" align="start">
              {fieldDef.themeColors ? (
                <Tabs defaultValue="custom">
                  <TabsList>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                  </TabsList>
                  <TabsContent value="custom">{picker}</TabsContent>
                  <TabsContent value="theme">
                    <div className="flex w-72 flex-col gap-2">
                      <Input
                        type="text"
                        value={search}
                        placeholder="Search tokens..."
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {filteredTokens.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                          {tokens.length === 0 ? "No theme colours found" : "No matching tokens"}
                        </p>
                      ) : (
                        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                          {filteredTokens.map((token) => (
                            <button
                              key={token.name}
                              type="button"
                              onClick={() => {
                                field.handleChange(token.reference);
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                              title={
                                token.darkValue
                                  ? `Light: ${token.lightValue} / Dark: ${token.darkValue}`
                                  : token.lightValue
                              }
                            >
                              <span className="relative size-4 shrink-0 overflow-hidden rounded border border-border">
                                <span
                                  className="absolute inset-0"
                                  style={{ backgroundColor: token.lightValue }}
                                />
                                {token.darkValue ? (
                                  <span
                                    className="absolute inset-0"
                                    style={{
                                      backgroundColor: token.darkValue,
                                      clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                                    }}
                                  />
                                ) : null}
                              </span>
                              <span className="truncate font-mono">{token.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                picker
              )}
            </PopoverContent>
          </Popover>
          <Input
            id={name}
            type="text"
            className="font-mono"
            disabled={disabled}
            value={value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder || FORMAT_PLACEHOLDERS[fieldDef.format]}
            readOnly={fieldDef.admin.readOnly}
          />
        </div>
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/color/index.ts

New file.

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
export * from "./themeTokens";
```

#### packages/react/src/components/fields/index.tsx

Four edits. Beside the `url` import and `export * from "./url";`:

```ts
import { ColorFieldCell, ColorFieldInput, colorFieldToColumnDef } from "./color";
```

```ts
export * from "./color";
```

In `fieldInputComponents`, after the `url` entry:

```ts
  [ADMIN_FIELDS.color.type]: ColorFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
```

In `fieldCellComponents`:

```ts
  [ADMIN_FIELDS.color.type]: ColorFieldCell as ComponentType<CellComponentProps<AdminField>>,
```

In the columnDef switch:

```ts
      case ADMIN_FIELDS.color.type:
        columnDefs.push(
          colorFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;
```

#### packages/react/src/adapter.ts

Add `ColorFieldInput` and `ColorFieldCell` to the `from "./components"` import,
then after the `url` entry in `reactAdapter.fields`:

```ts
    [ADMIN_FIELDS.color.type]: {
      input: ColorFieldInput,
      cell: ColorFieldCell,
    },
```

Verify: `pnpm build && pnpm typecheck && pnpm test` green — 43 React tests
(32 + 4 parity + 7 `themeTokens`), parity now counts **12** field types.
`git diff packages/react/package.json pnpm-workspace.yaml` is **empty**.

### Step 4 — `themes.ts` gains the full 32-token palette [agent]

This is the D8 amendment in code. `format: "oklch"` throughout, because that is
the notation `globals.css` declares its tokens in — so `ThemeStyle` interpolates
stored strings with no conversion.

- [x] `apps/www/src/vexcms/collections/themes.ts` — rewrite
- [x] `cd apps/www && node ../../packages/cli/dist/index.js generate`
- [x] `pnpm typecheck`

#### apps/www/src/vexcms/collections/themes.ts

Full replacement. Note there is **no** `admin.defaultColumns` — that key does not
exist on `defineCollection` in rebuild (measured: `TS2353`).

```ts
import { color, defineCollection, group, text } from "@vexcms/core"

import { TABLE_SLUG_THEMES } from "~/db/constants"

/**
 * One design-token colour field.
 *
 * Every theme colour is stored as OKLCh, because that is the notation
 * `globals.css` declares its custom properties in — so `<ThemeStyle />`
 * interpolates the stored string straight into a `--token: value` declaration
 * with no conversion step. Validation still accepts hex, `rgb()` and `hsl()`,
 * so pasting a brand hex works; the picker rewrites it as OKLCh on save.
 *
 * @param props - Input props.
 * @param props.label - Admin form label.
 * @param props.defaultValue - Stark × Ember value for this token, from `globals.css`.
 * @returns A `color()` field pinned to OKLCh output.
 */
function themeColor(props: { label: string; defaultValue: string }) {
  return color({ format: "oklch", label: props.label, defaultValue: props.defaultValue })
}

/**
 * The shadcn design-token set for one colour scheme.
 *
 * These 32 names are exactly the custom properties `globals.css` declares under
 * `:root` and `.dark`, and exactly the set tweakcn exports — so a preset maps
 * across with no gaps and `<ThemeStyle />` can emit the whole palette. Adding a
 * 33rd token means adding it to `globals.css` and to `THEME_TOKENS` in
 * `ThemeStyle.tsx` as well, or it is stored and silently ignored.
 *
 * Defaults are the Stark × Ember values already in `globals.css`, so a new theme
 * starts from the house palette rather than from empty pickers.
 *
 * @param mode - Which scheme's defaults to apply.
 * @returns One `color()` field per shadcn token, keyed camelCase.
 */
function themeColorFields(mode: "light" | "dark") {
  if (mode === "light") {
    return {
      background: themeColor({ label: "Background", defaultValue: "oklch(96.1% 0 0)" }),
      foreground: themeColor({ label: "Foreground", defaultValue: "oklch(13.7% 0 0)" }),
      card: themeColor({ label: "Card", defaultValue: "oklch(100% 0 0)" }),
      cardForeground: themeColor({ label: "Card Foreground", defaultValue: "oklch(13.7% 0 0)" }),
      popover: themeColor({ label: "Popover", defaultValue: "oklch(100% 0 0)" }),
      popoverForeground: themeColor({
        label: "Popover Foreground",
        defaultValue: "oklch(13.7% 0 0)",
      }),
      primary: themeColor({ label: "Primary", defaultValue: "oklch(60.5% 0.175 42)" }),
      primaryForeground: themeColor({
        label: "Primary Foreground",
        defaultValue: "oklch(100% 0 0)",
      }),
      secondary: themeColor({ label: "Secondary", defaultValue: "oklch(98% 0 0)" }),
      secondaryForeground: themeColor({
        label: "Secondary Foreground",
        defaultValue: "oklch(13.7% 0 0)",
      }),
      muted: themeColor({ label: "Muted", defaultValue: "oklch(98% 0 0)" }),
      mutedForeground: themeColor({ label: "Muted Foreground", defaultValue: "oklch(50.5% 0 0)" }),
      accent: themeColor({ label: "Accent", defaultValue: "oklch(96% 0.025 42)" }),
      accentForeground: themeColor({
        label: "Accent Foreground",
        defaultValue: "oklch(52% 0.180 40)",
      }),
      destructive: themeColor({ label: "Destructive", defaultValue: "oklch(57.7% 0.198 27)" }),
      destructiveForeground: themeColor({
        label: "Destructive Foreground",
        defaultValue: "oklch(98% 0 0)",
      }),
      border: themeColor({ label: "Border", defaultValue: "oklch(85% 0 0)" }),
      input: themeColor({ label: "Input", defaultValue: "oklch(54.6% 0 0)" }),
      ring: themeColor({ label: "Ring", defaultValue: "oklch(60.5% 0.175 42)" }),
      chart1: themeColor({ label: "Chart 1", defaultValue: "oklch(60.5% 0.175 42)" }),
      chart2: themeColor({ label: "Chart 2", defaultValue: "oklch(45% 0 0)" }),
      chart3: themeColor({ label: "Chart 3", defaultValue: "oklch(72% 0.100 60)" }),
      chart4: themeColor({ label: "Chart 4", defaultValue: "oklch(60% 0.040 30)" }),
      chart5: themeColor({ label: "Chart 5", defaultValue: "oklch(78% 0 0)" }),
      sidebar: themeColor({ label: "Sidebar", defaultValue: "oklch(98% 0 0)" }),
      sidebarForeground: themeColor({
        label: "Sidebar Foreground",
        defaultValue: "oklch(13.7% 0 0)",
      }),
      sidebarPrimary: themeColor({
        label: "Sidebar Primary",
        defaultValue: "oklch(60.5% 0.175 42)",
      }),
      sidebarPrimaryForeground: themeColor({
        label: "Sidebar Primary Foreground",
        defaultValue: "oklch(100% 0 0)",
      }),
      sidebarAccent: themeColor({ label: "Sidebar Accent", defaultValue: "oklch(96.1% 0 0)" }),
      sidebarAccentForeground: themeColor({
        label: "Sidebar Accent Foreground",
        defaultValue: "oklch(13.7% 0 0)",
      }),
      sidebarBorder: themeColor({ label: "Sidebar Border", defaultValue: "oklch(85% 0 0)" }),
      sidebarRing: themeColor({ label: "Sidebar Ring", defaultValue: "oklch(60.5% 0.175 42)" }),
    }
  }
  return {
    background: themeColor({ label: "Background", defaultValue: "oklch(13.7% 0 0)" }),
    foreground: themeColor({ label: "Foreground", defaultValue: "oklch(95% 0 0)" }),
    card: themeColor({ label: "Card", defaultValue: "oklch(17.4% 0 0)" }),
    cardForeground: themeColor({ label: "Card Foreground", defaultValue: "oklch(95% 0 0)" }),
    popover: themeColor({ label: "Popover", defaultValue: "oklch(17.4% 0 0)" }),
    popoverForeground: themeColor({ label: "Popover Foreground", defaultValue: "oklch(95% 0 0)" }),
    primary: themeColor({ label: "Primary", defaultValue: "oklch(72% 0.175 50)" }),
    primaryForeground: themeColor({
      label: "Primary Foreground",
      defaultValue: "oklch(13.7% 0 0)",
    }),
    secondary: themeColor({ label: "Secondary", defaultValue: "oklch(20% 0 0)" }),
    secondaryForeground: themeColor({
      label: "Secondary Foreground",
      defaultValue: "oklch(95% 0 0)",
    }),
    muted: themeColor({ label: "Muted", defaultValue: "oklch(20% 0 0)" }),
    mutedForeground: themeColor({ label: "Muted Foreground", defaultValue: "oklch(70% 0 0)" }),
    accent: themeColor({ label: "Accent", defaultValue: "oklch(72% 0.175 50 / 0.12)" }),
    accentForeground: themeColor({
      label: "Accent Foreground",
      defaultValue: "oklch(72% 0.175 50)",
    }),
    destructive: themeColor({ label: "Destructive", defaultValue: "oklch(63% 0.210 27)" }),
    destructiveForeground: themeColor({
      label: "Destructive Foreground",
      defaultValue: "oklch(95% 0 0)",
    }),
    border: themeColor({ label: "Border", defaultValue: "oklch(25% 0 0)" }),
    input: themeColor({ label: "Input", defaultValue: "oklch(40% 0 0)" }),
    ring: themeColor({ label: "Ring", defaultValue: "oklch(72% 0.175 50)" }),
    chart1: themeColor({ label: "Chart 1", defaultValue: "oklch(72% 0.175 50)" }),
    chart2: themeColor({ label: "Chart 2", defaultValue: "oklch(78% 0 0)" }),
    chart3: themeColor({ label: "Chart 3", defaultValue: "oklch(78% 0.120 65)" }),
    chart4: themeColor({ label: "Chart 4", defaultValue: "oklch(60% 0.060 30)" }),
    chart5: themeColor({ label: "Chart 5", defaultValue: "oklch(45% 0 0)" }),
    sidebar: themeColor({ label: "Sidebar", defaultValue: "oklch(7% 0 0)" }),
    sidebarForeground: themeColor({ label: "Sidebar Foreground", defaultValue: "oklch(95% 0 0)" }),
    sidebarPrimary: themeColor({ label: "Sidebar Primary", defaultValue: "oklch(72% 0.175 50)" }),
    sidebarPrimaryForeground: themeColor({
      label: "Sidebar Primary Foreground",
      defaultValue: "oklch(13.7% 0 0)",
    }),
    sidebarAccent: themeColor({ label: "Sidebar Accent", defaultValue: "oklch(20% 0 0)" }),
    sidebarAccentForeground: themeColor({
      label: "Sidebar Accent Foreground",
      defaultValue: "oklch(95% 0 0)",
    }),
    sidebarBorder: themeColor({ label: "Sidebar Border", defaultValue: "oklch(25% 0 0)" }),
    sidebarRing: themeColor({ label: "Sidebar Ring", defaultValue: "oklch(72% 0.175 50)" }),
  }
}

export const themes = defineCollection({
  slug: TABLE_SLUG_THEMES,
  interfaceName: "Theme",
  labels: {
    singular: "Theme",
    plural: "Themes",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Theme Name",
      required: true,
      index: "by_name",
      description:
        "Internal identifier for this theme. Used for idempotent lookups and admin display.",
    }),
    fontFamily: text({
      label: "Font Family",
      defaultValue: "Geist, Inter, system-ui, sans-serif",
      description:
        "CSS font-family stack applied to --font-sans. The first available font wins, so a stack naming an unloaded font degrades rather than breaking.",
    }),
    radius: text({
      label: "Border Radius",
      defaultValue: "4px",
      description: "Applied to the --radius custom property. Any CSS length.",
    }),
    light: group({
      label: "Light Mode",
      description: "Tokens emitted under :root.",
      fields: themeColorFields("light"),
    }),
    dark: group({
      label: "Dark Mode",
      description: "Tokens emitted under .dark.",
      fields: themeColorFields("dark"),
    }),
  },
})
```

Verify: `cd apps/www && node ../../packages/cli/dist/index.js generate` — note
the `cd`, since `generate` ignores `--cwd` and reads `process.cwd()` (measured:
from the repo root it fails with "Could not find vex config"). `vex.schema.ts`'s
`themes` table becomes two `v.object`s of 32 `v.string()`s beside `name`,
`fontFamily` and `radius`. `pnpm typecheck` 14/14.

### Step 5 — `siteSettings` becomes a global with two theme references [agent]

- [x] `apps/www/src/db/constants/index.ts` — swap table slug for global slug
- [x] `apps/www/src/vexcms/globals/siteSettings.ts` — new; delete the collection file
- [x] `apps/www/src/vexcms/{collections,globals}/index.ts`
- [x] `apps/www/src/vex.config.ts`, `apps/www/src/auth/access.ts`
- [x] regenerate, then `apps/www/convex/schema.ts`
- [x] `pnpm typecheck`

#### apps/www/src/db/constants/index.ts

Delete `export const TABLE_SLUG_SITE_SETTINGS = "site_settings" as const;` and
add beside `GLOBAL_SLUG_NAV` — globals are camelCase, unlike table slugs:

```ts
export const GLOBAL_SLUG_SITE_SETTINGS = "siteSettings" as const;
```

#### apps/www/src/vexcms/globals/siteSettings.ts

New file. `relationship` always stores an **array** of ids — `hasMany` is a
UI-only hint — so both references are `string[]` and consumers read `[0]`.

```ts
import { defineGlobal, relationship, text } from "@vexcms/core";

import { GLOBAL_SLUG_SITE_SETTINGS, TABLE_SLUG_THEMES } from "~/db/constants";

/**
 * Site-wide settings — a singleton, so a global rather than a collection.
 *
 * The two theme references are what make the themes collection do something:
 * the root layout follows `activeTheme`, the admin layout follows `adminTheme`
 * and falls back to `activeTheme` when it is empty. Leaving `adminTheme` unset
 * — the default — means the admin panel wears the site's theme.
 */
export const siteSettings = defineGlobal({
  slug: GLOBAL_SLUG_SITE_SETTINGS,
  label: "Site Settings",
  admin: {
    icon: "Settings",
    description: "Site name, and the themes applied to the site and the admin panel.",
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
      description:
        "Global site name used as fallback for logo text, page titles, and meta tags.",
    }),
    activeTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Active Theme",
      description:
        "The theme applied to the public site. Changing it re-skins the site on the next page load.",
    }),
    adminTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Admin Theme",
      description:
        "Optional. Leave empty and the admin panel uses the Active Theme; set it to give the admin its own palette.",
    }),
  },
});
```

#### apps/www/src/vexcms/globals/index.ts

Replaces the single-global barrel.

```ts
import { nav } from "./nav";
import { siteSettings } from "./siteSettings";

export * from "./nav";
export * from "./siteSettings";

export const globals = [nav, siteSettings];
```

#### apps/www/src/vexcms/collections/siteSettings.ts

Delete. Its `name` field moves to the global verbatim.

#### apps/www/src/vexcms/collections/index.ts

Remove `export * from "./siteSettings";` and the `siteSettings,` array entry.

#### apps/www/src/vex.config.ts

Remove `siteSettings,` from the `~/vexcms/collections` import and the
`collections` array, then:

```ts
import { siteSettings } from "./vexcms/globals/siteSettings";
```

```ts
  globals: [nav, siteSettings],
```

#### apps/www/src/auth/access.ts

`siteSettings` stays a `defineAccess` resource — globals are resources exactly
like collections, `nav` already is one — it just arrives from a different module.

```ts
import { nav, siteSettings } from "~/vexcms/globals";
```

Move `siteSettings,` out of the collections import list and down beside `nav,`
at the end of `resources`.

#### apps/www/convex/schema.ts

**Not optional.** This file is hand-maintained and the CLI only *adds* imports.
Dropping the collection removes `site_settings` from `vex.schema.ts`, so both
references here must go or `tsc` fails with
`TS2305: Module './vex.schema' has no exported member 'site_settings'`
(measured). Delete `site_settings,` from the import list and from
`defineSchema({ … })`.

Verify: regenerate from inside `apps/www`; `vex.types.ts` gains
`SiteSettingsGlobal` and `GlobalSlug` becomes `"nav" | "siteSettings"`.
`pnpm typecheck` 14/14. The one-row `site_settings` table is orphaned — in dev
that is `{ name: "Vex CMS" }`, and Step 7's seed rewrites it as a global, so
there is no migration to write.

### Step 6 — Apply the theme to the whole app [agent]

The observable half, and where the admin adopts the site's palette.

- [x] delete `apps/www/convex/themes.ts` (dead code)
- [x] `apps/www/convex/theme.ts` — `getActive` + `getAdmin`
- [x] `apps/www/src/components/ThemeStyle.tsx`
- [x] `apps/www/src/app/(frontend)/layout.tsx` — new; move the public pages into it
- [x] `apps/www/src/app/layout.tsx` — render `<ThemeStyle />`, drop the `auth` slot
- [x] `apps/www/src/app/(vexcms)/admin/layout.tsx` — render `<ThemeStyle scope="admin" />`
- [x] `pnpm build && pnpm typecheck`

#### apps/www/convex/themes.ts

Delete. Despite the name it queries **pages**: its only export is `getBySlug`
with `args: { slug: v.id(TABLE_SLUG_PAGES) }` calling
`find({ collection: TABLE_SLUG_PAGES })`, and nothing imports it.

#### apps/www/convex/theme.ts

New file. `QueryCtx` from `./_generated/server` is the ctx type — deriving it
with `Parameters<Parameters<typeof query>[0]["handler"]>[0]` fails, because the
`query` builder's argument is a union and `handler` is not on both members
(measured: `TS2339`).

```ts
import { getGlobal } from "@vexcms/core/server"

import { GLOBAL_SLUG_SITE_SETTINGS, type TABLE_SLUG_THEMES } from "~/db/constants"
import config from "~/vex.config"

import type { Doc, Id } from "./_generated/dataModel"
import type { QueryCtx } from "./_generated/server"

import { query } from "./_generated/server"

/** A theme document, or `null` when none is selected. */
type ActiveTheme = Doc<typeof TABLE_SLUG_THEMES> | null

/**
 * Resolves one of `siteSettings`' theme references to its document.
 *
 * `relationship` always stores an array of ids — `hasMany` only controls how
 * many the admin picker lets you choose — so the first entry is the selection.
 *
 * Access control is bypassed: a site's palette is public by definition, and an
 * anonymous visitor must get the same colours as a signed-in editor.
 *
 * @param props - Input props.
 * @param props.ctx - Convex query context.
 * @param props.field - Which `siteSettings` reference to follow.
 * @returns The referenced theme, or `null` when the global is unset, the
 * reference is empty, or the referenced theme has been deleted.
 */
async function resolveTheme(props: {
  ctx: QueryCtx
  field: "activeTheme" | "adminTheme"
}): Promise<ActiveTheme> {
  const settings = await getGlobal({
    ctx: props.ctx,
    config,
    slug: GLOBAL_SLUG_SITE_SETTINGS,
    access: { bypass: true },
  })
  if (!settings) return null

  const reference = settings[props.field] as string[] | undefined
  const themeId = reference?.[0]
  if (!themeId) return null

  return await props.ctx.db.get(themeId as Id<typeof TABLE_SLUG_THEMES>)
}

/**
 * The theme applied to the public site — `siteSettings.activeTheme`.
 *
 * Read by `<ThemeStyle />` in the root layout on every render.
 */
export const getActive = query({
  args: {},
  handler: async (ctx): Promise<ActiveTheme> => await resolveTheme({ ctx, field: "activeTheme" }),
})

/**
 * The theme applied to the admin panel.
 *
 * Falls back to `activeTheme` when `adminTheme` is unset, which is the default:
 * the admin adopts the site's palette. Setting `adminTheme` is the opt-out.
 */
export const getAdmin = query({
  args: {},
  handler: async (ctx): Promise<ActiveTheme> =>
    (await resolveTheme({ ctx, field: "adminTheme" })) ??
    (await resolveTheme({ ctx, field: "activeTheme" })),
})
```

#### apps/www/src/components/ThemeStyle.tsx

New file. The specificity ladder in `selector`/`darkSelector` is the whole
admin-override mechanism — read that comment before changing either.

```tsx
import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

/**
 * Theme field key → CSS custom property, for the 32 shadcn design tokens.
 *
 * Mirrors `themeColorFields` in `~/vexcms/collections/themes`. The two lists
 * must stay in step: a token in the collection but not here is stored and never
 * applied, and a token here but not in the collection simply never renders.
 */
const THEME_TOKENS: Record<string, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
}

/**
 * Scheme-independent fields, read from the theme document root.
 *
 * `--font-sans` is also set by `next/font` as a class on `<html>`; both are
 * specificity (0,1,0), so the later declaration wins and this one is hoisted
 * after. A stack naming a font the app has not loaded degrades to the next
 * entry rather than breaking — that is why the field's description says so.
 */
const SHARED_TOKENS: Record<string, string> = {
  radius: "--radius",
  fontFamily: "--font-sans",
}

/** A theme document's per-scheme colour group. */
type ColorGroup = Record<string, unknown> | undefined

/**
 * Builds one CSS declaration block.
 *
 * @param props - Input props.
 * @param props.values - Field key → stored value.
 * @param props.tokens - Field key → custom property name.
 * @returns Newline-joined `--token: value;` declarations, or `""` when none apply.
 */
function buildDeclarations(props: {
  values: Record<string, unknown> | undefined
  tokens: Record<string, string>
}): string {
  if (!props.values) return ""
  const declarations: string[] = []
  for (const [fieldKey, cssVar] of Object.entries(props.tokens)) {
    const value = props.values[fieldKey]
    if (typeof value === "string" && value) declarations.push(`  ${cssVar}: ${value};`)
  }
  return declarations.join("\n")
}

/**
 * Server component that inlines a theme's CSS custom properties.
 *
 * Rendered twice per admin request and once per public request:
 *
 * - the root layout emits the **site** theme at `:root`;
 * - the admin layout emits the **admin** theme at `:root:root`.
 *
 * `:root:root` is specificity (0,2,0) against `:root`'s (0,1,0), so the admin
 * block wins wherever both are present without depending on style-injection
 * order. On public routes the admin layout never renders, so there is exactly
 * one block. Leave `siteSettings.adminTheme` empty and `getAdmin` falls back to
 * the site theme, which is the default: **the admin adopts the site's palette.**
 *
 * Values are written through verbatim. A `color()` field storing
 * `oklch(60.5% 0.175 42)` needs no conversion, because that is already the
 * notation `globals.css` declares its tokens in.
 *
 * Renders nothing when Convex is unreachable (e.g. a build with no deployment)
 * or no theme is active — the app then uses `globals.css` unchanged.
 *
 * @param props - Input props.
 * @param props.scope - `"site"` emits `:root`; `"admin"` emits `:root:root` and
 * reads `adminTheme` with a fallback to the site theme.
 * @returns A `<style>` element, or `null`.
 */
export async function ThemeStyle(props: { scope?: "admin" | "site" }) {
  const scope = props.scope ?? "site"

  let theme: Record<string, unknown> | null = null
  try {
    theme = await fetchQuery(scope === "admin" ? api.theme.getAdmin : api.theme.getActive)
  } catch {
    // No deployment reachable at build time — fall back to globals.css.
    return null
  }
  if (!theme) return null

  // `.dark` sits on <html>, which *is* `:root` — so the dark selector is a
  // compound, never a descendant. Specificity ladder on an admin page in dark
  // mode: site light (0,1,0) < site dark (0,1,0, later) < admin light (0,2,0)
  // < admin dark (0,3,0). Every field carries a default, so an admin theme
  // always populates both groups and the ladder never stalls mid-rung.
  const selector = scope === "admin" ? ":root:root" : ":root"
  const darkSelector = scope === "admin" ? ".dark:root:root" : ".dark"
  const light = [
    buildDeclarations({ values: theme.light as ColorGroup, tokens: THEME_TOKENS }),
    buildDeclarations({ values: theme, tokens: SHARED_TOKENS }),
  ]
    .filter(Boolean)
    .join("\n")
  const dark = buildDeclarations({ values: theme.dark as ColorGroup, tokens: THEME_TOKENS })

  const css = [light && `${selector} {\n${light}\n}`, dark && `${darkSelector} {\n${dark}\n}`]
    .filter(Boolean)
    .join("\n\n")
  if (!css) return null

  // `precedence` opts into React 19 style hoisting, so this lands in <head>
  // before first paint instead of mid-body.
  return (
    <style
      dangerouslySetInnerHTML={{ __html: css }}
      href={`vex-theme-${scope}`}
      precedence="high"
    />
  )
}
```

#### apps/www/src/app/(frontend)/layout.tsx — and moving the public pages

Three `git mv`s, then a new layout. Route groups do not affect URLs, so
`/` and `/[slug]` are unchanged:

```bash
cd apps/www/src/app
mkdir -p "(frontend)/[slug]"
git mv page.tsx "(frontend)/page.tsx"
git mv "[slug]/page.tsx" "(frontend)/[slug]/page.tsx"
git mv PageContent.tsx "(frontend)/PageContent.tsx"
rmdir "[slug]"
```

`PageContent` moves with them, so the pages' `./PageContent` and
`../PageContent` imports both still resolve. `(frontend)/@auth` and
`(frontend)/auth` are already there and do not move.

#### apps/www/src/app/(frontend)/layout.tsx

New file.

```tsx
import type { ReactNode } from "react"

/**
 * Public-site layout.
 *
 * Exists so the `@auth` parallel slot is received by the route group that
 * declares it, rather than leaking up to the root layout — which is also shared
 * with `/admin`, where an auth modal slot means nothing. Restores the structure
 * the marketing template and the pre-rebuild app both used.
 *
 * The theme is *not* applied here. It is applied once in the root layout so the
 * admin panel inherits it too; see `~/components/ThemeStyle`.
 */
export default function FrontendLayout({
  auth,
  children,
}: Readonly<{
  auth: ReactNode
  children: ReactNode
}>) {
  return (
    <>
      {children}
      {auth}
    </>
  )
}
```

#### apps/www/src/app/layout.tsx

Two changes: `<ThemeStyle />` in `<head>`, and the `auth` parallel slot removed
— it now lands on `(frontend)/layout.tsx`, the group that declares it.

```tsx
import type { Metadata } from "next"

import "./globals.css"

import { ThemeScript } from "@vexcms/react"
import { Geist, Geist_Mono } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import { ThemeStyle } from "~/components/ThemeStyle"
import ServerProviders from "~/components/providers/server"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  description: "Generated by create z3 app",
  icons: { icon: "/favicons/favicon.ico" },
  title: "VexCMS",
}

/**
 * Root Next.js layout — applies global fonts, sets metadata, and wraps the app
 * in `ServerProviders` (e.g. colour scheme) and `ClientProviders` (Convex, auth,
 * query).
 *
 * `<ThemeStyle />` is here rather than in a route group on purpose: the site's
 * active theme should reach **everything**, admin panel included. The admin
 * layout then re-emits its own theme at higher specificity, so setting
 * `siteSettings.adminTheme` opts the panel out. The `auth` parallel slot moved
 * to `(frontend)/layout.tsx`, which is the group that declares it.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <ThemeStyle />
      </head>
      <body>
        <ServerProviders>
          <ClientProviders>{children}</ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
```

#### apps/www/src/app/(vexcms)/admin/layout.tsx

Two edits. Import:

```tsx
import { ThemeStyle } from "~/components/ThemeStyle";
```

and render it first inside `<ClientProviders>`:

```tsx
  return (
    <ClientProviders>
      {/* Emitted at `:root:root`, so it outranks the root layout's site theme
          on admin routes only. Falls back to the site theme when
          `siteSettings.adminTheme` is empty — see `api.theme.getAdmin`. */}
      <ThemeStyle scope="admin" />
      <NextAdminLayout config={config} user={user ?? undefined}>
        {children}
      </NextAdminLayout>
    </ClientProviders>
  );
```

Verify: `pnpm build` 10/10 — `www#build` runs a full Next production build, so
this is what proves the moved routes and both layouts actually compile.
`pnpm typecheck` 14/14.

### Step 7 — Seed the palettes and rehearse the loop [dev]

- [x] `apps/www/convex/seed.ts` — global row, `THEME_PRESETS`, `themes` mutation
- [x] `npx convex run seed:init` then `npx convex run seed:themes`
- [x] Walk the manual acceptance script

#### apps/www/convex/seed.ts

Four edits.

**1 — import the global slug.** Beside the existing `Id` type import:

```ts
import { GLOBAL_SLUG_SITE_SETTINGS } from "~/db/constants"
```

**2 — `init` writes a global, not a table row.** Replace the
`insertIfEmpty("site_settings", …)` call. Globals live in `vex_globals` as
`{ slug, data }` with a `by_slug` index, and `getGlobal` lifts `data` to the
document root:

```ts
    // ── SITE SETTINGS ── singleton global, stored in vex_globals as { slug, data }
    const existingSettings = await ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", GLOBAL_SLUG_SITE_SETTINGS))
      .first()
    if (existingSettings) {
      skipped.push("siteSettings")
    } else {
      await ctx.db.insert("vex_globals", {
        slug: GLOBAL_SLUG_SITE_SETTINGS,
        data: { name: "Vex CMS", activeTheme: [], adminTheme: [] },
      })
      created.push("siteSettings")
    }
```

**3 — drop `init`'s inline theme.** The `insertIfMissing("themes", …,
"Stark × Ember", …)` block goes; `seed:themes` owns themes now and seeds the full
palette. Leave a marker:

```ts
    // ── THEMES ── seeded by `seed:themes`, which also sets the active reference.
```

**4 — append the presets and the mutation.**

```ts
// ============================================================================
// THEMES — full 32-token shadcn palettes
// ============================================================================

const THEME_PRESETS = [
  {
    name: "Stark × Ember",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "4px",
    light: {
      background: "oklch(96.1% 0 0)",
      foreground: "oklch(13.7% 0 0)",
      card: "oklch(100% 0 0)",
      cardForeground: "oklch(13.7% 0 0)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(13.7% 0 0)",
      primary: "oklch(60.5% 0.175 42)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(98% 0 0)",
      secondaryForeground: "oklch(13.7% 0 0)",
      muted: "oklch(98% 0 0)",
      mutedForeground: "oklch(50.5% 0 0)",
      accent: "oklch(96% 0.025 42)",
      accentForeground: "oklch(52% 0.180 40)",
      destructive: "oklch(57.7% 0.198 27)",
      destructiveForeground: "oklch(98% 0 0)",
      border: "oklch(85% 0 0)",
      input: "oklch(54.6% 0 0)",
      ring: "oklch(60.5% 0.175 42)",
      chart1: "oklch(60.5% 0.175 42)",
      chart2: "oklch(45% 0 0)",
      chart3: "oklch(72% 0.100 60)",
      chart4: "oklch(60% 0.040 30)",
      chart5: "oklch(78% 0 0)",
      sidebar: "oklch(98% 0 0)",
      sidebarForeground: "oklch(13.7% 0 0)",
      sidebarPrimary: "oklch(60.5% 0.175 42)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(96.1% 0 0)",
      sidebarAccentForeground: "oklch(13.7% 0 0)",
      sidebarBorder: "oklch(85% 0 0)",
      sidebarRing: "oklch(60.5% 0.175 42)",
    },
    dark: {
      background: "oklch(13.7% 0 0)",
      foreground: "oklch(95% 0 0)",
      card: "oklch(17.4% 0 0)",
      cardForeground: "oklch(95% 0 0)",
      popover: "oklch(17.4% 0 0)",
      popoverForeground: "oklch(95% 0 0)",
      primary: "oklch(72% 0.175 50)",
      primaryForeground: "oklch(13.7% 0 0)",
      secondary: "oklch(20% 0 0)",
      secondaryForeground: "oklch(95% 0 0)",
      muted: "oklch(20% 0 0)",
      mutedForeground: "oklch(70% 0 0)",
      accent: "oklch(72% 0.175 50 / 0.12)",
      accentForeground: "oklch(72% 0.175 50)",
      destructive: "oklch(63% 0.210 27)",
      destructiveForeground: "oklch(95% 0 0)",
      border: "oklch(25% 0 0)",
      input: "oklch(40% 0 0)",
      ring: "oklch(72% 0.175 50)",
      chart1: "oklch(72% 0.175 50)",
      chart2: "oklch(78% 0 0)",
      chart3: "oklch(78% 0.120 65)",
      chart4: "oklch(60% 0.060 30)",
      chart5: "oklch(45% 0 0)",
      sidebar: "oklch(7% 0 0)",
      sidebarForeground: "oklch(95% 0 0)",
      sidebarPrimary: "oklch(72% 0.175 50)",
      sidebarPrimaryForeground: "oklch(13.7% 0 0)",
      sidebarAccent: "oklch(20% 0 0)",
      sidebarAccentForeground: "oklch(95% 0 0)",
      sidebarBorder: "oklch(25% 0 0)",
      sidebarRing: "oklch(72% 0.175 50)",
    },
  },
  {
    name: "Modern Minimal",
    fontFamily: "Inter, sans-serif",
    radius: "0.375rem",
    light: {
      background: "oklch(100% 0 0)",
      foreground: "oklch(32.11% 0 0)",
      card: "oklch(100% 0 0)",
      cardForeground: "oklch(32.11% 0 0)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(32.11% 0 0)",
      primary: "oklch(62.31% 0.18801 259.81)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(96.7% 0.00287 264.54)",
      secondaryForeground: "oklch(44.61% 0.02631 256.8)",
      muted: "oklch(98.46% 0.00171 247.84)",
      mutedForeground: "oklch(55.1% 0.02336 264.36)",
      accent: "oklch(95.14% 0.02503 236.82)",
      accentForeground: "oklch(37.91% 0.13776 265.52)",
      destructive: "oklch(63.68% 0.20785 25.33)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(92.76% 0.00581 264.53)",
      input: "oklch(92.76% 0.00581 264.53)",
      ring: "oklch(62.31% 0.18801 259.81)",
      chart1: "oklch(62.31% 0.18801 259.81)",
      chart2: "oklch(54.61% 0.21521 262.88)",
      chart3: "oklch(48.82% 0.21717 264.38)",
      chart4: "oklch(42.44% 0.18087 265.64)",
      chart5: "oklch(37.91% 0.13776 265.52)",
      sidebar: "oklch(98.46% 0.00171 247.84)",
      sidebarForeground: "oklch(32.11% 0 0)",
      sidebarPrimary: "oklch(62.31% 0.18801 259.81)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(95.14% 0.02503 236.82)",
      sidebarAccentForeground: "oklch(37.91% 0.13776 265.52)",
      sidebarBorder: "oklch(92.76% 0.00581 264.53)",
      sidebarRing: "oklch(62.31% 0.18801 259.81)",
    },
    dark: {
      background: "oklch(20.46% 0 0)",
      foreground: "oklch(92.19% 0 0)",
      card: "oklch(26.86% 0 0)",
      cardForeground: "oklch(92.19% 0 0)",
      popover: "oklch(26.86% 0 0)",
      popoverForeground: "oklch(92.19% 0 0)",
      primary: "oklch(62.31% 0.18801 259.81)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(26.86% 0 0)",
      secondaryForeground: "oklch(92.19% 0 0)",
      muted: "oklch(23.93% 0 0)",
      mutedForeground: "oklch(71.55% 0 0)",
      accent: "oklch(37.91% 0.13776 265.52)",
      accentForeground: "oklch(88.23% 0.05706 254.13)",
      destructive: "oklch(63.68% 0.20785 25.33)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(37.15% 0 0)",
      input: "oklch(37.15% 0 0)",
      ring: "oklch(62.31% 0.18801 259.81)",
      chart1: "oklch(71.37% 0.14338 254.62)",
      chart2: "oklch(62.31% 0.18801 259.81)",
      chart3: "oklch(54.61% 0.21521 262.88)",
      chart4: "oklch(48.82% 0.21717 264.38)",
      chart5: "oklch(42.44% 0.18087 265.64)",
      sidebar: "oklch(20.46% 0 0)",
      sidebarForeground: "oklch(92.19% 0 0)",
      sidebarPrimary: "oklch(62.31% 0.18801 259.81)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(37.91% 0.13776 265.52)",
      sidebarAccentForeground: "oklch(88.23% 0.05706 254.13)",
      sidebarBorder: "oklch(37.15% 0 0)",
      sidebarRing: "oklch(62.31% 0.18801 259.81)",
    },
  },
  {
    name: "Violet Bloom",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    radius: "1.4rem",
    light: {
      background: "oklch(99.4% 0 0)",
      foreground: "oklch(0% 0 0)",
      card: "oklch(99.4% 0 0)",
      cardForeground: "oklch(0% 0 0)",
      popover: "oklch(99.11% 0 0)",
      popoverForeground: "oklch(0% 0 0)",
      primary: "oklch(53.93% 0.27129 286.75)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(95.4% 0.00626 255.48)",
      secondaryForeground: "oklch(13.44% 0 0)",
      muted: "oklch(97.02% 0 0)",
      mutedForeground: "oklch(43.86% 0 0)",
      accent: "oklch(93.93% 0.02876 266.37)",
      accentForeground: "oklch(54.45% 0.19034 259.48)",
      destructive: "oklch(62.9% 0.19024 23.07)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(93% 0.00939 286.22)",
      input: "oklch(94.01% 0 0)",
      ring: "oklch(0% 0 0)",
      chart1: "oklch(74.59% 0.14834 156.45)",
      chart2: "oklch(53.93% 0.27129 286.75)",
      chart3: "oklch(73.36% 0.17578 50.55)",
      chart4: "oklch(58.28% 0.18094 259.73)",
      chart5: "oklch(55.9% 0 0)",
      sidebar: "oklch(97.77% 0.00513 247.88)",
      sidebarForeground: "oklch(0% 0 0)",
      sidebarPrimary: "oklch(0% 0 0)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(94.01% 0 0)",
      sidebarAccentForeground: "oklch(0% 0 0)",
      sidebarBorder: "oklch(94.01% 0 0)",
      sidebarRing: "oklch(0% 0 0)",
    },
    dark: {
      background: "oklch(22.23% 0.00601 271.14)",
      foreground: "oklch(95.51% 0 0)",
      card: "oklch(25.68% 0.00762 274.65)",
      cardForeground: "oklch(95.51% 0 0)",
      popover: "oklch(25.68% 0.00762 274.65)",
      popoverForeground: "oklch(95.51% 0 0)",
      primary: "oklch(61.32% 0.22941 291.74)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(29.4% 0.01301 272.93)",
      secondaryForeground: "oklch(95.51% 0 0)",
      muted: "oklch(29.4% 0.01301 272.93)",
      mutedForeground: "oklch(70.58% 0 0)",
      accent: "oklch(27.95% 0.03685 260.03)",
      accentForeground: "oklch(78.57% 0.11535 246.66)",
      destructive: "oklch(71.06% 0.16615 22.22)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(32.89% 0.00922 268.38)",
      input: "oklch(32.89% 0.00922 268.38)",
      ring: "oklch(61.32% 0.22941 291.74)",
      chart1: "oklch(80.03% 0.18206 151.71)",
      chart2: "oklch(61.32% 0.22941 291.74)",
      chart3: "oklch(80.77% 0.10349 19.57)",
      chart4: "oklch(66.91% 0.15686 260.11)",
      chart5: "oklch(70.58% 0 0)",
      sidebar: "oklch(20.11% 0.00394 286.04)",
      sidebarForeground: "oklch(95.51% 0 0)",
      sidebarPrimary: "oklch(61.32% 0.22941 291.74)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(29.4% 0.01301 272.93)",
      sidebarAccentForeground: "oklch(61.32% 0.22941 291.74)",
      sidebarBorder: "oklch(32.89% 0.00922 268.38)",
      sidebarRing: "oklch(61.32% 0.22941 291.74)",
    },
  },
  {
    name: "T3 Chat",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "0.5rem",
    light: {
      background: "oklch(97.54% 0.00844 325.64)",
      foreground: "oklch(32.57% 0.11612 325.04)",
      card: "oklch(97.54% 0.00844 325.64)",
      cardForeground: "oklch(32.57% 0.11612 325.04)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(32.57% 0.11612 325.04)",
      primary: "oklch(53.16% 0.14089 355.2)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(86.96% 0.06751 334.9)",
      secondaryForeground: "oklch(44.48% 0.13406 324.8)",
      muted: "oklch(93.95% 0.02604 331.55)",
      mutedForeground: "oklch(49.24% 0.12445 324.45)",
      accent: "oklch(86.96% 0.06751 334.9)",
      accentForeground: "oklch(44.48% 0.13406 324.8)",
      destructive: "oklch(52.48% 0.13678 20.83)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(85.68% 0.08288 328.91)",
      input: "oklch(85.17% 0.05582 336.6)",
      ring: "oklch(59.16% 0.21798 0.58)",
      chart1: "oklch(60.38% 0.23628 344.47)",
      chart2: "oklch(44.45% 0.22507 300.62)",
      chart3: "oklch(37.9% 0.04376 226.15)",
      chart4: "oklch(83.3% 0.11852 88.35)",
      chart5: "oklch(78.43% 0.12563 59)",
      sidebar: "oklch(93.6% 0.02881 320.58)",
      sidebarForeground: "oklch(49.48% 0.19094 354.54)",
      sidebarPrimary: "oklch(39.63% 0.02513 285.2)",
      sidebarPrimaryForeground: "oklch(96.68% 0.01243 337.52)",
      sidebarAccent: "oklch(97.89% 0.00132 106.42)",
      sidebarAccentForeground: "oklch(39.63% 0.02513 285.2)",
      sidebarBorder: "oklch(93.83% 0.00255 48.72)",
      sidebarRing: "oklch(59.16% 0.21798 0.58)",
    },
    dark: {
      background: "oklch(24.09% 0.0201 307.53)",
      foreground: "oklch(83.98% 0.03874 309.54)",
      card: "oklch(28.03% 0.02323 307.54)",
      cardForeground: "oklch(84.56% 0.03016 341.46)",
      popover: "oklch(15.48% 0.01316 338.9)",
      popoverForeground: "oklch(96.47% 0.00914 341.8)",
      primary: "oklch(46.07% 0.18535 4.1)",
      primaryForeground: "oklch(85.6% 0.06185 346.37)",
      secondary: "oklch(31.37% 0.03057 310.06)",
      secondaryForeground: "oklch(84.83% 0.03825 307.96)",
      muted: "oklch(26.34% 0.02189 309.47)",
      mutedForeground: "oklch(79.4% 0.0372 307.1)",
      accent: "oklch(36.49% 0.05079 308.49)",
      accentForeground: "oklch(96.47% 0.00914 341.8)",
      destructive: "oklch(22.58% 0.05243 12.61)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(32.86% 0.01535 343.45)",
      input: "oklch(33.87% 0.0195 332.83)",
      ring: "oklch(59.16% 0.21798 0.58)",
      chart1: "oklch(53.16% 0.14089 355.2)",
      chart2: "oklch(56.33% 0.19123 306.86)",
      chart3: "oklch(72.27% 0.1502 60.58)",
      chart4: "oklch(61.93% 0.20294 312.74)",
      chart5: "oklch(61.18% 0.2093 6.14)",
      sidebar: "oklch(18.93% 0.01632 331.05)",
      sidebarForeground: "oklch(86.07% 0.02927 343.66)",
      sidebarPrimary: "oklch(48.82% 0.21717 264.38)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(23.37% 0.02608 338.2)",
      sidebarAccentForeground: "oklch(96.74% 0.00133 286.38)",
      sidebarBorder: "oklch(0% 0 0)",
      sidebarRing: "oklch(59.16% 0.21798 0.58)",
    },
  },
]

/**
 * Seed the theme presets and point `siteSettings.activeTheme` at one.
 *
 * Run from terminal:
 *   npx convex run seed:themes
 *   npx convex run seed:themes '{"activate":"Violet Bloom"}'
 *
 * Requires `seed:init` to have run first — that is what creates the
 * siteSettings global. Safe to run repeatedly: existing themes are skipped by
 * name, and only the active reference is rewritten. `adminTheme` is left alone,
 * so the admin panel keeps following the site theme unless you set it by hand.
 *
 * @param activate - Theme name to set active. Defaults to "Stark × Ember".
 */
export const themes = mutation({
  args: {},
  handler: async (ctx, args: { activate?: string }) => {
    const created: string[] = []
    const skipped: string[] = []

    for (const preset of THEME_PRESETS) {
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_name", (q) => q.eq("name", preset.name))
        .first()
      if (existing) {
        skipped.push(preset.name)
      } else {
        await ctx.db.insert("themes", preset)
        created.push(preset.name)
      }
    }

    const activateName = args.activate ?? "Stark × Ember"
    const target = await ctx.db
      .query("themes")
      .withIndex("by_name", (q) => q.eq("name", activateName))
      .first()
    if (!target) {
      throw new Error(
        `No theme named "${activateName}". Seeded: ${THEME_PRESETS.map((p) => p.name).join(", ")}.`
      )
    }

    const settings = await ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", GLOBAL_SLUG_SITE_SETTINGS))
      .first()
    if (!settings) {
      throw new Error("siteSettings global not found — run 'npx convex run seed:init' first.")
    }
    await ctx.db.patch(settings._id, {
      data: { ...(settings.data ?? {}), activeTheme: [target._id] },
    })

    return {
      created,
      skipped,
      active: activateName,
      note: "Reload the app — both site and admin follow siteSettings.activeTheme.",
    }
  },
})
```

#### Manual acceptance script

This is the deliverable's real acceptance test.

```bash
pnpm dev:vex     # terminal 1 — regenerates schema, deploys it, runs convex dev
pnpm dev:app     # terminal 2 — Next on :3020
cd apps/www && npx convex run seed:init && npx convex run seed:themes
```

`seed:themes` returns `{ created: [4 names], active: "Stark × Ember" }`.

**1 — nothing changed.** Reload `http://localhost:3020` and `/admin`. Both look
exactly as before: Stark × Ember is lifted verbatim from `globals.css`, so
activating it is a visual no-op. That is the control — if anything moved here,
`ThemeStyle`'s token map disagrees with `globals.css`.

**2 — the field renders.** `/admin/themes` → edit "Stark × Ember". **Light Mode**
and **Dark Mode** groups, 32 swatch-plus-mono-input rows each, every value an
`oklch(...)` string.

**3 — the picker round-trips.** Click a swatch: the popover opens **on that
colour**, not black. That is `parseColor` handling `oklch` — the path master's
implementation got wrong. Change Light Mode → Primary to something loud. Save.

**4 — site and admin both change.** Reload the public site: buttons, links and
focus rings take the new primary. Reload `/admin`: **the admin panel changes
too.** That is decision 12 — the theme owns the whole token set, so it can own
the whole document.

**5 — saving is idempotent.** Save again without edits. The stored string is
unchanged — Step 2's round-trip exactness holding through Convex.

**6 — switching themes.** `/admin/globals/siteSettings` → set **Active Theme** to
"Violet Bloom" → save → reload. Site and admin both go purple, and
`--radius: 1.4rem` visibly rounds every card.

**7 — the admin opts out.** Set **Admin Theme** to "Stark × Ember", leaving
Active Theme on "Violet Bloom". Reload: the site stays purple, the admin returns
to ember. That is `:root:root` outranking `:root`. Clear Admin Theme and the
admin follows the site again.

**8 — dark mode.** Toggle it. Both surfaces use the Dark Mode group, and the
admin override still wins — `.dark:root:root` (0,3,0) over `.dark` (0,1,0).

**9 — the theme tab (optional).** Temporarily set `themeColors: true` on one
colour field. Reopen its picker: a **Theme** tab lists the live `--*` tokens with
split light/dark swatches, and selecting one stores `var(--token)`. Revert before
committing — decision 20.

**10 — validation.** Type `nope` into a colour field and save. The form reports
`Enter a colour, e.g. oklch(65.73% 0.17941 40.85).` and does not write.

#### .changeset/color-field.md

New file.

```md
---
"@vexcms/core": minor
"@vexcms/react": minor
---

Add the `color()` field. Stores a CSS colour string as `v.string()`, with a
swatch picker in the admin form and a swatch cell in the list view.

`format: "hex" | "rgb" | "hsl" | "oklch"` (default `"hex"`) selects the notation
the picker writes; validation accepts all four, so changing `format` never
invalidates existing documents.

`color({ themeColors: true })` adds a picker tab listing the host application's
CSS custom properties; selecting one stores `var(--token)`, so the colour
follows the active colour scheme.

`@vexcms/core` now exports `serializeColor`, `parseColor` and `ColorValue` — a
dependency-free conversion layer over hex, `rgb()`, `hsl()` and `oklch()`,
round-trip exact across the 8-bit sRGB space.

`@vexcms/react` components now use only shadcn's 32 design tokens. The
non-standard `--primary-hover`, `--muted-foreground-subtle` and `--warning`
tokens are replaced by `primary/90`, `muted-foreground` and `destructive`; the
other thirteen were unused and are removed. Host apps whose stylesheets declared
them can delete them.

Field-type dispatch is now exhaustive: `adminFieldToValidator`,
`adminFieldToInputSchema` and `getCollectionColumnDefs` assert their switches
against `never`.
```

## Verification

- `pnpm build` — **10/10**, including `www#build`'s full Next production build
- `pnpm typecheck` — **14/14**
- `pnpm test` — 933 baseline + 30 core (11 `convert`, 3 `config`, 5 `validator`,
  11 `inputSchema`) + 11 React (4 parity, 7 `themeTokens`) = **974**
- `git diff packages/react/package.json pnpm-workspace.yaml` — **empty**
- No residual references to the 16 deleted tokens (Step 0's grep)
- Step 1's negative test executed and reverted — six named failures
- Step 7's ten-point manual script passes end to end
