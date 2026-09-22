import { api } from "@convex/_generated/api"
import { buildThemeCss, type ThemeScope } from "@vexcms/core"

import { vex } from "~/lib/vex"

/**
 * Server component that inlines a theme's CSS custom properties.
 *
 * Rendered twice per admin request and once per public request:
 *
 * - the root layout emits the **site** theme at `:root`;
 * - the admin layout emits the **admin** theme at `:root:root`.
 *
 * `:root:root` is specificity (0,2,0) against `:root`'s (0,1,0), so the admin
 * block wins wherever both are present without depending on style-injection
 * order. On public routes the admin layout never renders, so there is exactly
 * one block — and the admin block is deliberately *not* hoisted, so React tears
 * it down with the admin layout instead of leaving it in `<head>` (see below).
 * Leave `siteSettings.adminTheme` empty and `getAdmin` falls back to the site
 * theme, which is the default: **the admin adopts the site's palette.**
 *
 * Values are written through verbatim. A `color()` field storing
 * `oklch(60.5% 0.175 42)` needs no conversion, because that is already the
 * notation `globals.css` declares its tokens in.
 *
 * This component covers the **first paint** only — no flash of unthemed
 * content. Live updates after a save are `<ThemeLive />`'s job, which
 * subscribes to the same query client-side and overrides this block.
 *
 * Renders nothing when Convex is unreachable (e.g. a build with no deployment)
 * or no theme is active — the app then uses `globals.css` unchanged.
 *
 * @param props - Input props.
 * @param props.scope - `"site"` emits `:root`; `"admin"` emits `:root:root` and
 * reads `adminTheme` with a fallback to the site theme.
 * @returns A `<style>` element, or `null`.
 */
export async function ThemeStyle(props: { scope?: ThemeScope }) {
  const scope = props.scope ?? "site"

  let theme: null | Record<string, unknown> = null
  try {
    theme = await vex.query(scope === "admin" ? api.theme.getAdmin : api.theme.getActive)
  } catch {
    // No deployment reachable at build time — fall back to globals.css.
    return null
  }
  if (!theme) {return null}

  const css = buildThemeCss({ theme, scope })
  if (!css) {return null}

  // Only the **site** block opts into React 19 style hoisting. A hoisted
  // `<style>` (`href` + `precedence`) is a stylesheet *resource*: react-dom
  // keeps it in `<head>` for the life of the document and merely decrements a
  // refcount when the component that rendered it unmounts
  // (`commitDeletionEffectsOnFiber`, fiber tag 26). That is correct for the
  // site theme, which is document-wide — and wrong for the admin theme: the
  // hoisted `:root:root` block outlived a client-side nav out of `/admin` and
  // re-skinned the public site until a full reload. Rendering the admin block
  // in place ties its lifetime to the admin layout, at the cost of nothing:
  // it still streams ahead of any admin markup, and `:root:root` outranks the
  // site block wherever both apply, whatever the document order.
  if (scope === "admin") {
    return <style dangerouslySetInnerHTML={{ __html: css }} data-vex-theme="admin" />
  }

  return (
    <style
      dangerouslySetInnerHTML={{ __html: css }}
      href="vex-theme-site"
      precedence="high"
    />
  )
}
