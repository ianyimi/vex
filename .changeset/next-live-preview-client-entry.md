---
"@vexcms/next": patch
---

**Breaking:** `disableLivePreview` and `DEFAULT_LIVE_PREVIEW_ROUTE_PATH` move from
`@vexcms/next/livePreview` to the new client-safe `@vexcms/next/livePreview/client`. The
`livePreview` entry also exports `createVexDraftModeRoute`, which imports `next/headers`, so a
client component (a sign-out button) importing `disableLivePreview` from it failed `next build`.
Update the import path.
