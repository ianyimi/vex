// Stubbed — footers collection removed in rebuild (blocks field not yet rebuilt)
import { defineCollection, text } from "@vexcms/core"
import { TABLE_SLUG_FOOTERS } from "~/db/constants"
export const footers = defineCollection({ slug: TABLE_SLUG_FOOTERS, fields: { title: text() } })
