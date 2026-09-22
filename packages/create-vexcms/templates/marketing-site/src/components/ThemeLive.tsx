"use client"

import { api } from "@convex/_generated/api"
import { buildThemeCss, type ThemeScope } from "@vexcms/core"
import { useQuery } from "convex/react"
import { useEffect } from "react"

/**
 * Client companion to the server `<ThemeStyle />`: keeps the applied theme
 * live without a page reload.
 *
 * `useQuery` is a Convex subscription — the deployment pushes every change to
 * the active theme document (or to which theme is active), so saving in the
 * admin re-skins every open tab immediately. No polling, no preview channel,
 * no drafts machinery.
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
 * Distinguishes loading from empty: while the query is unresolved
 * (`undefined`) the server CSS stands; once it resolves to `null` (no active
 * theme) the override is cleared and `globals.css` shows through.
 *
 * @param props - Input props.
 * @param props.scope - Same contract as `<ThemeStyle />`: `"site"` emits
 * `:root`, `"admin"` emits `:root:root` with the `adminTheme` fallback.
 * @returns Nothing — the style element is managed imperatively.
 */
export function ThemeLive(props: { scope?: ThemeScope }) {
  const scope = props.scope ?? "site"
  const theme = useQuery(scope === "admin" ? api.theme.getAdmin : api.theme.getActive)

  useEffect(() => {
    if (theme === undefined) {return} // still loading — leave the server CSS alone

    const id = `vex-theme-live-${scope}`
    let el = document.getElementById(id) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement("style")
      el.id = id
      document.body.appendChild(el)
    }
    el.textContent = theme ? buildThemeCss({ theme, scope }) : ""

    return () => {
      // Admin routes unmount their scope on navigation back to the site; the
      // override must not outlive the layout that owns it.
      el?.remove()
    }
  }, [theme, scope])

  return null
}
