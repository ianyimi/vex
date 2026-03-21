import { checkbox, defineCollection, imageUrl, select, text } from "@vexcms/core"

import { TABLE_SLUG_USERS } from "~/db/constants"
import { auth } from "~/vexcms/auth"

export const users = defineCollection({
  slug: TABLE_SLUG_USERS,
  admin: {
    defaultColumns: ["name", "email", "createdAt", "role"],
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
    role: select({
      defaultValue: "user",
      hasMany: true,
      labels: {
        plural: "Roles",
        singular: "Role",
      },
      options: [
        { badgeColor: "#ff0000", label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { badgeColor: "#333333", label: "User", value: "user" },
      ],
      required: true,
    }),
    vex_onboarding_complete: checkbox({
      admin: { hidden: true },
      defaultValue: false,
      label: "Onboarding Complete",
    }),
  },
  labels: {
    plural: "Users",
    singular: "User",
  },
})
