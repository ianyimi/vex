/**
 * Blocking script that applies theme before hydration.
 *
 * Must be rendered in the document `<head>` (before React hydrates). Reads from
 * localStorage and applies `.dark` class synchronously before the first paint.
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
 * import { ThemeScript, ThemeProvider } from "@vexcms/react";
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
