/**
 * Blocking script that applies theme before hydration.
 *
 * Must be rendered in the document `<head>` (before React hydrates). Reads from
 * localStorage and applies `.dark` class synchronously before the first paint.
 *
 * Deliberately NOT exported from the main `@vexcms/react` barrel (`src/index.ts`,
 * which carries its own `"use client"` directive so every module reachable from
 * it joins the client module graph) — rendered from
 * `app/layout.tsx` (a Server Component), `ThemeScript` getting bundled as a
 * client component reference meant it never ran during the server's own render
 * pass, only hydrating in later like any other client component, which React
 * flags with "Encountered a script tag while rendering React component" (its
 * `<script>`/`dangerouslySetInnerHTML` output is meant for SSR output, not a
 * post-hydration client insertion) — and defeated its whole purpose (apply the
 * theme class BEFORE first paint, no flash). This file, and `./index.ts`, have
 * no `"use client"` directive anywhere in their chain, so importing from
 * `@vexcms/react/server` keeps `ThemeScript` a genuine Server Component,
 * rendered into the initial HTML exactly where it's placed, AND keeps the rest
 * of this zero-directive subpath (e.g. `resolveIconNodes`) safe to import from
 * non-RSC bundlers (Remix, Vite) that don't resolve client references at all.
 *
 * **Framework integration:**
 * - Next.js app router: `app/layout.tsx` `<head>` — see the Next.js App Router
 *   note below first
 * - Next.js pages router: `pages/_document.tsx` `<Head>`
 * - Remix: `root.tsx` `<head>`
 * - Vite: `index.html` `<head>`
 *
 * **Next.js App Router: a dev-only console warning.** `next dev` answers a
 * thrown `notFound()` (and other cases where the real route can't be decided
 * from the request alone) with a minimal error shell first, then reconciles
 * the real root layout — including this component's `<script>` output —
 * entirely on the client from the RSC payload, instead of the browser parsing
 * it from raw HTML text. React's client renderer warns the moment it commits
 * ANY `<script>` host node that way (`"Encountered a script tag while
 * rendering React component…"` — react-dom's `completeWork`, `case "script"`,
 * skipped only when `isScriptDataBlock(props)` is true, i.e. the script's
 * `type` isn't a recognised JS MIME type), independent of which framework
 * API produced the element. Confirmed:
 * - Reproduces live on this exact app (`apps/www`, `next dev`): a route that
 *   404s with `vex-theme` set to `dark` in `localStorage`.
 * - Does NOT reproduce on a normal navigation (no error shell to recover
 *   from) — confirmed live on `/` and `/admin`.
 * - Does NOT reproduce in a production build (`next build`/`next start` never
 *   serves the minimal error shell `next dev` uses) — see
 *   `.agent/docs/specs/2026-11-06-quality-pass/findings.md` F-106.
 * - `next/script`'s `beforeInteractive` strategy does NOT avoid it for this
 *   case: read live against this repo's installed `next@16.4.3`
 *   (`next/dist/compiled/react-dom/cjs/react-dom-client.development.js` and
 *   `next/dist/client/script.js`), both its inline and `src` code paths
 *   return a literal `<script>` element with no `type` prop, so
 *   `isScriptDataBlock` is false and the identical warning fires.
 * - The only mechanism that suppresses the warning for a `<script>` host
 *   node is a component that renders DIFFERENT props depending on whether
 *   it's being parsed as raw server HTML (where the real script content must
 *   stay executable) or committed by React's client reconciler (where
 *   nothing should render at all — the script, if real, already ran). A
 *   genuine Server Component like `ThemeScript` only ever executes once, on
 *   the server, so it cannot distinguish the two — only a Client Component
 *   checking `typeof window` can. Verified live, empirically, in this exact
 *   app (standalone component, NOT reached through `@vexcms/react`'s main
 *   `"use client"` barrel): the real script still lands in the raw SSR'd
 *   HTML (`curl localhost:3030/` shows the literal `(function(){…})();` text
 *   inline in `<head>`, unchanged), the `notFound()` 404-in-dark-mode repro
 *   above drops from reproducing every time to zero warnings across repeated
 *   runs, and `<html>` still carries `.dark` (no FOUC). The community
 *   reaches the same fix independently for `next-themes`:
 *   https://github.com/pacocoursey/next-themes/pull/386 (validated against
 *   the same Next 16 / React 19 line this repo uses).
 *
 * `ThemeScript` itself stays a genuine, directive-free Server Component
 * (unaffected by any of this — Remix/Vite/pages router have no RSC
 * client/server split for it to go wrong in). Next.js App Router consumers
 * should NOT render `<ThemeScript />` directly; instead build their own tiny
 * local `"use client"` wrapper around {@link buildThemeInitScript} that
 * renders the real script when `typeof window === "undefined"` and `null`
 * otherwise (see `apps/www/src/components/ThemeScript.tsx` /
 * `apps/test/src/components/ThemeScript.tsx` for the exact, verified
 * pattern). It stays local to each Next.js app rather than living in this
 * package: a `"use client"` file exported through a real package boundary
 * (`@vexcms/react`'s own barrel) crosses Next's cross-package client
 * reference resolution, a meaningfully different, unverified path from the
 * same-app component this was actually tested against.
 *
 * @param props - Component props.
 * @param props.storageKey - localStorage key (default: `"vex-theme"`).
 * @returns A script tag that runs before React hydration.
 *
 * @example
 * ```tsx
 * // Remix root.tsx / Vite index.html / Next.js pages router _document.tsx
 * import { ThemeScript } from "@vexcms/react/server";
 * import { ThemeProvider } from "@vexcms/react";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html suppressHydrationWarning>
 *       <head>
 *         <ThemeScript />
 *       </head>
 *       <body>
 *         <ThemeProvider>{children}</ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ThemeScript({ storageKey = "vex-theme" }: { storageKey?: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: buildThemeInitScript({ storageKey }) }}
      // Prevent React from trying to hydrate this script
      suppressHydrationWarning
    />
  );
}

/**
 * Builds {@link ThemeScript}'s inline IIFE source — the single source of
 * truth for both the plain `<ThemeScript />` Server Component (Remix, Vite,
 * Next.js pages router) and a Next.js App Router consumer's local
 * `"use client"` wrapper (see {@link ThemeScript}'s doc comment). Reads the
 * persisted theme and applies/removes `.dark` on `<html>` before first paint.
 *
 * @param props - Options.
 * @param props.storageKey - localStorage key (default: `"vex-theme"`).
 * @returns The IIFE source, trimmed, ready for `dangerouslySetInnerHTML`.
 */
export function buildThemeInitScript({ storageKey = "vex-theme" }: { storageKey?: string } = {}): string {
  return `
(function() {
  try {
    var storageKey = '${storageKey}';
    var theme = localStorage.getItem(storageKey);
    var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches) || (!theme && mediaQuery.matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    // Fail silently if localStorage is blocked
  }
})();
  `.trim();
}
