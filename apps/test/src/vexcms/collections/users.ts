import { BUILTIN_CONTRIBUTION_IDS, defineCollection, text } from "@vexcms/core";

import { TABLE_SLUG_USERS } from "~/db/constants";

export const users = defineCollection({
  slug: TABLE_SLUG_USERS,
  admin: {
    useAsTitle: "name",
    icon: "Users",
    components: {
      edit: {
        actionsMenu: {
          items: [{ id: BUILTIN_CONTRIBUTION_IDS.edit.duplicate, hidden: true }],
        },
      },
    },
  },
  labels: {
    singular: "User",
    plural: "Users",
  },
  fields: {
    name: text({ label: "Name", required: true }),
    // Add custom user fields here — the auth adapter already contributes
    // name/email/roles/etc. from Better Auth's schema.
  },
});
