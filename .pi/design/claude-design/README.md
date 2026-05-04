# Claude Design — VexCMS Admin Mockups

**Source:** Exported from a Claude Design (claude.ai/design) session. Author: zaye, May 2026.

These files are the **visual source of truth** for the admin UI. They are NOT
drop-in CSS — Claude Design uses its own bespoke token vocabulary and bespoke
component classes that don't match the project's shadcn/Tailwind v4 stack.

---

## The dual-token-system gotcha

Claude Design's `admin.css` and the project's `apps/www/src/app/globals.css`
use **different variable names for the same concepts**. Don't try to copy
`admin.css` over `globals.css` — it will do nothing for the React components
(they consume shadcn tokens, not Claude Design tokens).

The current `apps/www/src/app/globals.css` already absorbs Claude Design's
full palette into shadcn-named tokens. If anything in `admin.css` changes,
re-translate using the table below.

### Token translation table

| Concept                  | Claude Design (`admin.css`)        | Project shadcn (`globals.css`)      | Notes |
|--------------------------|-------------------------------------|--------------------------------------|-------|
| Page background          | `--page`                            | `--background`                       | 1:1 |
| Card / surface           | `--surface`                         | `--card`                             | 1:1 |
| Popover / raised         | `--raised`                          | `--popover`                          | 1:1 |
| Sidebar bg               | `--side`                            | `--sidebar`                          | 1:1 |
| Neutral hover bg         | `--hover`                           | `--hover` *(new, custom)*            | shadcn has no equivalent — added |
| Foreground text          | `--fg`                              | `--foreground`                       | 1:1 |
| Muted text               | `--fg-muted`                        | `--muted-foreground`                 | 1:1 |
| Subtler text             | `--fg-subtle`                       | `--muted-foreground-subtle` *(new)*  | extension |
| Faintest text            | `--fg-faint`                        | `--muted-foreground-faint` *(new)*   | extension |
| Default border           | `--line`                            | `--border`                           | 1:1 |
| Bold border (inputs)     | `--line-bold`                       | `--border-strong` *(new)*            | extension |
| Soft border (separators) | `--line-soft`                       | `--border-soft` *(new)*              | extension |
| Brand CTA (solid)        | `--accent` (= ember)                | `--primary`                          | shadcn-faithful: brand goes on `--primary` so `<Button variant="default">` renders ember. |
| Brand CTA text           | `--accent-on`                       | `--primary-foreground`               | white on ember |
| Brand hover              | `--accent-hover`                    | `--primary-hover` *(new)*            | deeper ember for primary button hover |
| Brand pressed            | `--accent-ink`                      | `--primary-pressed` *(new)*          | deepest ember |
| Highlight bg (tint)      | `--accent-tint`                     | `--accent`                           | shadcn-faithful: `<DropdownMenuItem data-[highlighted]>` reads `bg-accent` → ember tint. Matches `.vex-menu-item.active`. |
| Highlight ink            | `--accent-ink`                      | `--accent-foreground`                | ember-ink text on ember-tint |
| Brand glow (focus halo)  | `--accent-glow`                     | `--accent-glow` *(new)*              | extension |
| Brand line (tinted bdr)  | `--accent-line`                     | `--accent-line` *(new)*              | extension |
| Success                  | `--ok` / `--ok-bg`                  | `--success` / `--success-bg` *(new)* | renamed to read better |
| Warning                  | `--warn` / `--warn-bg`              | `--warning` / `--warning-bg` *(new)* | renamed |
| Destructive              | `--bad` / `--bad-bg`                | `--destructive` / `--destructive-bg` | shadcn already has `--destructive`; `-bg` is new |
| Shadow scale             | `--shadow-xs/sm/md/lg/pop`          | `--shadow-xs/sm/md/lg/pop`           | mapped via indirect `*-val` vars so dark mode can flatten them |
| Motion easing            | `--ease`                            | `--ease-emphasized`                  | renamed to match Tailwind v4 conventions |

**Format conversion:** Claude Design uses HEX; the project uses oklch.
Approximate equivalents are commented in `globals.css`.

### Elevation hierarchy (three levels)

| Level    | Light    | Dark     | shadcn token         | Used for                                   |
|----------|----------|----------|----------------------|--------------------------------------------|
| page     | #F5F5F5  | #0A0A0A  | `--background`       | Page bg, ghost-button hover                |
| surface  | #FFFFFF  | #141414  | `--card`, `--popover`| Cards, popovers, modals, inputs            |
| raised   | #FAFAFA  | #1E1E1E  | `--muted`            | Table headers, modal foots, badge.muted    |

Key: `--card` and `--popover` are the **same value**, both pointing to surface.
`--muted` = raised. Don't conflate them.

### Radius scale

| Token            | Value | Used for                                       |
|------------------|-------|------------------------------------------------|
| `--radius-sm`    | 2px   | controls (buttons, inputs, menu items, type chips) |
| `--radius-md`    | 4px   | cards, popovers, table wraps                   |
| `--radius-lg`    | 8px   | modals, dialogs                                |
| `--radius-4xl`   | 9999px| pill badges, avatars                           |

---

## Why this works

- React components in `packages/react` consume shadcn-named tokens via
  Tailwind utilities (`bg-card`, `border-border-strong`, `text-muted-foreground-subtle`,
  etc.). Tailwind v4 generates these utilities from the `@theme inline` block.
- The project's `globals.css` declares all the **values** Claude Design uses
  but under shadcn-style names, so the React components automatically pick
  them up — no React component changes needed for colours.

What the `globals.css` swap **doesn't** fix:
1. **Layout / spacing / typography differences** between the design HTML and
   the live admin. Those live in component JSX, not CSS variables. Fix them
   per-component with the design HTML open as a reference.
2. **Bespoke component classes** in `admin.css` (`.vex-relpicker-row`,
   `.vex-wordmark`, etc.) — these don't exist in the React package and
   shouldn't. Use the visual design as a spec and rebuild equivalents in
   React components when needed.

---

## Files in this folder

### Manifest & styles
- **`vexcms-design.html`** — canvas index. JSX-style scaffold listing every
  artboard (`dashboard`, `posts-list`, `picker-open`, `study-text`,
  `study-rel`, etc.).
- **`admin.css`** — 972 lines of hand-authored CSS scoped under `.vex-admin`.
  Treat as a **visual reference only**. Do not import.
- **`globals.css`** — Claude Design's own globals.css. Less complete than the
  one in `apps/www/src/app/globals.css`.

### Component implementations (JSX)
These render the actual screens the canvas index lists. Read them when
porting a screen to React in `packages/react`.

| File                | What it defines                                                                |
|---------------------|--------------------------------------------------------------------------------|
| `primitives.jsx`    | `LightningBolt`, `VexWordmark`, `Icon` set, `FIELD_TYPES`, sample data |
| `shell.jsx`         | `Sidebar`, `Topbar`, `AdminLayout`                                            |
| `fields.jsx`        | `FieldShell`, all 7 field Inputs + Cells (Text/Number/Check/Select/Date/URL/Rel) |
| `relationship.jsx`  | `RelPickerPopover`, `RelTrigger`, `RelSidePanel`, `RelInlineDrawer`           |
| `screens.jsx`       | `DashboardView`, `PostsListView`, `EditViewSingle`, `EditViewTwoCol`, `EditViewCollapsedRail`, `CreateModal` |
| `studies.jsx`       | Per-field-type study artboards (states, variants, cell renderings)            |
| `mobile.jsx`        | `TabletList`, `MobilePostsList`, `MobileEdit`                                 |
| `prototype.jsx`     | Live interactive prototype                                                    |
| `tweaks-panel.jsx`  | Design-canvas tweaks/controls (not project-relevant)                          |
| `design-canvas.jsx` | The artboard layout shell (not project-relevant)                              |

## Component adjustments propagated to `packages/react/src/components/ui`

The shadcn UI primitives in `packages/react/src/components/ui` were
adjusted once to match Claude Design's measurements so per-instance
overrides aren't needed:

| Component       | Change                                                       |
|-----------------|--------------------------------------------------------------|
| `button.tsx`    | `rounded-md → rounded-sm`; `text-sm → text-[13px]`; sizes: default `h-9 → h-8` (32px), sm `h-8 → h-7` (28px), lg `h-10 → h-9` (36px); icon sizes shifted down one step |
| `input.tsx`     | `rounded-md → rounded-sm`; `h-9 → h-8`; `text-base → text-[13px]`; `bg-transparent → bg-card`; `placeholder:text-muted-foreground → placeholder:text-muted-foreground-subtle` |
| `textarea.tsx`  | `rounded-md → rounded-sm`; `min-h-16 → min-h-20` (80px); `text-base → text-[13px]`; bg/placeholder updates |
| `select.tsx`    | `rounded-md → rounded-sm`; `text-sm → text-[13px]`; trigger heights `h-9/h-8 → h-8/h-7`; `bg-transparent → bg-card`; hover border darkens |
| `card.tsx`      | `rounded-xl → rounded-md`; ring → `border border-border`; padding tightened to `px-4`; header gets `border-b`; footer gets `bg-muted` |
| `dialog.tsx`    | `rounded-xl → rounded-lg`; ring → `border border-border`; uses `shadow-pop` |

When adding new shadcn components from upstream, apply the same pattern:
`rounded-md → rounded-sm` for controls, `rounded-xl → rounded-md` for
cards, `rounded-xl → rounded-lg` for dialogs.

---

## Updating

When Claude Design exports a new revision:

1. Drop the new `admin.css` / `globals.css` / `*.html` into this folder
   (overwriting).
2. Diff against the previous version:
   ```bash
   git diff HEAD~1 -- .pi/design/claude-design/admin.css
   ```
3. For any new token in `admin.css`, add a row to the translation table
   above and an entry in `apps/www/src/app/globals.css` under both `:root`
   and `.dark`, plus the `@theme inline` registration.
4. For any value change to an existing token, update the matching shadcn
   token's value in `apps/www/src/app/globals.css`.
5. For new component patterns in the HTML, treat them as visual specs for
   React component work — don't try to port the CSS directly.
