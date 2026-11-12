---
"@vexcms/core": minor
"@vexcms/react": minor
"@vexcms/next": minor
---

Fixed a layout shift on admin refresh: with the sidebar open, the Collections/Globals/Media
section headers and their items used to pop in after the server resolved the signed-in
caller — the `<Suspense>` fallback (`AdminSidebarSkeleton`) rendered one flat, unlabelled,
fixed 6-row placeholder regardless of how many items the settled, permission-filtered nav
was about to show, so a project with many collections (or a caller with few visible ones)
saw a large shape change the instant `authPromise` resolved.

The sidebar now remembers each section's own last-settled item count in the consolidated
`vex-admin` cookie's new `sidebarCounts` field (`@vexcms/core`'s
`parseSidebarSectionCountsCookie`/`applySidebarSectionCountsUpdate`, following the list
view's own row-count cookie conventions) — read server-side (`NextAdminLayout`) and
threaded through to `AdminSidebarSkeleton`, which renders the SAME per-section headers and
skeleton-row counts the real nav is about to settle with, falling back to the config's own
declared section sizes on a cookie-less first visit. A section settled at `0` items hides
its header on the next first paint too, the same way the real nav already does. Counts are
scoped per BROWSER (not per caller), so the very first load after a caller signs in may
still show their predecessor's count for one refresh, self-correcting from then on.
`AppSidebar` persists each section's real count via a new `writeSidebarSectionCountsCookie`
(`@vexcms/react`); `writeAdminCookie` gained a functional-patch form (matching
`writeAdminCollectionCookie`'s own) to support the merge.

Also fixed a second pop-in in the same header: the loading skeleton's `ThemeToggle` was
missing outright (only the "VexCMS Admin" label rendered), so the toggle button itself
appeared for the first time the moment the real sidebar mounted. `ThemeToggle` gained a
`disabled` prop (renders the SAME icon/size/position, `disabled` + `aria-disabled`, dropdown
inert) so the skeleton can render it in place from first paint; the real, enabled toggle
replaces it the same way the rest of the header's content does.

Fixed a third, unrelated bug surfaced during the same investigation: the sidebar's
permission-filtered nav is resolved from `authPromise` exactly ONCE per server render
(`AuthedSidebar`'s `use()` call) and never re-evaluated afterward — a caller whose session
ended in ANOTHER tab (or expired) while this tab sat on an already-rendered admin page kept
seeing their stale, previously-authorized nav indefinitely, correcting only once some
navigation happened to occur (Next re-fetches the dynamic `/admin` layout, including a fresh
`authPromise`, on every navigation already — sign-out from the SAME tab was already fine,
since it hard-navigates). `@vexcms/next` gained `useNextAuthTransitionRefresh`, mounted by
`NextAdminLayoutClient`: it calls `router.refresh()` whenever `@vexcms/react`'s
`useAuthTransition()` — the SAME reactive identity signal `usePaginatedQuery`/
`useVexListQuery` already key their own stale-push detection off — reports the caller's
identity changed, with no navigation of its own to carry the refetch. `router.refresh()`
feeds `AdminLayout` a brand-new, still-pending `authPromise`, which re-suspends its existing
`<Suspense>` boundary to `AdminSidebarSkeleton` and then resolves under the CURRENT identity
— re-filtering the nav and re-persisting the sidebar section-count cookie for whoever is
signed in now, via the same existing mechanisms above.

Fixed a hydration mismatch on `ThemeToggle`'s icon surfaced by the skeleton change above
(adding a SECOND `ThemeToggle` instance to the loading fallback created a real risk the
generic `theme === "system"` coincidence previously masked): the icon now explicitly gates
on a new `mounted` flag (`ThemeProvider`'s context value) — `false` identically on the
server and the client's first render (it only ever flips inside an effect, same timing as
the `.dark` class itself), rendering the theme-neutral `"SunMoon"` icon until then,
regardless of `defaultTheme` or a persisted `localStorage` theme that differs from it.
Covered by a new `renderToString`-vs-`hydrateRoot` regression test
(`ThemeToggle.ssrHydration.test.tsx`) for both a persisted "dark" and "light" theme, and for
the disabled skeleton placeholder.
