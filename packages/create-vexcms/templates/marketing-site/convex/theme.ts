import { getGlobal } from "@vexcms/core/server"

import { GLOBAL_SLUG_SITE_SETTINGS, type TABLE_SLUG_THEMES } from "~/db/constants"
import config from "~/vex.config"

import type { Doc, Id } from "./_generated/dataModel"
import type { QueryCtx } from "./_generated/server"

import { query } from "./_generated/server"

/** A theme document, or `null` when none is selected. */
type ActiveTheme = Doc<typeof TABLE_SLUG_THEMES> | null

/**
 * Resolves one of `siteSettings`' theme references to its document.
 *
 * `relationship` always stores an array of ids — `hasMany` only controls how
 * many the admin picker lets you choose — so the first entry is the selection.
 *
 * Access control is bypassed: a site's palette is public by definition, and an
 * anonymous visitor must get the same colours as a signed-in editor.
 *
 * @param props - Input props.
 * @param props.ctx - Convex query context.
 * @param props.field - Which `siteSettings` reference to follow.
 * @returns The referenced theme, or `null` when the global is unset, the
 * reference is empty, or the referenced theme has been deleted.
 */
async function resolveTheme(props: {
  ctx: QueryCtx
  field: "activeTheme" | "adminTheme"
}): Promise<ActiveTheme> {
  const settings = await getGlobal({
    ctx: props.ctx,
    config,
    slug: GLOBAL_SLUG_SITE_SETTINGS,
    access: { bypass: true },
  })
  if (!settings) {return null}

  const reference = settings[props.field] as string[] | undefined
  const themeId = reference?.[0]
  if (!themeId) {return null}

  return await props.ctx.db.get(themeId as Id<typeof TABLE_SLUG_THEMES>)
}

/**
 * The theme applied to the public site — `siteSettings.activeTheme`.
 *
 * Read by `<ThemeStyle />` in the root layout on every render.
 */
export const getActive = query({
  args: {},
  handler: async (ctx): Promise<ActiveTheme> => await resolveTheme({ ctx, field: "activeTheme" }),
})

/**
 * The theme applied to the admin panel.
 *
 * Falls back to `activeTheme` when `adminTheme` is unset, which is the default:
 * the admin adopts the site's palette. Setting `adminTheme` is the opt-out.
 */
export const getAdmin = query({
  args: {},
  handler: async (ctx): Promise<ActiveTheme> =>
    (await resolveTheme({ ctx, field: "adminTheme" })) ??
    (await resolveTheme({ ctx, field: "activeTheme" })),
})
