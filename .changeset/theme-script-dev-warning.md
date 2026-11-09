---
"@vexcms/react": patch
---

`@vexcms/react/server`'s `ThemeScript` now exports its inline theme-init IIFE source as a
standalone `buildThemeInitScript({ storageKey })` function, so a consumer can reuse the exact
script `<ThemeScript />` renders without also rendering the Server Component itself.

Added for Next.js App Router consumers specifically: rendering `<ThemeScript />` directly from
`app/layout.tsx` can trigger React's dev-only "Encountered a script tag while rendering React
component" console warning whenever `next dev` answers a route with its minimal error shell
(e.g. a thrown `notFound()`) and reconciles the real root layout entirely client-side from the
RSC payload — a `<script>` host node React commits that way is never executed and React warns
about it, regardless of which API produced the element (`next/script`'s `beforeInteractive`
strategy does not avoid this either; verified against its actual source). A genuine Server
Component only ever runs once, so it can't distinguish "I'm raw server HTML" from "I'm being
committed by the client reconciler" to render differently for the second case — only a Client
Component checking `typeof window` can, which is why `buildThemeInitScript` now exists as a
separable primitive: apps build a small local `"use client"` wrapper around it that renders the
real script during SSR and `null` on every client render (see `ThemeScript.tsx`'s doc comment
for the full write-up and the live verification this was checked against). `ThemeScript` itself
is unchanged and still the right choice for Remix, Vite, and the Next.js pages router.
