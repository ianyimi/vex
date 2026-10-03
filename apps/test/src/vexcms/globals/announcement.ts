import { checkbox, defineGlobal, text } from "@vexcms/core";

import { GLOBAL_SLUG_ANNOUNCEMENT } from "~/db/constants";

/**
 * Draft/publish test surface for versioned globals (versioning-drafts spec).
 *
 * `message` is required, so a draft with it cleared saves (lenient) but cannot
 * publish (strict). The `editor` role may draft this global but not publish or
 * unpublish it (`~/auth/access.ts`), covering the disabled-Publish path.
 */
export const announcement = defineGlobal({
  slug: GLOBAL_SLUG_ANNOUNCEMENT,
  label: "Announcement",
  admin: {
    icon: "Megaphone",
    description: "Site-wide banner. Versioned: edits are drafts until published.",
  },
  versions: {
    drafts: true,
  },
  fields: {
    message: text({
      label: "Message",
      required: true,
      description: "Banner text. Required to publish.",
    }),
    href: text({
      label: "Link",
      description: "Optional link target.",
    }),
    dismissible: checkbox({
      label: "Dismissible",
    }),
  },
});
