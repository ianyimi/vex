"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useQuery } from "@tanstack/react-query"
import { buildThemeCss, type ThemeScope } from "@vexcms/core"
import { useLivePreviewDocumentQuery } from "@vexcms/react"
import { useEffect, useRef } from "react"

import type { SiteSettingsGlobal, Theme } from "~/vex.types"

import { GLOBAL_SLUG_SITE_SETTINGS } from "~/db/constants"

/**
 * Client companion to the server `<ThemeStyle />`: keeps the applied theme
 * live without a page reload.
 *
 * Resolves `siteSettings -> theme` on the CLIENT, in two steps, rather than
 * subscribing to `api.theme.getActive`. That query does the join on the server,
 * so it answers from the saved global and is structurally blind to an editor's
 * unsaved `activeTheme` — switching themes in live preview changed nothing
 * until save. Reading the global through `useLivePreviewDocumentQuery` lets the
 * overlay reach it, then `api.theme.byId` resolves whichever theme it now
 * names. Outside preview the overlay is absent and this behaves exactly as the
 * server join did, still as a live Convex subscription.
 *
 * The CSS goes into an effect-managed `<style>` appended to the end of
 * `<body>` rather than a React-hoisted one: hoisted styles are deduplicated by
 * `href` and are not guaranteed to update in place when their text changes.
 * The end of `<body>` is the one position that follows *both* server blocks —
 * the hoisted site block in `<head>` and the admin layout's in-tree block — so
 * at equal specificity this one wins the moment it exists. The first push
 * matches the server CSS byte-for-byte, so nothing visibly changes until a
 * real edit lands.
 *
 * Distinguishes loading from empty: while either query is unresolved the server
 * CSS stands; once the reference resolves to nothing the override is cleared
 * and `globals.css` shows through.
 *
 * @param props - Input props.
 * @param props.scope - Same contract as `<ThemeStyle />`: `"site"` emits
 * `:root`, `"admin"` emits `:root:root` with the `adminTheme` fallback.
 * @returns Nothing — the style element is managed imperatively.
 */
export function ThemeLive(props: { scope?: ThemeScope }) {
  const scope = props.scope ?? "site"

  const { data: settings } = useLivePreviewDocumentQuery<typeof GLOBAL_SLUG_SITE_SETTINGS>(
    convexQuery(api.siteSettings.get, {}) as never,
    GLOBAL_SLUG_SITE_SETTINGS,
  )

  // `adminTheme ?? activeTheme` mirrors `theme.getAdmin`'s own fallback: the
  // admin adopts the site's palette unless it opts out.
  const reference = settings as SiteSettingsGlobal | undefined
  const themeIds = (
    scope === "admin" ? (reference?.adminTheme ?? reference?.activeTheme) : reference?.activeTheme
  ) as string[] | undefined
  const themeId = themeIds?.[0]

  const { data: theme } = useQuery({
    ...convexQuery(api.theme.byId, themeId ? { id: themeId } : "skip"),
    enabled: Boolean(themeId),
  })

  // Owning the element in its own mount-scoped effect is load-bearing. Creating
  // it inside the effect that writes the CSS meant every dependency change ran
  // that effect's cleanup first — removing the element and exposing the server
  // CSS underneath. Selecting a theme the page had not fetched yet left it
  // removed for the length of the round trip, which is the flash back to the
  // saved theme between edits; an already-cached theme resolved in the same
  // tick, which is why it only happened the first time.
  const styleElementRef = useRef<HTMLStyleElement | null>(null)
  useEffect(() => {
    const element = document.createElement("style")
    element.id = `vex-theme-live-${scope}`
    document.body.appendChild(element)
    styleElementRef.current = element

    return () => {
      // Admin routes unmount their scope on navigation back to the site; the
      // override must not outlive the layout that owns it.
      element.remove()
      styleElementRef.current = null
    }
  }, [scope])

  useEffect(() => {
    const element = styleElementRef.current
    if (!element) {return}

    // Still resolving — hold whatever is already applied. Before first paint
    // that is the server CSS; mid-preview it is the last previewed theme.
    if (settings === undefined) {return}
    if (themeId && theme === undefined) {return}

    element.textContent = theme ? buildThemeCss({ theme: theme as Theme, scope }) : ""
  }, [settings, theme, themeId, scope])

  return null
}
