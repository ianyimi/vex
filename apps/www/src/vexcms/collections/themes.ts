// Stubbed — themes collection removed in rebuild (color, tabs, ui fields not yet rebuilt)
import { defineCollection, text } from "@vexcms/core"
export const themes = defineCollection({ slug: "themes", fields: { name: text() } })
