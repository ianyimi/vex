---
"@vexcms/react": patch
---

`AdminTopNav`'s top bar now shows the signed-in caller to the right of the sign-in/out
control, via a new reusable `UserDisplay` (`@vexcms/react`'s `ui/UserDisplay.tsx`): a small
circular avatar on the left plus a two-line name/email layout — name as the header line,
email underneath in muted/subheader text (email alone when no name is set; nothing when
neither is present). The avatar falls back through three tiers: the user's own `image`,
then the auth user collection's configured `admin.icon` (resolved from
`access.userCollectionSlug`), then a generic single-user icon. `UserDisplay` is
presentation-only (plain `name`/`email`/`image`/`fallbackIcon`/`className` props, no context
reads), so it is reusable anywhere a caller has already resolved those fields. Reads the
same `useVexAuth()` the sign-in/out control itself reads, so the two never disagree about
who is signed in, and renders nothing for every signed-out shape the control already treats
as signed out (`user === null` or `user.isAnonymous === true`).

The bar's vertical sizing is now `min-h-[67px]` with `items-center` (no `py-*`) — tuned so
the gap from the "Sign out"/"Sign in" control's own bottom edge to the bar's `border-b`
(measures ~16px) matches the gap from `CollectionEditView`/`GlobalEditView`'s document-title
header's `border-b` down to the TOP of its Preview/Save Draft/Unpublish button row (also
~15.5px) — both real rendered box edges, not a text glyph's ink-top (an earlier attempt
matched the `<h1>`'s line-box top instead, which read visibly bigger despite a numerically
close gap, since a line box's top sits well above its glyphs' visible ink). Horizontal
padding is unchanged (`px-6`). Its content scaled up one design-token step to match: the
sign-in/out button and "View site" button from `default`/`icon` to `lg`/`icon-lg`, the
sidebar trigger from `icon-sm` to `icon`, the breadcrumb trail to `text-lg` with 16px crumb
icons (was 14px), and the breadcrumb dividers to 18px (was 16px). `AdminLayout`'s and
`AdminSidebar`'s own `SidebarHeader` (and its loading skeleton) now carry the same
`min-h-[67px]` (plus a `text-base` title) — the sidebar header's `border-b` line lines up
with the top bar's at the same height (one continuous divider across the sidebar and main
column). That header's OWN horizontal padding is `px-4` (16px each side), independent of
the top bar's `px-6` — sized instead against the sidebar header's own content: "VexCMS
Admin"'s rendered text left edge lines up exactly with "Collections"'s own rendered text
edge one level down in the nav, and the `ThemeToggle`'s right inset matches that same 16px.
`ThemeToggle` gained an optional `size` prop (forwarded to its underlying `Button`, default
`"icon"` unchanged) so `AdminSidebar` could bump it to `icon-lg` alongside everything else.

`AdminTopNav` now publishes its own measured rendered height as a `--vex-topbar-h` CSS
custom property on `document.documentElement` (a `ResizeObserver` on the `<header>`
itself, the same pattern `DataTable.tsx` already uses for `--vex-table-header-h`) — the
single source for any `position: fixed`/`position: absolute` overlay that must start
exactly at the top bar's bottom border. `ListViewPeek`'s desktop panel (the "Inspect" peek)
now reads `top-[var(--vex-topbar-h,67px)]` instead of a hardcoded `top-12` (48px) that
assumed the top bar's PRE-this-release height and silently went stale the moment the top
bar's own height changed, clipping the peek's title row behind it. The mobile bottom-sheet
shape's `top-10` is untouched — it's a deliberate decorative reveal strip (matching
`LivePreviewMobileOverlay`'s own bottom sheet), not derived from the top bar's height, so
it was never affected by this drift.

Fixed a PRE-EXISTING (predates this release's top-bar work) hydration mismatch in
`ListViewPeek`'s resize handle: `clampPeekWidth` branched on `typeof window === "undefined"`
DURING RENDER, so the server always rendered `aria-valuemax="9007199254740991"` while the
client rendered the real clamped value, mismatching on every deep-linked `?peek=<id>` load.
Fixed by seeding a `viewportWidth` state as `undefined` (identical on the server and the
client's first render — never a direct `window.innerWidth` read in render) and measuring
the real value in a `useEffect` after mount, kept live on resize — the same
seed-then-measure-after-mount shape `useLivePreviewPanelMinSize` already uses. No other
`position: fixed`/`position: absolute` overlay (the live-preview split panel, sheets) had
the same problem — both already measure post-mount.
