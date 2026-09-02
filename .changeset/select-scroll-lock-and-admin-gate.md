---
"@vexcms/react": patch
---

Fix `select` fields being unusable below the fold, and add a client hook for
gating admin affordances.

**Root cause.** Opening a `select` field on a scrolled admin page threw the
viewport violently — measured on the real component as a 1341px jump that
moved the trigger off the bottom of the screen. A floating popup is positioned
by floating-ui a frame or two after it mounts; until then it sits wherever the
portal put it — the end of `<body>`, thousands of pixels from the trigger. Two
things reached into the popup during that window, and each natively scrolls
the page to the popup's pre-position location:

1. **cmdk** `scrollIntoView({ block: "nearest" })`s its highlighted item in a
   layout effect at mount — captured with a stack trace
   (`pageScroll 1380 → 39`). `scrollIntoView` walks every scrollable ancestor
   and has no `preventScroll` option; it cannot be made safe, only made a
   no-op.
2. **Initial focus.** Base UI prevents scrolling only when focusing the popup
   element itself; inner tabbables like the search input get a plain
   `focus()`. The `search={false}` branch was worse — a mount-time
   `<button autoFocus>`, which fires strictly before positioning.

`MultiSelectContent` now keeps its content at `display: none` until the popup
is positioned — an element with no boxes is skipped by `scrollIntoView` per
spec — then reveals it, focuses the search input (or the hidden keyboard
target) with `preventScroll: true`, and performs the highlighted-item scroll
itself inside the now-in-viewport popup. Regression tests pin that focus still
lands on open. Verified against the live admin edit form: zero page movement
with the trigger at the top, middle, and bottom of the viewport, through full
open → pick → close cycles.

**`MultiSelect` gains a `modal` prop** (default `false`). The popover was
hardcoded modal, which locks page scroll — wrong for a form field on a normal
page, needed inside a dialog so the popover joins that surface's focus trap.
Fields are rendered generically with no prop channel, so the new
`ModalSurfaceProvider` / `useModalSurface` pair carries it: `Modal` provides
the surface and `SelectFieldInput` reads it.

**New: `useCanAccessAdminPanel()`.** Evaluates the same `canAccessAdminPanel`
predicate the admin route runs server-side, so an "Admin" link in site chrome
cannot offer a destination that redirects to `/unauthorized`. Fails closed on
missing access config or missing user — `hasPermission` alone returns `true`
with no config, which is correct server-side ("RBAC not configured") and wrong
client-side, where the same absence just means "no provider on this public
route".
