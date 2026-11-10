---
"@vexcms/react": patch
"create-vexcms": patch
---

`AdminNotFound` is vertically centered in its content area. Scaffolded apps detect a signed-in
session from a `<meta name="vex-session">` hint emitted by the admin layout and Draft Mode pages
instead of reading Better Auth's httpOnly cookie (never visible to `document.cookie`), so the
Convex client now waits for auth instead of flashing anonymous results; Draft Mode pages render
the preview query on first paint, and the not-found page is vertically centered.
