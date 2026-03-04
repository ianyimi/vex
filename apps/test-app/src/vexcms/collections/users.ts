import { checkbox, defineCollection, number, select, text } from "@vexcms/core"

import { TABLE_SLUG_USERS } from "~/db/constants"

export const users = defineCollection(TABLE_SLUG_USERS, {
  admin: {
    group: "Admin",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    email: text({
      label: "Email",
      required: true,
    }),
    emailVerified: checkbox({
      label: "Email Verified",
      required: true,
    }),
    postCount: number({
      admin: {
        readOnly: true,
      },
      defaultValue: 0,
      label: "Post Count",
      min: 0,
    }),
    role: select({
      defaultValue: "author",
      label: "Role",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Author", value: "author" },
      ],
      required: true,
    }),
  },
  labels: {
    plural: "Users",
    singular: "User",
  },
})
