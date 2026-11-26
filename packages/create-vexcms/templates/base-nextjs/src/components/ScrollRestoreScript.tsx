"use client";

import { buildScrollRestoreInitScript } from "@vexcms/react/server";

/**
 * Next.js App Router wrapper around `@vexcms/react/server`'s
 * `buildScrollRestoreInitScript` — renders the real head-level scroll-restore
 * script during SSR (so it's part of the raw HTML text the browser parses,
 * exactly like `@vexcms/react/server`'s `<ScrollRestoreScript />`), but
 * renders nothing on any CLIENT render of this component.
 *
 * Why this file exists instead of just using `<ScrollRestoreScript />`
 * directly: the exact same reason `~/components/ThemeScript.tsx` exists —
 * see `packages/react/src/server/ThemeScript.tsx`'s doc comment ("Next.js
 * App Router: a dev-only console warning") for the full root cause. A
 * genuine Server Component only ever runs once (server-side), so it can't
 * distinguish "I'm raw HTML text" from "I'm being committed by the client
 * reconciler" to avoid rendering a stray `<script>` host node in the
 * second case. This component can, via `typeof window`, because it runs
 * again for every client render.
 *
 * @returns The real scroll-restore-init script during SSR; `null` on every client render.
 */
export function ScrollRestoreScript() {
  if (typeof window !== "undefined") {
    return null
  }

  return <script dangerouslySetInnerHTML={{ __html: buildScrollRestoreInitScript() }} suppressHydrationWarning />
}
