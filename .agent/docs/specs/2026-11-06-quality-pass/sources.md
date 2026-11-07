# Normative Sources — Quality Pass (2026-11-06)

All sources below were fetched live on 2026-11-06. Versions/URLs are the canonical ones returned by the fetch; do not substitute newer/older versions without re-fetching and updating this file.

---

## 1. WCAG 2.2 — W3C Recommendation

- **Version:** W3C Recommendation, 12 December 2024
- **Canonical URL:** https://www.w3.org/TR/WCAG22/ → resolves to https://www.w3.org/TR/2024/REC-WCAG22-20241212/
- **Quick reference (levels/techniques) fetched from:** https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2
- **Fetch date:** 2026-11-06

### Level A + AA Success Criteria (+ 2.4.13 AAA per spec requirement)

Test method legend: **auto** = axe-core/Lighthouse automatable; **partial** = tool flags candidates, human judgment required; **manual** = no reliable automated test.

| # | Name | Level | Testable requirement (one line) | Test method |
|---|------|-------|----------------------------------|--------------|
| 1.1.1 | Non-text Content | A | Every non-text content item (img, icon, control) has a text alternative serving the same purpose, or is marked decorative. | partial |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | Prerecorded audio-only has a transcript; prerecorded video-only has a transcript or audio track. | manual |
| 1.2.2 | Captions (Prerecorded) | A | Prerecorded synchronized media with audio has captions. | manual |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | Prerecorded video has audio description or a full text/media alternative. | manual |
| 1.2.4 | Captions (Live) | AA | Live synchronized media with audio has captions. | manual |
| 1.2.5 | Audio Description (Prerecorded) | AA | Prerecorded video content has audio description. | manual |
| 1.3.1 | Info and Relationships | A | Structure/relationships conveyed visually (headings, lists, tables, labels) are also exposed programmatically. | partial |
| 1.3.2 | Meaningful Sequence | A | DOM/reading order matches the meaningful visual order. | manual |
| 1.3.3 | Sensory Characteristics | A | Instructions do not rely solely on shape, color, size, position, or sound to identify content. | manual |
| 1.3.4 | Orientation | AA | Content is not restricted to a single display orientation (portrait/landscape) unless essential. | manual |
| 1.3.5 | Identify Input Purpose | AA | Input fields collecting user info use correct `autocomplete` tokens matching their purpose. | auto |
| 1.4.1 | Use of Color | A | Color is not the only means of conveying information, a state, or a prompt. | manual |
| 1.4.2 | Audio Control | A | Auto-playing audio >3s has a pause/stop/volume control independent of system volume. | manual |
| 1.4.3 | Contrast (Minimum) | AA | Text/images-of-text have ≥4.5:1 contrast (≥3:1 for large text), except logos/incidental/disabled text. | auto |
| 1.4.4 | Resize Text | AA | Text can be resized to 200% via browser zoom without loss of content or functionality. | partial |
| 1.4.5 | Images of Text | AA | Text is used instead of images of text except logos or where customizable/essential. | manual |
| 1.4.10 | Reflow | AA | Content reflows to a single column at 320px CSS width / 400% zoom without horizontal scroll (except data tables/maps). | partial |
| 1.4.11 | Non-text Contrast | AA | UI component boundaries/states and meaningful graphics have ≥3:1 contrast against adjacent colors. | auto |
| 1.4.12 | Text Spacing | AA | No loss of content/functionality when line-height ≥1.5x, paragraph spacing ≥2x, letter spacing ≥0.12x, word spacing ≥0.16x font size are applied. | partial |
| 1.4.13 | Content on Hover or Focus | AA | Additional content shown on hover/focus is dismissable, hoverable, and persistent until dismissed/invalid. | manual |
| 2.1.1 | Keyboard | A | All functionality is operable via keyboard alone, without specific per-keystroke timing. | partial |
| 2.1.2 | No Keyboard Trap | A | Keyboard focus can always move away from any component using only the keyboard. | partial |
| 2.1.4 | Character Key Shortcuts | A | Single-character key shortcuts can be turned off, remapped, or are only active on focus. | manual |
| 2.2.1 | Timing Adjustable | A | Any content time limit can be turned off, adjusted, or extended by the user (with documented exceptions). | manual |
| 2.2.2 | Pause, Stop, Hide | A | Moving/blinking/scrolling/auto-updating content >5s has a mechanism to pause, stop, or hide it. | manual |
| 2.3.1 | Three Flashes or Below Threshold | A | Nothing flashes more than 3 times per second, or flashes are below general/red flash thresholds. | manual |
| 2.4.1 | Bypass Blocks | A | A skip link or landmark structure lets users bypass repeated blocks of content. | auto |
| 2.4.2 | Page Titled | A | Every page has a `<title>` describing its topic or purpose. | auto |
| 2.4.3 | Focus Order | A | Focus order follows a sequence that preserves meaning and operability. | manual |
| 2.4.4 | Link Purpose (In Context) | A | Link purpose is determinable from link text alone or link text + programmatic context. | partial |
| 2.4.5 | Multiple Ways | AA | More than one way exists to locate a page within a set (nav, search, sitemap), except for process steps. | manual |
| 2.4.6 | Headings and Labels | AA | Headings and labels describe the topic or purpose of the section/control. | manual |
| 2.4.7 | Focus Visible | AA | Any keyboard-operable UI has a visible focus indicator mode. | auto |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | The focused component is not entirely hidden by author-created content (e.g. sticky headers). | partial |
| 2.5.1 | Pointer Gestures | A | Multipoint/path-based gestures have a single-pointer alternative, unless essential. | manual |
| 2.5.2 | Pointer Cancellation | A | Down-event does not execute the function; up-event triggers it, with abort/undo or essential-exception. | manual |
| 2.5.3 | Label in Name | A | The visible label text is contained within (or matches) the accessible name. | auto |
| 2.5.4 | Motion Actuation | A | Functions triggered by device motion also have a conventional UI alternative and can be disabled. | manual |
| 2.5.7 | Dragging Movements | AA | Any drag-based function has a single-pointer alternative that doesn't require dragging, unless essential. | manual |
| 2.5.8 | Target Size (Minimum) | AA | Pointer targets are ≥24×24 CSS px, or have sufficient spacing/exceptions (inline, essential, equivalent). | auto |
| 3.1.1 | Language of Page | A | The default human language of the page is set via `html[lang]`. | auto |
| 3.1.2 | Language of Parts | AA | Passages/phrases in a different language than the page default have `lang` set, except proper names/technical terms. | partial |
| 3.2.1 | On Focus | A | Receiving focus on a component does not trigger a context change. | manual |
| 3.2.2 | On Input | A | Changing a component's setting does not automatically trigger a context change unless advised beforehand. | manual |
| 3.2.3 | Consistent Navigation | AA | Repeated navigation mechanisms occur in the same relative order across pages. | manual |
| 3.2.4 | Consistent Identification | AA | Components with the same functionality are identified consistently across pages. | manual |
| 3.2.6 | Consistent Help | A | Help mechanisms (contact, chat, FAQ) occur in the same relative order across pages where present. | manual |
| 3.3.1 | Error Identification | A | Automatically detected input errors are identified and described to the user in text. | partial |
| 3.3.2 | Labels or Instructions | A | Form inputs requiring user input have labels or instructions. | auto |
| 3.3.3 | Error Suggestion | AA | When input errors are detected and suggestions are known, suggestions are provided, unless that would compromise security/purpose. | partial |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | For legal/financial/data-modifying submissions: submissions are reversible, checked and correctable, or confirmed before finalizing. | manual |
| 3.3.7 | Redundant Entry | A | Information the user already entered earlier in the same process is auto-populated or available to select, unless re-entry is essential. | manual |
| 3.3.8 | Accessible Authentication (Minimum) | AA | Authentication does not require a cognitive function test unless an alternative method, mechanism, or object-recognition/personal-content assist is available. | manual |
| 4.1.1 | Parsing | — | **Obsolete/removed in WCAG 2.2** — always satisfied; not evaluated. Superseded by robust HTML parsing requirements implicit in 4.1.2 and HTML conformance. | n/a |
| 4.1.2 | Name, Role, Value | A | For all UI components, name and role are programmatically determinable, and states/properties/values can be set and are exposed to assistive tech. | auto |
| 4.1.3 | Status Messages | AA | Status messages can be programmatically determined (e.g. via role="status"/"alert"/aria-live) without requiring focus. | partial |

### AAA criterion required by the audit scope

| # | Name | Level | Testable requirement (one line) | Test method |
|---|------|-------|----------------------------------|--------------|
| 2.4.13 | Focus Appearance | AAA | The focus indicator area is ≥2 CSS px perimeter thick, has ≥3:1 contrast against adjacent colors, and is not entirely hidden by other content. | auto |

---

## 2. WAI-ARIA 1.2 + ARIA Authoring Practices Guide (APG)

- **Canonical URL:** https://www.w3.org/WAI/ARIA/apg/patterns/
- **Fetch date:** 2026-11-06

### Dialog (Modal)
- Roles/states: container `role="dialog"`, `aria-modal="true"`, labelled via `aria-labelledby` or `aria-label`; optional `aria-describedby`.
- Keyboard: focus moves into dialog on open; `Tab`/`Shift+Tab` cycle within dialog only; `Escape` closes; focus returns to invoker on close.
- Must include a visible focusable close control.

### Alert Dialog
- Role: `alertdialog` (special-case modal), `aria-modal="true"`, labelled + `aria-describedby` pointing at the alert message (required, unlike plain dialog).
- Keyboard: same as modal dialog.

### Menu Button / Menu
- Button: `role="button"`, `aria-haspopup="menu"` (or `true`), `aria-expanded` true/false, optional `aria-controls` → menu element (`role="menu"`).
- Keyboard: `Enter`/`Space` open menu + focus first item; optional `Down/Up Arrow` open + focus first/last item.

### Combobox
- Roles: input has `role="combobox"`, `aria-expanded`, `aria-controls` → popup (`listbox`/`grid`/`tree`/`dialog`), `aria-autocomplete` (none/list/both), `aria-activedescendant` for popup focus tracking; selected option gets `aria-selected="true"`.
- Keyboard: `Down Arrow` opens/moves into popup; `Escape` closes; `Enter` accepts selection; arrow keys navigate popup while DOM focus stays on combobox (activedescendant pattern).

### Listbox
- Roles: container `role="listbox"` (labelled), each option `role="option"`; `aria-multiselectable` if multi-select; `aria-selected`/`aria-checked` for state (not both).
- Keyboard: `Up/Down Arrow` move focus (optionally selection follows focus); `Home/End` jump to first/last; `Space`/modifier-key combos for multi-select; type-ahead.

### Tabs
- Roles: `tablist` container, each tab `role="tab"` with `aria-selected` and `aria-controls` → its `tabpanel`; each panel `role="tabpanel"` with `aria-labelledby` → its tab.
- Keyboard: `Left/Right Arrow` move between tabs (wrap); `Tab` enters/exits tablist; `Space`/`Enter` activates if not auto-activated on focus; optional `Home`/`End`.

### Disclosure
- Roles: control is `role="button"` with `aria-expanded` true/false; optional `aria-controls` → content region.
- Keyboard: `Enter`/`Space` toggles visibility.

### Accordion
- Roles: each header's button wrapped in a `heading` element (native `<h*>` preferred) with `aria-level`; button has `aria-expanded`, `aria-controls` → panel; panel optionally `role="region"` + `aria-labelledby` (avoid region proliferation beyond ~6 panels).
- Keyboard: `Enter`/`Space` expands/collapses; `Tab`/`Shift+Tab` move through all focusable elements normally (no dedicated arrow-key model required).

### Toolbar
- Roles: container `role="toolbar"`, labelled via `aria-labelledby`/`aria-label`; `aria-orientation` if vertical. Use only when grouping 3+ controls.
- Keyboard: `Tab`/`Shift+Tab` enter/exit toolbar as one stop; arrow keys move focus among contained controls (horizontal: Left/Right; vertical: Up/Down); optional `Home`/`End`.

### Grid (interactive tabular data / layout container)
- Roles: container `role="grid"`; rows `role="row"`; cells `role="columnheader"`/`rowheader`/`gridcell"`; labelled via `aria-labelledby`/`aria-label`; `aria-sort` on sortable headers; `aria-selected` for selection; `aria-rowcount`/`aria-colcount`/`aria-rowindex`/`aria-colindex` when virtualized.
- Keyboard: arrow keys move focus cell-to-cell (no wrap for data grids); `Home`/`End`/`Ctrl+Home`/`Ctrl+End`; `Page Up`/`Page Down`; `Enter`/`F2` enter cell-edit mode, `Escape` restores grid navigation.

### Table (static, non-interactive)
- Roles: `role="table"`, rows `role="row"`, cells `columnheader`/`rowheader`/`cell`; labelled via `aria-labelledby`/`aria-label`; `aria-sort` on sortable headers.
- Keyboard: not applicable (not a widget) — prefer native `<table>`.

### Tooltip
- Roles: `role="tooltip"` on the popup; trigger references it via `aria-describedby`. Tooltip never receives focus.
- Keyboard: `Escape` dismisses; shown on focus (dismissed on blur) or hover (persists while hovering trigger or tooltip).

### Breadcrumb
- Roles: trail wrapped in a `nav` landmark labelled via `aria-label`/`aria-labelledby`; current-page link has `aria-current="page"`.
- Keyboard: not applicable (plain links).

### Switch
- Roles: `role="switch"`, labelled via visible text/`aria-labelledby`/`aria-label`; `aria-checked` true/false (native `input[type=checkbox]` uses `checked` attribute instead); group via `role="group"` + `aria-labelledby` or `fieldset`/`legend`. Label text must never change with state.
- Keyboard: `Space` toggles; optional `Enter`.

### Checkbox
- Roles: `role="checkbox"`, labelled; `aria-checked` true/false/mixed (tri-state); grouped via `role="group"` + `aria-labelledby`.
- Keyboard: `Space` toggles.

### Radio Group
- Roles: group `role="radiogroup"` (labelled), each button `role="radio"` with `aria-checked`.
- Keyboard: `Tab`/`Shift+Tab` enter/exit group (focus lands on checked button, or first if none checked); `Space` checks focused button; `Left/Up` and `Right/Down Arrow` move focus AND change selection, wrapping at ends. (Inside a toolbar, arrow keys move focus without changing selection; `Space`/`Enter` select.)

---

## 3. WHATWG HTML Living Standard + Nu Html Checker (vnu)

- **HTML spec:** https://html.spec.whatwg.org/multipage/ (WHATWG Living Standard, continuously updated)
- **Validator:** https://validator.w3.org/nu/ (web UI); CLI via `vnu.jar` or npm `vnu-jar`
- **`vnu-jar` npm package version:** 26.11.4 (fetched 2026-11-06 from https://www.npmjs.com/package/vnu-jar)
- **CLI manual fetched from:** https://github.com/validator/validator/blob/main/docs/vnu.1.md
- **Fetch date:** 2026-11-06

### Running vnu against local HTML
```bash
# via npm-installed jar
npx vnu-jar --skip-non-html --also-check-css path/to/dist

# via raw jar (Java 17+)
java -jar vnu.jar --skip-non-html --exit-zero-always dist/
```

### Key CLI flags
| Flag | Effect |
|---|---|
| `--errors-only` | report only errors, suppress warnings/info |
| `--skip-info-messages` | suppress info messages, keep errors/warnings |
| `--Werror` | exit non-zero on warnings too (default: only errors cause non-zero exit) |
| `--exit-zero-always` | always exit 0 regardless of findings (use with `--format json` for CI parsing) |
| `--stdout` | report to stdout instead of stderr |
| `--format gnu\|xml\|json\|text` | output format (default `gnu`) |
| `--filterfile FILE` / `--filterpattern REGEXP` | suppress messages matching regex(es) |
| `--skip-non-html` | only check `.html/.htm/.xhtml/.xht`, skip other extensions found in a directory |
| `--also-check-css` / `--also-check-svg` | additionally validate `.css`/`.svg` files found alongside HTML |
| `--no-langdetect` | disable `html[lang]` mismatch detection |
| `FILES\|DIRECTORY\|URL` | accepts explicit files, a directory (recursive), or a live URL |

---

## 4. Core Web Vitals, Lighthouse, Lighthouse CI

- **Core Web Vitals thresholds:** https://web.dev/articles/vitals (last updated 2024-10-31; fetched 2026-11-06, content unchanged at fetch time)
- **Lighthouse CI config docs:** https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md (fetched 2026-11-06)
- **Fetch date:** 2026-11-06

### Core Web Vitals "good" thresholds (75th percentile of page loads, mobile+desktop segmented)
| Metric | Good threshold (p75) | Field/Lab |
|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5 s | Field + Lab |
| INP (Interaction to Next Paint) | ≤ 200 ms | Field only — **not lab-measurable** (no real user input in a simulated Lighthouse run) |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | Field + Lab |

**Lab proxy for INP:** Total Blocking Time (TBT) is the Lighthouse lab-measurable proxy; Lighthouse documents TBT explicitly as the stand-in because INP requires real user interaction.

### Lighthouse categories
`performance`, `accessibility`, `best-practices`, `seo` (PWA category retired from stable Lighthouse CLI output as of recent versions — treat `performance`/`accessibility`/`best-practices`/`seo` as the four audited categories).

### Lighthouse CI (`lhci`) config format
Config file candidates (priority order): `.lighthouserc.js`, `lighthouserc.js`, `.lighthouserc.cjs`, `lighthouserc.cjs`, `.lighthouserc.json`, `lighthouserc.json`, `.lighthouserc.yml`, `lighthouserc.yml`, `.lighthouserc.yaml`, `lighthouserc.yaml`.

```js
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist', // or url: [...], startServerCommand
      numberOfRuns: 3,
      settings: { preset: 'desktop' }, // or mobile (default throttling preset)
    },
    assert: {
      preset: 'lighthouse:recommended', // or 'lighthouse:no-pwa'
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:performance': ['warn', { minScore: 0.9 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```
- `assert.assertions` keys are Lighthouse audit IDs; values are `[severity, {minScore|maxNumericValue, aggregationMethod}]` where severity is `off`/`warn`/`error`.
- `collect.settings.preset` controls device emulation; `mobile` is Lighthouse's default throttling/viewport preset, `desktop` is the alternative.
- CLI flags override config: `lhci assert --preset=lighthouse:recommended --assertions.uses-webp-images=off`.

---

## 5. Media Queries Level 5

- **Canonical URL:** https://www.w3.org/TR/mediaqueries-5/ → resolved to https://www.w3.org/TR/2026/WD-mediaqueries-5-20260219/ (W3C Working Draft)
- **Fetch date:** 2026-11-06

| Feature | What it needs from us |
|---|---|
| `prefers-reduced-motion: reduce` | Any non-essential animation/transition/parallax/autoplay must be disabled or substantially reduced when this media feature matches; provide a `no-preference`/`reduce` CSS branch (or JS `matchMedia` check) rather than assuming motion is always acceptable. |
| `prefers-color-scheme: dark \| light` | UI must render correctly and maintain WCAG 1.4.3/1.4.11 contrast in both the `light` and `dark` branches if the app offers/respects theme switching; do not hardcode colors that only work in one scheme if the site claims to support the other. |
| `forced-colors: active` | When the OS forced-colors (high-contrast) mode is active, UI must remain usable: do not rely on background-image/box-shadow/custom colors for meaning-bearing UI since forced-colors overrides most author colors — use `forced-color-adjust` and system colors (e.g. `CanvasText`, `Highlight`) deliberately, and verify focus indicators/borders survive the override. |

---

## 6. `@axe-core/playwright` and `eslint-plugin-jsx-a11y`

- **Fetch date:** 2026-11-06 (npm registry)

### `@axe-core/playwright`
- **Latest version:** 4.14.0 (depends on `axe-core ~4.14.0`)
- **npm:** https://www.npmjs.com/package/@axe-core/playwright
- **Repo:** https://github.com/dequelabs/axe-core-npm
- **Usage pattern:**
```ts
import { AxeBuilder } from '@axe-core/playwright';

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  .analyze();

expect(results.violations).toEqual([]);
```
- `withTags([...])` filters axe-core's rule set to only rules tagged with the given WCAG conformance tags; `wcag22aa` requires axe-core ≥4.8 (satisfied by 4.14.0 dependency pinned above).
- Other builder methods available: `.include(selector)`, `.exclude(selector)`, `.disableRules([...])`, `.options({...})`.

### `eslint-plugin-jsx-a11y`
- **Latest version:** 6.10.2
- **npm:** https://www.npmjs.com/package/eslint-plugin-jsx-a11y
- **Repo:** https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
- **Flat-config usage:**
```js
// eslint.config.js
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
];
```
- The package ships `jsxA11y.flatConfigs.recommended` and `jsxA11y.flatConfigs.strict` ready-made flat-config objects (spread `.rules`, or spread the whole config object directly into the array) — no legacy `extends` string needed under flat config.

---

## 7. Security Headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

- **Source:** OWASP HTTP Security Response Headers Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- **Next.js config source:** https://nextjs.org/docs/app/api-reference/config/next-config-js/headers (last updated 2026-06-30 per page metadata)
- **Fetch date:** 2026-11-06

### Recommended static values (no nonce — matches "static CSP" requirement)
| Header | Recommended value | Notes |
|---|---|---|
| `Content-Security-Policy` | App-specific allowlist, e.g. `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | Static policy avoids `'unsafe-inline'`/`'unsafe-eval'`; use `frame-ancestors 'none'` instead of (or in addition to) `X-Frame-Options`. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | 2-year max-age; verify HSTS-preload eligibility at hstspreload.org before adding `preload`. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing; must pair with correct `Content-Type` on every response. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Matches modern browser default; set explicitly rather than relying on default. |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` (extend with any other unused features) | Explicitly denies browser features the app does not use. |

Additional headers OWASP also recommends setting alongside the above (not explicitly requested but adjacent): `X-Frame-Options: DENY` (if not already covered by CSP `frame-ancestors`), `Cross-Origin-Opener-Policy: same-origin`, removing `Server`/`X-Powered-By` fingerprinting headers.

### Setting these in Next.js
Set via `headers()` in `next.config.js`, returning an array of `{ source, headers: [{ key, value }] }` objects:
```js
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'self'; frame-ancestors 'none'; ..." },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
        ],
      },
    ];
  },
};
```
- `headers()` can be sync or async, must resolve to an array of `{source, headers[], has?, missing?, basePath?, locale?}` objects.
- Headers set here are checked before the filesystem (pages, `/public`), and are applied per matched `source` path pattern (supports `:param`, wildcards `*`, and regex groups).
- If two matching rules set the same header key, the later rule in the array wins.
