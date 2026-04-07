// Stubbed — headers collection removed in rebuild (blocks field not yet rebuilt)
import { defineCollection, text } from "@vexcms/core"
import { TABLE_SLUG_HEADERS } from "~/db/constants"
export const headers = defineCollection({ slug: TABLE_SLUG_HEADERS, fields: { title: text() } })
