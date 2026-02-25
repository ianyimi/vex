import { defineCollection, number, select, text } from "@vexcms/core"

export const users = defineCollection("users", {
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
