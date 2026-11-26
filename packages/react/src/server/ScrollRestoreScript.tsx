/**
 * Blocking script that restores a scroll container's offset before
 * hydration — a generic, keyless counterpart to `ThemeScript`.
 *
 * Must be rendered in the document `<head>` (before React hydrates), the
 * same place as `ThemeScript`. It never targets a container directly by id
 * or reads `document.currentScript`: it has no fixed position relative to
 * the container (the edit view, the only current consumer, renders the
 * container deep in `<body>`, not as this script's literal next sibling),
 * so instead it watches the WHOLE document for any element carrying a
 * `data-vex-scroll-key` attribute via a `MutationObserver`, applying that
 * key's `sessionStorage` offset the moment the element streams in and
 * marking the key done so a later match for the same key (a React
 * re-render replacing the node) never re-applies a now-stale value over
 * the user's own subsequent scrolling. `window.load` disconnects the
 * observer — nothing meaningful can stream in after that.
 *
 * Deliberately NOT exported from the main `@vexcms/react` barrel, for the
 * exact reason `ThemeScript` isn't — see that file's own doc comment
 * ("Next.js App Router: a dev-only console warning"). This file and
 * `./index.ts` carry no `"use client"` directive anywhere in their chain,
 * so importing from `@vexcms/react/server` keeps this a genuine Server
 * Component. Next.js App Router consumers should NOT render
 * `<ScrollRestoreScript />` directly; build a local `"use client"` wrapper
 * around {@link buildScrollRestoreInitScript} the same way each app already
 * does for `ThemeScript` (see `apps/test/src/components/ScrollRestoreScript.tsx`).
 *
 * @returns A script tag that runs before React hydration.
 *
 * @example
 * ```tsx
 * // Remix root.tsx / Vite index.html / Next.js pages router _document.tsx
 * import { ScrollRestoreScript, ThemeScript } from "@vexcms/react/server";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html suppressHydrationWarning>
 *       <head>
 *         <ThemeScript />
 *         <ScrollRestoreScript />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ScrollRestoreScript() {
  return <script dangerouslySetInnerHTML={{ __html: buildScrollRestoreInitScript() }} suppressHydrationWarning />;
}

/**
 * Builds {@link ScrollRestoreScript}'s inline IIFE source — the single
 * source of truth for both the plain Server Component (Remix, Vite,
 * Next.js pages router) and a Next.js App Router consumer's local
 * `"use client"` wrapper.
 *
 * The `sessionStorage` key prefix is a literal, not an import from
 * `admin/usePreservedScrollTop.ts`: that hook's own file carries `"use
 * client"`, and nothing in this directive-free subpath's chain may — see
 * this file's own doc comment. `admin/usePreservedScrollTop.ts` documents
 * the same literal on its own exported constant; keep the two in sync by
 * hand.
 *
 * @returns The IIFE source, trimmed, ready for `dangerouslySetInnerHTML`.
 */
export function buildScrollRestoreInitScript(): string {
  return `
(function() {
  try {
    var PREFIX = 'vex-admin:edit-scroll:';
    var handled = {};
    function apply(el) {
      var key = el.getAttribute('data-vex-scroll-key');
      if (!key || handled[key]) return;
      handled[key] = true;
      try {
        var raw = sessionStorage.getItem(PREFIX + key);
        if (raw === null) return;
        var value = Number(raw);
        if (!isFinite(value)) return;
        el.scrollTop = value;
      } catch (e) {}
    }
    var existing = document.querySelectorAll('[data-vex-scroll-key]');
    for (var i = 0; i < existing.length; i++) apply(existing[i]);
    var observer = new MutationObserver(function(mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var n = 0; n < added.length; n++) {
          var node = added[n];
          if (node.nodeType !== 1) continue;
          if (node.hasAttribute && node.hasAttribute('data-vex-scroll-key')) apply(node);
          if (node.querySelectorAll) {
            var inner = node.querySelectorAll('[data-vex-scroll-key]');
            for (var k = 0; k < inner.length; k++) apply(inner[k]);
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('load', function() { observer.disconnect(); });
  } catch (e) {}
})();
  `.trim();
}
