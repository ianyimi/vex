# Manual Pass Checklist — Quality Pass (Step 9)

Every row tests one WCAG 2.2 success criterion `sources.md` marks `manual` or `partial`,
against one `inventory.md` surface, by a procedure no automated tool in this pass (axe,
Lighthouse, Nu, jsx-a11y) can run. `auto`-method criteria are NOT repeated here — steps 2–8's
tooling already covers them continuously.

## How to run this (developer)

- **VoiceOver, macOS Safari**: `Cmd+F5` toggles VoiceOver (or System Settings → Accessibility →
  VoiceOver). Navigate by heading/form-field with the rotor (`Ctrl+Option+U`); `Ctrl+Option+→/←`
  moves through content, `Ctrl+Option+Space` activates.
- **VoiceOver, iOS Safari**: Settings → Accessibility → VoiceOver → On (or triple-click the side
  button if that shortcut is configured). Swipe right/left to move, double-tap to activate,
  two-finger rotate gesture for the rotor.
- **200% zoom**: `Cmd +` (repeated) in real Safari/Chrome — not a viewport resize — to reach the
  browser's 200% text-zoom level; confirm via the zoom indicator in the address bar / View menu.
- **320 CSS px reflow**: devtools' responsive design mode / device toolbar, width set to exactly
  `320`, page zoom at 100% (this is a VIEWPORT-width test, independent of the 200%-zoom row
  above — WCAG 1.4.10 treats them as the same reflow requirement reached two different ways,
  both are checked).
- **Admin sign-in**: `QUALITY_ADMIN_EMAIL`/`QUALITY_ADMIN_PASSWORD` in `apps/test/.env.local`.

## Columns

`ID` — sequential `M-001…`, stable once assigned. `Criterion` — the `sources.md` §1 number(s).
`Surface` — the `inventory.md` route/view/component; `site-wide` for cross-page criteria.
`Procedure` — exact steps, prefixed `Agent (browser tool):` or `Human:`. `Expected` — the pass
condition. `Pre-run` — `agent`: executed this pass with the `browser` tool, `Result` filled
below. `human`: the developer runs it and records the result — VoiceOver, real browser zoom,
and keyboard-flow sign-off cannot be driven by the `browser` tool's synthetic input, so every
such row is `human` and left `PENDING`. `Result` — `pass` | `N/A — <reason>` | `PENDING` |
`→ F-xxx` (failed; see `findings.md`).

## Generation procedure

1. Filter `sources.md` §1's two tables to `Test method` ∈ {`manual`, `partial`}: 31 `manual` +
   13 `partial` = 44 criteria.
2. Bucket each criterion by applicability: **flow-level** (2.1.1, 2.1.2, 2.4.3, 3.2.1, 3.2.2) →
   § A, one pass per named user flow; **AT-level** (1.1.1, 1.3.1, 2.4.4, 2.4.6, 3.3.1, 4.1.3) →
   § B, the same flows under a real screen reader; **scale-level** (1.4.4, 1.4.10, 1.4.12) → § C,
   one row per distinct page/view template plus a bulk agent pre-check; **theme-level** (1.4.1,
   plus 1.4.3/1.4.11 re-checked outside the light/dark pair steps 6–7 already ran) → § D;
   **everything else** (the remaining 20 criteria: media, timing, motion, pointer, consistency,
   forms/auth) → § E, one row per criterion against its actual trigger surface, or one cited
   `N/A` row when no trigger exists yet.
3. One row per (criterion-group, surface) pair, `ID`s in file order A → E.
4. When `inventory.md` adds a surface a bucket doesn't have a row for, add rows using the same
   pattern and continue the `ID` sequence — never renumber existing rows.
5. Re-run only the specific row(s) a fix touches; flip `Result` to `pass`.

Surfaces below reflect the current tree: `apps/www/e2e/routes.ts`'s `QUALITY_ROUTES` (`/`,
`/features`, `/roadmap`, `/privacy`, `/brand`, `/accessibility`, `/launch-week` and 4
`/posts/[slug]` as `draft`, `/tour`, `/auth/sign-in`, `/auth/sign-up`, a guaranteed 404, and
`/unauthorized`) and `inventory.md` §B's admin view list. `/launch/*.mp4` (launch-kit-final-review)
still doesn't exist — § E's media rows stay `N/A — pending`.

## A. Keyboard-only — every flow

2.1.1/2.1.2 (operability + no trap) are `agent` pre-run, re-executed this pass against the live
servers. 2.4.3/3.2.1/3.2.2 need a human judging whether tab order "preserves meaning" and
whether a context change was "unexpected" — `human`.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-001 | 2.1.1, 2.1.2 | Sign in (`/auth/sign-in` standalone; dialog variant fixed by F-096/F-097) | Agent: Tab-only through email, password, submit, sign-up link | Every control reachable/operable; order cycles back to the top with no trap | agent | pass — confirmed live: email → "Forgot your password?" → password → Login → Sign Up → wraps, no trap |
| M-002 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm tab order matches the visual layout; focusing a field never navigates away; submitting never changes context without the "Login" activation | Order matches layout; no focus/input-triggered context change | human | PENDING |
| M-003 | 2.1.1, 2.1.2 | Create/edit/publish (`CollectionEditView.tsx` sticky actions, actions menu, unsaved-changes dialog, status badge, publish) | Agent: Tab-only create/edit a document, trigger the unsaved-changes dialog by editing then navigating away via "Home" | Dialog opens, traps Tab, and Stay/Leave/Escape all close it | agent | pass — QP-3 sweep (trusted input): the unsaved-changes `alertdialog` traps Tab (Leave/Stay only) and Stay closes without navigating. The F-105 report came from synthetic events and is `n/a` |
| M-004 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm order through sticky header → actions menu → status badge → form fields matches layout, and that the unsaved-changes dialog closes with Stay, Leave and Escape | Order matches layout; no surprise state change on focus/input | human | PENDING |
| M-005 | 2.1.1, 2.1.2 | Media upload (`MediaUploadForm.tsx`, `CreateMediaModal.tsx`) | Agent: Tab-only to "+ Upload Image", open the modal, reach the dropzone's click-to-upload control, then close via "Done"/corner "Close"/`Escape` | Upload modal reachable with zero drag input; closes via any of Done, Close, or Escape | agent | pass — re-run with Playwright keyboard/pointer 2026-11-08: opens from the keyboard; Escape and the Close button both close it (F-105 `n/a`) |
| M-006 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm order through staged-file rows → remove buttons → submit matches the visual list | Order matches layout; no unexpected trigger on focus | human | PENDING |
| M-007 | 2.1.1, 2.1.2 | List filters/saved views (`ListViewFilterBuilder`, `SavedListViewTabs`, peek) | Agent: Tab-only open the Filter popover, add a filter, switch a saved-view tab with arrow keys, open peek, `Escape` closes it | All reachable; Filter popover and peek both dismiss via Escape with no trap | agent | pass — re-run 2026-11-08: Enter opens Filter, Escape closes it and returns focus, Tab out closes it; saved-view tabs and peek passed in the QP-3 sweep (F-104 `n/a`) |
| M-008 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm order toolbar → filter builder → saved-view tabs → table → bulk actions matches layout | Order matches layout; no unannounced data loss on focus/input | human | PENDING |
| M-009 | 2.1.1, 2.1.2 | Live preview (edit view's live-preview panel/iframe) | Agent: Tab from the last form field through "Resize panels" → "Preview" (open in new tab) → "Preview width" → the iframe itself, then continue Tabbing | Panel controls reachable; Tab passes through/over the iframe and exits back to the top of the page, no trap | agent | pass — confirmed live: Tab reaches the iframe boundary then continues to wrap back to "Skip to content" with no trap |
| M-010 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm the preview iframe never steals focus from the field being edited; order is form fields then preview controls, not interleaved | Order matches layout; focus stays with the editor until tabbed to preview | human | PENDING |
| M-011 | 2.1.1, 2.1.2 | www navigation (header nav, mobile menu toggle at 390px, footer) | Agent: Tab through header nav at desktop (passes); at 390px, Tab to "Open menu", activate it, then `Escape` and the sheet's own Close control | Desktop nav fully reachable with no trap; the mobile sheet opens via keyboard and closes via Escape or its Close control | agent | pass — desktop order clean (skip link → logo → nav → content); re-run at 375 2026-11-08: "Open menu" opens the sheet, Escape closes it (F-105 `n/a`) |
| M-012 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm nav order matches the visual order at both desktop and 390px, including the mobile menu sheet | Order matches layout at every width; no surprise context change | human | PENDING |

## B. Screen reader — VoiceOver (macOS Safari + iOS Safari)

`human` throughout — no AT driver exists in this harness. Same six flows as § A, each run once
per platform. `Criterion` lists the manual/partial criteria a screen reader pass actually
surfaces (1.1.1, 1.3.1, 2.4.4, 2.4.6, 3.3.1, 4.1.3); `4.1.2` is `auto` (axe, steps 2–8) and isn't
re-listed, though log a normal `findings.md` row against 4.1.2 if VoiceOver surfaces something
axe's simulated DOM read missed.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-013 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Sign in — macOS Safari | Human: VoiceOver on, navigate by heading/form-field rotor through the sign-in form, submit with a deliberately wrong password | Fields announce their label + any error; the error is announced via a live region without moving focus. F-096/F-097 already gave the dialog variant a name and an inert background — re-verify both variants | human | PENDING |
| M-014 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Sign in — iOS Safari | Human: same, iOS rotor/swipe navigation | Same as M-013 | human | PENDING |
| M-015 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Create/edit/publish — macOS Safari | Human: VoiceOver through create → fill with one invalid field → publish, then edit and navigate away to trigger the unsaved-changes dialog | Field errors and publish/save status announced; headings/labels read correctly; the dialog is announced with its title and description | human | PENDING |
| M-016 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Create/edit/publish — iOS Safari | Human: same, iOS VoiceOver | Same as M-015 | human | PENDING |
| M-017 | 1.1.1, 2.4.6, 3.3.1, 4.1.3 | Media upload — macOS Safari | Human: VoiceOver through the keyboard-only upload path (M-005's "Browse" control), including one rejected (wrong MIME) file, then close the modal | Upload progress/errors announced; thumbnails/alt text read meaningfully | human | PENDING |
| M-018 | 1.1.1, 2.4.6, 3.3.1, 4.1.3 | Media upload — iOS Safari | Human: same, iOS VoiceOver | Same as M-017 | human | PENDING |
| M-019 | 1.3.1, 2.4.6, 4.1.3 | List filters/saved views — macOS Safari | Human: VoiceOver through adding a filter and switching a saved-view tab | Filter builder and tabs announce state via structure/`4.1.3` | human | PENDING |
| M-020 | 1.3.1, 2.4.6, 4.1.3 | List filters/saved views — iOS Safari | Human: same, iOS VoiceOver | Same as M-019 | human | PENDING |
| M-021 | 2.4.6, 4.1.3 | Live preview — macOS Safari | Human: VoiceOver while editing a field and watching the preview panel refresh | Refresh/loading state announced without moving focus into the iframe | human | PENDING |
| M-022 | 2.4.6, 4.1.3 | Live preview — iOS Safari | Human: same, iOS VoiceOver | Same as M-021 | human | PENDING |
| M-023 | 1.1.1, 2.4.4, 2.4.6 | www navigation — macOS Safari | Human: VoiceOver through header nav, a block with images, and the footer; at 390px open and close the mobile menu sheet | Images announce meaningful alt text (or silent if decorative); every link's purpose is clear from its own text | human | PENDING |
| M-024 | 1.1.1, 2.4.4, 2.4.6 | www navigation — iOS Safari | Human: same, iOS VoiceOver | Same as M-023 | human | PENDING |

## C. 200% zoom & reflow at 320 CSS px

320 CSS px is NOT in `QUALITY_WIDTHS` (the automated width matrix), so an agent bulk pre-check
extends it; real 200% browser zoom and the text-spacing override are `human`-only.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-025 | 1.4.10 | All 17 `QUALITY_ROUTES` + 5 representative admin views (bulk) | Agent: `browser` tool, viewport 320×800, every route; `document.documentElement.scrollWidth` vs `innerWidth`/`clientWidth` | No horizontal document overflow anywhere (DataTable's own scroll region excepted) | agent | pass — all 17 www routes clean (`/`, `/features`, `/roadmap`, `/privacy`, `/brand`, `/accessibility`, `/launch-week`, the 4 `/posts/*`, `/tour`, `/auth/sign-in`, `/auth/sign-up`, the 404 probe, `/unauthorized`); admin `/admin`, `/admin/collections/posts`, `/admin/collections/images`, `/admin/globals/siteSettings`, `/admin/collections/themes` all clean |
| M-026 | 1.4.4, 1.4.10, 1.4.12 | www marketing pages (home, `/roadmap`, `/privacy`, `/brand`, `/accessibility`, `/launch-week`) | Human: browser zoom to 200%; separately, a text-spacing bookmarklet (line-height 1.5×, paragraph spacing 2×, letter spacing 0.12em, word spacing 0.16em) | No content/functionality lost at 200%; single-column reflow at 320px with no 2-D scroll; text-spacing override causes no clipped/overlapping text | human | PENDING |
| M-027 | 1.4.4, 1.4.10, 1.4.12 | `/posts/[slug]` (announcement + 4 launch-week posts, Plate static renderer) | Human: same as M-026 | Same as M-026, including code blocks/embeds | human | PENDING |
| M-028 | 1.4.4, 1.4.10, 1.4.12 | www auth (`/auth/sign-in`, `/auth/sign-up`) | Human: same as M-026 | Same as M-026 | human | PENDING |
| M-029 | 1.4.4, 1.4.10, 1.4.12 | www 404 / `/unauthorized` | Human: same as M-026 | Same as M-026 | human | PENDING |
| M-030 | 1.4.4, 1.4.10, 1.4.12 | `/tour` | Human: same as M-026 | Same as M-026; screenshots don't force horizontal scroll | human | PENDING |
| M-031 | 1.4.4, 1.4.10, 1.4.12 | Admin list view | Human: same as M-026 | Same as M-026, except the `DataTable`'s own declared horizontal scroll region | human | PENDING |
| M-032 | 1.4.4, 1.4.10, 1.4.12 | Admin edit view (incl. live-preview panel) | Human: same as M-026 | Same as M-026 | human | PENDING |
| M-033 | 1.4.4, 1.4.10, 1.4.12 | Admin media (list/edit/upload, `MediaLibraryGrid`) | Human: same as M-026 | Same as M-026; grid reflows to fewer columns, not horizontal scroll | human | PENDING |
| M-034 | 1.4.4, 1.4.10, 1.4.12 | Admin globals, dashboard, modals | Human: same as M-026 | Same as M-026 | human | PENDING |
| M-035 | 1.4.4, 1.4.10, 1.4.12 | Admin `error.tsx` boundary | Human: same as M-026 | Same as M-026 | human | PENDING |

## D. Contrast — light, dark, database theme

1.4.3/1.4.11 already run continuously in light+dark via `QUALITY_THEMES` in steps 6–7's
Playwright axe — not repeated here. Database themes aren't in `QUALITY_THEMES`, so every row
below is the residual: one seeded non-default database theme, plus 1.4.1 (Use of Color).
Step 6's runtime check (`findings.md` "Step 6 runtime checks") already cycled the admin list
view's dark-mode slug/select cells through all 6 non-default presets while chasing F-089 — a
head start on M-038, not a substitute for it (that pass didn't check light mode, the other six
admin surfaces, or non-text/UI-component contrast specifically).

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-036 | 1.4.3, 1.4.11 | www home, under a seeded non-default theme | Human: set `siteSettings.activeTheme` to a seeded non-default palette, re-check contrast with devtools | ≥4.5:1 text / ≥3:1 large text and UI boundaries, same as the default theme | human | PENDING |
| M-037 | 1.4.3, 1.4.11 | One www marketing page (`/roadmap`), same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-038 | 1.4.3, 1.4.11 | Admin list view, same theme | Human: same as M-036, both light and dark — see this section's note on Step 6's partial head start (dark-mode slug/select cells only) | Same as M-036, including `DataTable` row/selection states | human | PENDING |
| M-039 | 1.4.3, 1.4.11 | Admin edit view, same theme | Human: same as M-036 | Same as M-036, including status badge and sticky header | human | PENDING |
| M-040 | 1.4.3, 1.4.11 | Admin media views, same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-041 | 1.4.3, 1.4.11 | Admin globals/dashboard, same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-042 | 1.4.3, 1.4.11 | Admin modals, same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-043 | 1.4.3, 1.4.11 | `AdminTopNav` breadcrumb overflow, same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-044 | 1.4.1 | www (status/required-field indicators) + admin (status badges, version-diff view) | Human: identify every place state/meaning is conveyed, confirm a non-color cue exists too | No state/meaning relies on color alone | human | PENDING |

## E. Remaining manual criteria — content, timing, pointer, motion, consistency, forms

Every other `sources.md` manual/partial row, against the surface that actually has its trigger
condition. `N/A` rows are code-confirmed absences, not left `PENDING` for rediscovery.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-045 | 1.2.1 | `/launch/*.mp4` (launch-week video) | Agent: confirmed absent (`grep` for `.mp4`/`<video` across `apps/www/src` returns no match) | Transcript/audio-track alternative once the video ships | agent | N/A — pending `2026-11-06-launch-kit-final-review`; no video element in the tree yet |
| M-046 | 1.2.2 | same | same | Captions once the video ships | agent | N/A — pending launch-kit-final-review |
| M-047 | 1.2.3 | same | same | Audio description/full text alternative once the video ships | agent | N/A — pending launch-kit-final-review |
| M-048 | 1.2.4 | site-wide | Agent: confirmed no live synchronized media exists anywhere in the tree | N/A, no live media surface | agent | N/A — no live media surface |
| M-049 | 1.2.5 | `/launch/*.mp4` | same as M-047 | Audio description once the video ships | agent | N/A — pending launch-kit-final-review |
| M-050 | 1.4.2 | `/launch/*.mp4` | Human: confirm pause/stop/volume control independent of system volume if it autoplays with audio, once the video ships | Control present if autoplay-with-audio, else N/A | human | PENDING (pending launch-kit-final-review) |
| M-051 | 1.3.2 | www page templates (marketing, post) | Human: compare DOM order (devtools, no CSS) against rendered visual order | DOM order matches meaningful visual order | human | PENDING |
| M-052 | 1.3.2 | Admin list/edit views | Human: same, toolbar/table and form/sidebar split | DOM order matches meaningful visual order | human | PENDING |
| M-053 | 1.3.3 | www content (instructions, CTAs) | Human: read every instruction/CTA for shape/color/position-only references | None found, or each has a text alternative | human | PENDING |
| M-054 | 1.3.3 | Admin UI copy (toasts, empty states, help text) | Human: same | Same as M-053 | human | PENDING |
| M-055 | 1.3.4 | Both apps, mobile viewport | Human: rotate a mobile device/emulator portrait↔landscape on a www page and an admin edit view | No orientation lock; content usable in both | human | PENDING |
| M-056 | 1.4.5 | www marketing images (hero, blocks) | Human: inspect every marketing image for baked-in text that isn't a logo | No images-of-text except the logo | human | PENDING |
| M-057 | 1.4.13 | `Tooltip` (`packages/react/src/ui/tooltip.tsx`), both apps | Human: trigger by hover and by focus; try moving onto the tooltip; press Escape | Dismissable, hoverable, persists until dismissed/invalid; focus-triggered behaves like hover-triggered | human | PENDING |
| M-058 | 2.2.1 | Better Auth session (`apps/www/convex/auth/options.ts` `emailAndPassword`) | Human: let a session approach expiry; confirm a warning/extend mechanism or simple re-auth with no data loss | Timing adjustable/extendable, or expiry causes no silent data loss | human | PENDING |
| M-059 | 2.2.2 | `TextEffect`/`AnimatedGroup` (`apps/www/src/components/motion-primitives/`) | Human: with `prefers-reduced-motion` off, confirm a pause/stop mechanism independent of the step-4 reduced-motion branch | A pause/stop/hide mechanism exists, or the animation is ≤5s one-shot | human | PENDING |
| M-060 | 2.3.1 | Loading spinners, skeleton pulses, toast animations | Human: visually review every repeating animation for flash rate | Nothing flashes >3×/second | human | PENDING |
| M-061 | 2.4.5 | www, site-wide | Human: confirm ≥2 of {nav, search, sitemap} exist to reach any given page | ≥2 ways to locate a page, except process steps | human | PENDING |
| M-062 | 2.4.11 | www sticky header + admin `AdminTopNav` (`:413` `sticky top-0`), `DataTableHeader.tsx:76`, `MediaCollectionEditView.tsx:185` | Human: Tab to a control that scrolls under each sticky element; confirm it isn't entirely hidden. Related but distinct from F-086 (collapsed-sidebar focus leak, already fixed) | Focused component never fully hidden by sticky content | human | PENDING |
| M-063 | 2.4.11 | Edit-view sticky sidebar (`@3xl/form:sticky`) | Human: same, at the `3xl` container breakpoint | Same as M-062 | human | PENDING |
| M-064 | 2.1.4 | Sidebar toggle (`packages/react/src/ui/sidebar.tsx:58` `SIDEBAR_KEYBOARD_SHORTCUT = "b"`, gated by `event.metaKey \|\| event.ctrlKey`) | Agent: confirmed via code read — no shortcut fires on an unmodified single character anywhere in `packages/react` or `apps/www` | N/A — every shortcut found requires a modifier | agent | N/A — only modifier-combined shortcuts exist (`sidebar.tsx:58`) |
| M-065 | 2.5.1 | `ResizablePanel`/`ResizableHandle`, `DataTable` column resize | Human: confirm resizing is a convenience, not the only path to any layout | Path-based drag has no essential function gated behind it alone, or a single-pointer alternative exists | human | PENDING |
| M-066 | 2.5.2 | Destructive buttons (delete, publish, confirm dialogs) | Human: press-and-hold then drag off before releasing on each destructive control | Action fires on up-event inside the control; moving off before release aborts it | human | PENDING |
| M-067 | 2.5.4 | Both apps | Agent: confirmed via code read — no `devicemotion`/`deviceorientation` listener anywhere in `apps/www` or `packages/react` | N/A — no motion-actuated function exists | agent | N/A — no device-motion feature in the codebase |
| M-068 | 2.5.7 | Media upload drag-drop (`MediaUploadForm.tsx`, `EmptyInput.tsx`) | Human: confirm the "Browse files" non-drag control performs the identical upload | Non-drag alternative exists and is equivalent | human | PENDING |
| M-069 | 2.5.7 | `ResizablePanel`/`DataTable` column resize | Human: confirm a non-drag way to resize (keyboard arrows, double-click-to-reset) | Single-pointer alternative exists, or resizing is cosmetic only | human | PENDING |
| M-070 | 3.1.2 | Richtext code blocks + technical terms | Human: check code blocks/non-English passages for `lang`, excluding proper names/technical terms | `lang` set on passages in a different language than the page default | human | PENDING |
| M-071 | 3.2.3 | www header/footer nav, across every route | Human: compare nav markup/order between home, a marketing page, and a post page | Identical relative order everywhere nav repeats | human | PENDING |
| M-072 | 3.2.4 | Icon-only buttons (both apps) | Human: compare the accessible name of visually-identical icon buttons across surfaces | Same function → same accessible name everywhere | human | PENDING |
| M-073 | 3.2.6 | Help/support links (admin footer, www footer, docs links) | Human: confirm any help mechanism occupies the same relative position on every page where present | Consistent position | human | PENDING |
| M-074 | 3.3.3 | Admin field validation (`fields/number/Field.tsx`, required-field errors) | Human: trigger each validation error and read the suggestion text | A concrete correction is suggested, not just "invalid" | human | PENDING |
| M-075 | 3.3.4 | Admin delete/publish confirmation dialogs | Human: attempt delete/publish, confirm a reversible/confirmable step first | Confirmation or undo path exists for data-modifying actions | human | PENDING |
| M-076 | 3.3.7 | Admin forms re-entered after a validation failure, sign-in after a failed attempt | Human: trigger a validation failure, resubmit; confirm prior field values aren't cleared | No re-entry of already-provided information required | human | PENDING |
| M-077 | 3.3.8 | `/auth/sign-in` (`apps/www/convex/auth/options.ts:37` `emailAndPassword`) | Human: confirm sign-in accepts password-manager autofill/paste, needs no puzzle/transcription/memory task | No cognitive-function-test requirement; paste/autofill unblocked | human | PENDING |

## Fix loop

1. Any `Result` other than `pass` or `N/A` gets one new row in `findings.md` (next sequential
   `F-xxx`), with `Tool` = `manual` or the AT/browser used, and `Evidence` = the exact observed
   behavior.
2. Disposition `fix` (within the shared fix boundary): fix it, re-run ONLY that checklist row,
   flip its `Result` to `pass`, flip the `findings.md` row's `Status` to `fixed (step 9)`.
3. Disposition `backlog` (bigger than the boundary): leave the checklist row linked to its
   `F-xxx`, `Status` `backlogged`; step 14 copies it into `backlog.md` with this row's evidence.
   F-104 and F-105 (from the agent pre-run) did not reproduce with trusted keyboard/pointer
   input and are recorded `n/a`; the agent rows that cited them (M-003, M-005, M-007, M-011)
   are re-checked by the developer with a real keyboard as part of their human sign-off rows.
4. Repeat until every row is `pass`, `N/A`, or linked to a `backlogged` finding — none left
   `PENDING`.
