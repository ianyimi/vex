---
"@vexcms/react": patch
"@vexcms/next": patch
---

Intercepting routes no longer interfere with the admin:

- **State behind the sign-in modal.** Opening "Sign in" from the admin top bar swaps the URL to the modal's route while the admin page stays mounted underneath. The page used to read the modal's URL: the list view dropped its filter, view and search and loaded the wrong rows, a top-level tabs field reset to its first tab, and the sidebar lost its active collection. They now keep their admin values. List URL writes are dropped while the modal is open, so Escape closing the modal no longer also closes the peek panel or writes onto the modal's URL. The `Cmd/Ctrl+B` sidebar shortcut stands down too.
- **Unsaved-changes guard.** The guard no longer prompts when "Sign in" is clicked on a dirty edit view, since the form stays mounted underneath. Closing the modal (a back navigation) no longer reads as leaving the page.
- **Sign-in return URL.** The return URL now carries the page's full query (filter, sort, search, view, tab, peek), not just `?view=`, so signing in lands on exactly the page and state you left.
- **New optional framework capabilities.** `FrameworkComponents.useIsRouteCovered` and `FrameworkComponents.useSearchParams`, plus the `COVERING_ROUTE_LINK_ATTRIBUTE` export. `@vexcms/next` supplies `useNextIsRouteCovered` and `useNextSearchParams`.
