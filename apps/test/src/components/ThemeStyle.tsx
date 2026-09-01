import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { buildThemeCss, type ThemeScope } from "@vexcms/core"

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
 * one block. Leave `siteSettings.adminTheme` empty and `getAdmin` falls back to
 * the site theme, which is the default: **the admin adopts the site's palette.**
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
    theme = await fetchQuery(scope === "admin" ? api.theme.getAdmin : api.theme.getActive)
  } catch {
    // No deployment reachable at build time — fall back to globals.css.
    return null
  }
  if (!theme) {return null}

  const css = buildThemeCss({ theme, scope })
  if (!css) {return null}

  // `precedence` opts into React 19 style hoisting, so this lands in <head>
  // before first paint instead of mid-body.
  return (
    <style
      dangerouslySetInnerHTML={{ __html: css }}
      href={`vex-theme-${scope}`}
      precedence="high"
    />
  )
}
