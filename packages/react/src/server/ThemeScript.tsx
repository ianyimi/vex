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
 * rendered into the initial HTML exactly where it's placed.
 *
 * **Framework integration:**
 * - Next.js app router: `app/layout.tsx` `<head>`
 * - Next.js pages router: `pages/_document.tsx` `<Head>`
 * - Remix: `root.tsx` `<head>`
 * - Vite: `index.html` `<head>`
 *
 * @param props - Component props.
 * @param props.storageKey - localStorage key (default: `"vex-theme"`).
 * @returns A script tag that runs before React hydration.
 *
 * @example
 * ```tsx
 * // Next.js app/layout.tsx
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
  // Inline script that runs synchronously before hydration
  const themeScript = `
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

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      // Prevent React from trying to hydrate this script
      suppressHydrationWarning
    />
  );
}
