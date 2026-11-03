---
"@vexcms/react": patch
"@vexcms/next": patch
---

New shared `AdminNotFound` state, styled like `ListEmptyState`: icon, title ("Collection not
found" / "Global not found" / "Document not found"), a detail line, and a button back to the
dashboard (a document's own not-found goes back to its collection's list instead) — server-
rendered on first paint with zero layout shift, same frame size as settled content. Replaces
every ad hoc not-found placeholder string previously shown for an unknown collection, global,
or document.

Exported from `@vexcms/react`'s main entry (not `@vexcms/react/server`): its back button
uses `VexLink` for genuine in-app navigation, and `VexLink` depends on a `createContext`-
backed hook that the server entry's tsup bundling can't isolate behind its own `"use client"`
boundary (confirmed via `pnpm check:vercel` — a production build, unlike `next dev`, fails
statically on this). Rendering it as a client component from `NextAdminPage` (a Server
Component) costs nothing: React still renders a client component's own output into the
initial server-rendered HTML, same as `AdminTopNav`/`CollectionListView`/every other view
already does — only its interactivity hydrates afterward.
