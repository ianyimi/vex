---
"@vexcms/react": patch
---

**Live preview no longer takes over the page when the window narrows.** `isMobile` (from
`useIsMobile()`, the 768px breakpoint) used to gate the SAME `LivePreviewPanel` between a
`ResizablePanel` and a bare `fixed inset-0` div — so narrowing the browser past that
breakpoint while the desktop split was open flipped straight into a full-screen takeover
with no warning, nothing to dismiss it but the panel's own close button.

`useLivePreviewPanelState` now owns the full responsive state machine: narrowing past the
breakpoint while open auto-closes the panel and remembers the close was automatic; widening
back past it reopens the panel ONLY if nothing explicit happened while narrow (any toggle —
open or close — clears that memory, so it then stays however the user left it). Automatic
transitions never write the `vex-live-preview-panel:<slug>` cookie; only an explicit
`toggle()` does, so a refresh at desktop width still respects the user's last deliberate
choice.

Opening the panel below the breakpoint (the header button or the ⋯ menu's "Preview" item)
now shows a new `LivePreviewMobileOverlay` — a `ui/sheet.tsx` bottom sheet, built on Base UI's
`Dialog`, that slides up and covers the screen except a thin strip of the page at the top.
Esc, a backdrop tap, or `LivePreviewPanel`'s own close button all dismiss it; focus is
trapped and the page behind doesn't scroll, for free from the Sheet primitive. The toolbar
keeps its existing `justify-between` layout (preview-in-a-new-tab link on the left, close on
the right).

`LivePreviewToggleAction`'s pressed icon and the ⋯ menu item now read the panel's `isOpen`
directly (previously `isSplit`, which read `false` while the mobile overlay was open —
leaving the header button showing "closed" even though the overlay was visibly open).
