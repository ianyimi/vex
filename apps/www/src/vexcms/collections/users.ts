import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_USERS } from "~/db/constants"

export const users = defineCollection({
  slug: TABLE_SLUG_USERS,
  labels: { plural: "Users", singular: "User" },
  fields: {
    name: text({ label: "Name", required: true }),
  },
})
