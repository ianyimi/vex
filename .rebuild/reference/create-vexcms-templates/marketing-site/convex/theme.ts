import { getPreviewSnapshot } from "@vexcms/core"

import { query } from "./_generated/server"
import * as Versions from "./vex/model/versions"

/**
 * Get the active theme from site settings (published).
 * Returns the full theme document or null if no active theme is set.
 * Used for server-side CSS variable injection on public pages.
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("site_settings").first()
    if (!settings?.activeTheme) return null

    const theme = await ctx.db.get(settings.activeTheme)
    if (!theme) return null

    // Only return published themes
    if (theme.vex_status === "draft") return null

    return theme
  },
})

/**
 * Get the active theme for preview/draft mode.
 * Reads site settings with preview snapshot overlay to get the draft activeTheme,
 * then fetches the latest version of that theme (draft or published).
 * Used for server-side CSS variable injection on preview pages.
 */
export const getActivePreview = query({
  args: {},
  handler: async (ctx) => {
    // Get site settings, overlaying any preview snapshot
    const settings = await ctx.db.query("site_settings").first()
    if (!settings) return null

    const settingsId = settings._id as string

    // Check for a preview snapshot on site_settings
    const snapshot = await getPreviewSnapshot({
      ctx,
      collection: "site_settings",
      documentId: settingsId,
    })

    const merged = snapshot
      ? { ...settings, ...(snapshot as Record<string, unknown>) }
      : settings

    const activeThemeId = (merged as any).activeTheme as string | undefined
    if (!activeThemeId) return null

    // Get the theme — prefer the latest draft version
    const theme = await ctx.db.get(activeThemeId as any)
    if (!theme) return null

    const latestVersion = await Versions.getLatestVersion({
      ctx,
      collection: "themes",
      documentId: activeThemeId,
    })

    if (latestVersion?.snapshot) {
      return {
        ...theme,
        ...(latestVersion.snapshot as Record<string, unknown>),
      }
    }

    return theme
  },
})
