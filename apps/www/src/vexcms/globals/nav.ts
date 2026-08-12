import { array, defineGlobal, group, text } from "@vexcms/core";

import { GLOBAL_SLUG_NAV } from "~/db/constants";

export const nav = defineGlobal({
  slug: GLOBAL_SLUG_NAV,
  label: "Nav",
  fields: {
    items: array({
      items: group({
        fields: {
          title: text(),
          href: text(),
        },
      }),
    }),
  },
});
