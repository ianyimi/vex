import { defineCollection, imageUrl, number, select, text } from "@vexcms/core"

import { TABLE_SLUG_USERS } from "~/db/constants"
import { auth } from "~/vexcms/auth"

export const users = defineCollection({
  slug: TABLE_SLUG_USERS,
  admin: {
    defaultColumns: ["name", "email", "createdAt", "image", "role"],
    group: "Admin",
    useAsTitle: "name",
  },
  auth,
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    image: imageUrl({
      label: "Image",
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
      hasMany: true,
      labels: {
        plural: "Roles",
        singular: "Role",
      },
      options: [
        { badgeColor: "#ff0000", label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Author", value: "author" },
        { badgeColor: "#00ff00", label: "Member", value: "member" },
        { badgeColor: "#333333", label: "User", value: "user" },
      ],
      required: true,
    }),
  },
  labels: {
    plural: "Users",
    singular: "User",
  },
})
