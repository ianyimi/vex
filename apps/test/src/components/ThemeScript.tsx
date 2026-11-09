"use client";

import { buildThemeInitScript } from "@vexcms/react/server";

/**
 * Next.js App Router wrapper around `@vexcms/react/server`'s
 * `buildThemeInitScript` — renders the real blocking theme-init script during
 * SSR (so it's part of the raw HTML text the browser parses, exactly like
 * `@vexcms/react/server`'s `<ThemeScript />`), but renders nothing on any
 * CLIENT render of this component.
 *
 * Why this file exists instead of just using `<ThemeScript />` directly: see
 * `packages/react/src/server/ThemeScript.tsx`'s doc comment ("Next.js App
 * Router: a dev-only console warning") for the full root cause and the live
 * evidence this exact pattern was verified against (on `apps/www`, the
 * identical root-layout wiring this app shares). Short version — `next dev`
 * answers a thrown `notFound()` with a minimal error shell first, then
 * reconciles the real root layout (this component included) entirely on the
 * client from the RSC payload. A `<script>` host node React commits that way
 * (rather than the browser parsing it from raw HTML) triggers React's
 * "Encountered a script tag while rendering React component" warning — by
 * design, since scripts inserted that way never execute. A genuine Server
 * Component only ever runs once (server-side), so it can't distinguish "I'm
 * raw HTML text" from "I'm being committed by the client reconciler" to
 * avoid that second case. This component can, via `typeof window`, because it
 * runs again for every client render.
 *
 * `typeof window !== "undefined"` is true during BOTH ordinary hydration and
 * the problematic client-only reconciliation above — in both cases the real
 * script already ran (ordinary hydration: it ran during the initial HTML
 * parse; the error-shell case: there was never a correct `.dark` class to
 * begin with, and `ThemeProvider`'s layout effect — not this script — is
 * what applies it, see its own doc comment). Rendering `null` here is a
 * pure no-op in both, not a functional regression: confirmed live, the real
 * script still lands verbatim in the SSR'd HTML, the `notFound()` 404 warning
 * stops reproducing, and `<html>` still carries `.dark` with no flash.
 *
 * This wrapper is intentionally NOT exported from `@vexcms/react` (kept
 * local to each Next.js app instead): a `"use client"` file exported through
 * a real package boundary crosses Next's cross-package client-reference
 * resolution, a path this exact live verification didn't cover.
 *
 * @param props - Component props.
 * @param props.storageKey - localStorage key (default: `"vex-theme"`).
 * @returns The real theme-init script during SSR; `null` on every client render.
 */
export function ThemeScript({ storageKey = "vex-theme" }: { storageKey?: string } = {}) {
  if (typeof window !== "undefined") {
    return null;
  }

  return (
    <script
      dangerouslySetInnerHTML={{ __html: buildThemeInitScript({ storageKey }) }}
      suppressHydrationWarning
    />
  );
}
