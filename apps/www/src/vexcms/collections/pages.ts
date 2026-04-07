// Stubbed — pages collection removed in rebuild (blocks, imageUrl fields not yet rebuilt)
import { defineCollection, text } from "@vexcms/core"
import { TABLE_SLUG_PAGES } from "~/db/constants"
export const pages = defineCollection({ slug: TABLE_SLUG_PAGES, fields: { title: text() } })
