import { defineCollection, text } from "@vexcms/core";

import { TABLE_SLUG_USERS } from "~/db/constants";

export const users = defineCollection({
  slug: TABLE_SLUG_USERS,
  admin: {
    icon: "Users",
  },
  labels: {
    singular: "User",
    plural: "Users",
  },
  fields: {
    newUserFieldTest: text({
      description: "A new user test field.",
      interfaceDescription: "something for the editor only",
    }),
  },
});
